import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel } from "../models/user.model";
import { redis } from "../config/redis";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import { Role } from "../constants/roles";

// ─── Redis key helpers ────────────────────────────────────────────────────────
// Storing the hashed token under a namespaced key makes it easy to find / delete.
// Key format:  refresh:<userId>:<tokenId>
// Using tokenId (a random suffix) lets one user have at most one active token
// per device if we ever want that; for now we keep it simple (one token total).
const REFRESH_PREFIX = "refresh";

function redisKey(userId: string, tokenId: string) {
  return `${REFRESH_PREFIX}:${userId}:${tokenId}`;
}

// 7 days in seconds – how long Redis keeps the refresh token before auto-expiring
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * signAccessToken
 * Creates a short-lived JWT (15 min by default) with the staff's id, role, name.
 * The frontend sends this as "Authorization: Bearer <token>" on every API request.
 */
function signAccessToken(payload: { id: string; role: Role; name: string }) {
  return jwt.sign(
    { sub: payload.id, role: payload.role, name: payload.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
  );
}

/**
 * signRefreshToken
 * Creates a longer-lived JWT (7 days) that can be exchanged for a new access token.
 * We embed a random tokenId so we can identify and revoke this exact token in Redis.
 */
function signRefreshToken(payload: { id: string; tokenId: string }) {
  return jwt.sign(
    { sub: payload.id, tid: payload.tokenId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );
}

/**
 * storeRefreshToken
 * Hash the raw refresh token before storing it in Redis.
 * If Redis is compromised, attackers get hashes — not usable tokens.
 * TTL matches the token expiry so Redis auto-cleans expired tokens.
 */
async function storeRefreshToken(userId: string, tokenId: string, rawToken: string) {
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  await redis.set(redisKey(userId, tokenId), hashed, "EX", REFRESH_TTL_SECONDS);
}

/**
 * verifyStoredRefreshToken
 * Re-hash the incoming token and compare it with the value in Redis.
 * Returns true only if they match (i.e. the token hasn't been rotated or revoked).
 */
async function verifyStoredRefreshToken(
  userId: string,
  tokenId: string,
  rawToken: string
): Promise<boolean> {
  const stored = await redis.get(redisKey(userId, tokenId));
  if (!stored) return false;
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(hashed));
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * login
 * 1. Find staff by email (select password back in since it has select:false)
 * 2. Reject inactive accounts
 * 3. Verify password with argon2
 * 4. Issue an access token + refresh token
 * 5. Store the hashed refresh token in Redis
 */
export async function login(email: string, password: string) {
  // .select("+password") overrides the select:false on the password field
  const staff = await UserModel.findOne({ email }).select("+password").lean();

  // Use a generic message so attackers can't distinguish "no account" from "wrong password"
  if (!staff) throw new AppError(401, "Invalid email or password");

  if (!staff.isActive) throw new AppError(403, "Account is deactivated");

  const passwordOk = await argon2.verify(staff.password as string, password);
  if (!passwordOk) throw new AppError(401, "Invalid email or password");

  const userId = (staff._id as any).toString();
  const tokenId = crypto.randomBytes(16).toString("hex"); // unique per login session

  const accessToken = signAccessToken({ id: userId, role: staff.role as Role, name: staff.name });
  const refreshToken = signRefreshToken({ id: userId, tokenId });

  await storeRefreshToken(userId, tokenId, refreshToken);

  return {
    accessToken,
    refreshToken,
    staff: { id: userId, name: staff.name, role: staff.role },
  };
}

/**
 * refresh
 * 1. Verify the JWT signature and expiry of the incoming refresh token
 * 2. Check Redis to confirm the token hasn't been rotated or revoked
 * 3. Delete the old token (rotation — one-time use)
 * 4. Issue a new access token + a new refresh token and store it
 *
 * Rotation means a stolen refresh token can only be used once before it's invalidated.
 */
export async function refresh(rawRefreshToken: string) {
  let payload: { sub: string; tid: string };

  try {
    payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const { sub: userId, tid: tokenId } = payload;

  const isValid = await verifyStoredRefreshToken(userId, tokenId, rawRefreshToken);
  if (!isValid) throw new AppError(401, "Refresh token has been revoked or already used");

  // Delete old token immediately (rotation)
  await redis.del(redisKey(userId, tokenId));

  // Fetch current staff info so the new token reflects any role/name changes
  const staff = await UserModel.findById(userId).lean();
  if (!staff || !staff.isActive) throw new AppError(401, "Account no longer valid");

  const newTokenId = crypto.randomBytes(16).toString("hex");
  const accessToken = signAccessToken({ id: userId, role: staff.role as Role, name: staff.name });
  const refreshToken = signRefreshToken({ id: userId, tokenId: newTokenId });

  await storeRefreshToken(userId, newTokenId, refreshToken);

  return { accessToken, refreshToken };
}

/**
 * logout
 * Delete the refresh token from Redis so it can never be used again.
 * The access token is short-lived and will expire on its own (we don't blocklist it).
 */
export async function logout(rawRefreshToken: string) {
  try {
    // Decode without throwing so we can still delete even if the token is expired
    const payload = jwt.decode(rawRefreshToken) as { sub: string; tid: string } | null;
    if (payload?.sub && payload?.tid) {
      await redis.del(redisKey(payload.sub, payload.tid));
    }
  } catch {
    // Silently ignore — if decoding fails there's nothing to delete
  }
}
