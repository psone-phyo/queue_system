import { Schema, model, InferSchemaType } from "mongoose";

const roomSchema = new Schema(
  {
    name:            { type: String, required: true, unique: true, trim: true },
    isActive:        { type: Boolean, default: true },
    // Tracks which ticket is currently being served in this room (null = free)
    currentTicketId: { type: Schema.Types.ObjectId, ref: "Ticket", default: null },
  },
  { timestamps: true }
);

export type Room = InferSchemaType<typeof roomSchema>;
export const RoomModel = model<Room>("Room", roomSchema);
