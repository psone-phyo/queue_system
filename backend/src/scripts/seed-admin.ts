/**
 * Seed script: creates the first admin account.
 * Run once with:  npx tsx src/scripts/seed-admin.ts
 *
 * Uses env vars from .env — make sure JWT secrets are set before running.
 */
import "dotenv/config";
import mongoose from "mongoose";
import argon2 from "argon2";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";

const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@clinic.local",
  password: "Admin@1234!", // Change this immediately after first login
  role: "admin" as const,
};

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await UserModel.findOne({ email: DEFAULT_ADMIN.email });

  if (existing) {
    console.log(`Admin already exists: ${DEFAULT_ADMIN.email} — skipping.`);
    await mongoose.disconnect();
    return;
  }

  // Hash the password with argon2 (same algorithm the login service uses)
  const passwordHash = await argon2.hash(DEFAULT_ADMIN.password);

  await UserModel.create({
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    password: passwordHash,
    role: DEFAULT_ADMIN.role,
    isActive: true,
  });

  console.log("✅ Admin account created");
  console.log(`   Email   : ${DEFAULT_ADMIN.email}`);
  console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  console.log("   ⚠️  Change the password immediately after first login.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
