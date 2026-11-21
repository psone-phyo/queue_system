import { Schema, model, InferSchemaType } from "mongoose";

const roomSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Room = InferSchemaType<typeof roomSchema>;
export const RoomModel = model("Room", roomSchema);