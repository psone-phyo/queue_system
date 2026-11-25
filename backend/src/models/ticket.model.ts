import { Schema, model, InferSchemaType } from "mongoose";
import { TICKET_STATUSES } from "../constants/ticketStatus";

const ticketSchema = new Schema(
  {
    queueDate:     { type: String, required: true },              // "2026-11-25" — resets daily
    number:        { type: Number, required: true },              // raw integer (1, 2, 3 …)
    displayNumber: { type: String, required: true },              // "A001", "A012" shown to patients
    name:          { type: String, required: true, trim: true },  // patient name
    source:        { type: String, enum: ["qr", "walk-in"], required: true },
    status:        { type: String, enum: [...TICKET_STATUSES], default: "waiting" },
    roomId:        { type: Schema.Types.ObjectId, ref: "Room", default: null }, // assigned room
    token:         { type: String, required: true },              // patient restore key (uuid)
    handledBy:     { type: Schema.Types.ObjectId, ref: "User", default: null },
    joinedAt:      { type: Date, default: () => new Date() },
    calledAt:      { type: Date, default: null },
    completedAt:   { type: Date, default: null },
    missedAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

// Composite unique: same date can't have duplicate number
ticketSchema.index({ queueDate: 1, number: 1 }, { unique: true });
// Fast lookup by token (restore cookie flow)
ticketSchema.index({ token: 1 });
// Fast queue listing and display queries
ticketSchema.index({ queueDate: 1, status: 1 });

export type Ticket = InferSchemaType<typeof ticketSchema>;
export const TicketModel = model<Ticket>("Ticket", ticketSchema);
