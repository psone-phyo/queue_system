import { Types } from "mongoose";
import { TicketModel } from "../models/ticket.model";
import { RoomModel } from "../models/room.model";
import { redis } from "../config/redis";
import { AppError } from "../utils/appError";
import { getIO } from "../config/socket";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Emit socket events safely — no-op when socket is not yet initialized (e.g. tests) */
function emit(rooms: string[], event: string, data: unknown) {
  try {
    const io = getIO();
    rooms.forEach((r) => io.to(r).emit(event, data));
  } catch {
    // Socket not initialized — skip
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/** GET /api/queue — today's ticket list, optionally filtered by status (Q23) */
export async function getQueue(status?: string) {
  const filter: Record<string, unknown> = { queueDate: getTodayDate() };
  if (status) filter.status = status;
  return TicketModel.find(filter)
    .sort({ number: 1 })
    .populate("roomId", "name")
    .lean();
}

/**
 * callNext — atomically picks the next waiting ticket using a Redis lock
 * so two receptionists clicking at the same time never call the same patient (Q24).
 */
export async function callNext(staffId: string) {
  const LOCK = "queue:call:lock";
  const lockToken = crypto.randomUUID();
  const locked = await redis.set(LOCK, lockToken, "EX", 30, "NX");
  if (!locked) {
    throw new AppError(409, "Another receptionist is calling right now — try again in a moment");
  }

  try {
    const ticket = await TicketModel.findOne({
      queueDate: getTodayDate(),
      status: "waiting",
    }).sort({ number: 1 });

    if (!ticket) throw new AppError(404, "No waiting patients");

    ticket.status = "serving";
    ticket.calledAt = new Date();
    ticket.handledBy = new Types.ObjectId(staffId) as any;
    await ticket.save();

    emit(["display"], "ticket:called", { ticketId: ticket._id, displayNumber: ticket.displayNumber, number: ticket.number });
    emit(["dashboard"], "queue:updated", {});
    emit([`patient:${ticket.token}`], "ticket:status", { status: "serving", displayNumber: ticket.displayNumber });

    return ticket;
  } finally {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      LOCK,
      lockToken
    );
  }
}

/** PATCH /:id/room — assign a room to a serving ticket (Q25) */
export async function assignRoom(ticketId: string, roomId: string, staffId: string) {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.status !== "serving") throw new AppError(400, "Can only assign a room to a serving ticket");

  const room = await RoomModel.findById(roomId);
  if (!room || !room.isActive) throw new AppError(404, "Room not found or inactive");

  // Prevent double-booking the same room (Q25)
  const claimed = await RoomModel.findOneAndUpdate(
    { _id: room._id, isActive: true, $or: [{ currentTicketId: null }, { currentTicketId: ticket._id }] },
    { currentTicketId: ticket._id },
    { new: true }
  );
  if (!claimed) throw new AppError(409, "Room is already occupied by another patient");

  const previousRoomId = ticket.roomId;

  ticket.roomId = new Types.ObjectId(roomId) as any;
  ticket.handledBy = new Types.ObjectId(staffId) as any;
  try {
    await ticket.save();
  } catch (err) {
    if (!previousRoomId || !previousRoomId.equals(room._id)) {
      await RoomModel.findOneAndUpdate({ _id: room._id, currentTicketId: ticket._id }, { currentTicketId: null });
    }
    throw err;
  }
  if (previousRoomId && !previousRoomId.equals(room._id)) {
    await RoomModel.findOneAndUpdate({ _id: previousRoomId, currentTicketId: ticket._id }, { currentTicketId: null });
  }

  emit([`patient:${ticket.token}`], "ticket:room", { roomName: room.name });
  emit(["display", "dashboard"], "queue:updated", {});

  return TicketModel.findById(ticket._id).populate("roomId", "name").lean();
}

/** PATCH /:id/missed — mark a ticket missed (Q26) */
export async function markMissed(ticketId: string, staffId: string) {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (!["waiting", "serving"].includes(ticket.status)) {
    throw new AppError(400, "Ticket cannot be marked as missed in its current state");
  }

  if (ticket.roomId) {
    await RoomModel.findByIdAndUpdate(ticket.roomId, { currentTicketId: null });
  }

  ticket.status = "missed";
  ticket.missedAt = new Date();
  ticket.handledBy = new Types.ObjectId(staffId) as any;
  await ticket.save();

  emit(["display"], "ticket:missed", { ticketId: ticket._id, displayNumber: ticket.displayNumber });
  emit(["dashboard"], "queue:updated", {});
  emit([`patient:${ticket.token}`], "ticket:status", { status: "missed" });

  return ticket;
}

/** PATCH /:id/completed — mark a ticket completed and free the room (Q27) */
export async function markCompleted(ticketId: string, staffId: string) {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.status !== "serving") {
    throw new AppError(400, "Can only complete a ticket that is currently serving");
  }

  if (ticket.roomId) {
    await RoomModel.findByIdAndUpdate(ticket.roomId, { currentTicketId: null });
  }

  ticket.status = "completed";
  ticket.completedAt = new Date();
  ticket.handledBy = new Types.ObjectId(staffId) as any;
  await ticket.save();

  emit(["display"], "ticket:completed", { ticketId: ticket._id, displayNumber: ticket.displayNumber });
  emit(["dashboard"], "queue:updated", {});
  emit([`patient:${ticket.token}`], "ticket:status", { status: "completed" });

  return ticket;
}

/** PATCH /:id/remove — skip / remove a ticket from the queue (Q28) */
export async function removeTicket(ticketId: string, staffId: string) {
  const ticket = await TicketModel.findById(ticketId);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (["completed", "removed"].includes(ticket.status)) {
    throw new AppError(400, "Ticket is already finalized");
  }

  if (ticket.roomId) {
    await RoomModel.findByIdAndUpdate(ticket.roomId, { currentTicketId: null });
  }

  ticket.status = "removed";
  ticket.handledBy = new Types.ObjectId(staffId) as any;
  await ticket.save();

  emit(["dashboard"], "queue:updated", {});
  emit([`patient:${ticket.token}`], "ticket:status", { status: "removed" });

  return ticket;
}

/** GET /api/queue/display — public display screen data (Q19–Q21) */
export async function getDisplay() {
  const date = getTodayDate();
  const [serving, upcoming, missed] = await Promise.all([
    TicketModel.find({ queueDate: date, status: "serving" })
      .populate("roomId", "name")
      .sort({ calledAt: -1 })
      .lean(),
    TicketModel.find({ queueDate: date, status: "waiting" })
      .sort({ number: 1 })
      .limit(50)
      .lean(),
    TicketModel.find({ queueDate: date, status: "missed" })
      .sort({ missedAt: -1 })
      .limit(10)
      .lean(),
  ]);
  return { serving, upcoming, missed };
}
