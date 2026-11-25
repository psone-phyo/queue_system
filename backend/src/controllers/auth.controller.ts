import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { LoginBody } from "../validators/auth.validator";
import { env } from "../config/env";

// Cookie name for the refresh token
const REFRESH_COOKIE = "refresh_token";

// Shared cookie options — httpOnly prevents JS from reading it (XSS protection),
// sameSite:strict stops CSRF on same-origin, secure:true in production only
function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: env.NODE_ENV === "production",
    // maxAge in milliseconds: 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth", // cookie is only sent to auth endpoints — not every request
  };
}

/**
 * POST /api/auth/login
 * Expects: { email, password } in body
 * Returns: { accessToken, staff } in JSON + sets httpOnly refresh_token cookie
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = res.locals.body as LoginBody;

    const result = await authService.login(email, password);

    // Refresh token lives in a cookie — the client never reads it directly
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

    // Access token returned in body — the client stores it in memory and sends it as a Bearer header
    res.status(200).json({
      accessToken: result.accessToken,
      staff: result.staff,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Expects: refresh_token in httpOnly cookie (no body needed)
 * Returns: { accessToken } in JSON + rotated refresh_token cookie
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];

    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const result = await authService.refresh(rawToken);

    // Set the new rotated refresh token
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

    res.status(200).json({ accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Expects: refresh_token in httpOnly cookie
 * Revokes the token in Redis and clears the cookie
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];

    if (rawToken) {
      await authService.logout(rawToken);
    }

    // Clear the cookie regardless — even if the token was already gone
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}
