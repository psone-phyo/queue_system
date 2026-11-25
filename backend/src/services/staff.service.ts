import argon2 from "argon2";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/appError";
import { CreateStaffBody } from "../validators/staff.validator";

/** Create a new receptionist account (admin only — Q31) */
export async function createReceptionist(data: CreateStaffBody) {
  const exists = await UserModel.exists({ email: data.email });
  if (exists) throw new AppError(409, "Email already in use");

  const passwordHash = await argon2.hash(data.password);

  let staff;
  try {
    staff = await UserModel.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: "receptionist", // role is always receptionist — only seed creates admins
      isActive: true,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw new AppError(409, "Email already in use");
    throw err;
  }

  // Never return the password hash
  return { id: staff._id, name: staff.name, email: staff.email, role: staff.role, isActive: staff.isActive };
}

/** List all staff accounts — password excluded by projection */
export async function listStaff() {
  return UserModel.find({}).select("-password").sort({ createdAt: -1 }).lean();
}
