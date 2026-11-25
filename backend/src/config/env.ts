import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/queue_system"),

  // Redis – used to store hashed refresh tokens server-side so we can revoke them on logout
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Two separate secrets: a leaked access token cannot be used to forge a refresh token
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Token lifetimes expressed as strings that jsonwebtoken understands (e.g. "15m", "7d")
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;