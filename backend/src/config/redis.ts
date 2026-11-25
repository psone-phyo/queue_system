import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

// Single shared ioredis client – reused across the whole app (auth service, future rate-limit, etc.)
export const redis = new Redis(env.REDIS_URL, {
  // Don't crash the process on connection error; log and retry instead
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error(err, "Redis error"));
