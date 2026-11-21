import { Schema, model, InferSchemaType } from "mongoose";
import { TICKET_STATUSES } from "../constants/ticketStatus";

const ticketSchema = new Schema(
  {
    queueDate: { type: String, required: true },   // "2026-11-21", the number resets daily
    number: { type: Number, required: true },
    status: { type: String, enum: [...TICKET_STATUSES], default: "waiting" },
    token: { type: String, required: true },
    room: { type: String, required: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    calledAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    missedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ queueDate: 1, number: 1 }, { unique: true });
ticketSchema.index({ token: 1, status: 1 });

export type Ticket = InferSchemaType<typeof ticketSchema>;
export const TicketModel = model("Ticket", ticketSchema);