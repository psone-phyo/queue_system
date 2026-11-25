import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  counter: 0,
  incr: vi.fn(async () => ++redisMock.counter),
  expire: vi.fn(async () => 1),
  set: vi.fn(async () => "OK"),
  eval: vi.fn(async () => 1),
  del: vi.fn(async () => 1),
}));

vi.mock("../src/config/redis", () => ({ redis: redisMock }));

import app from "../src/app";
import { env } from "../src/config/env";
import { TicketModel } from "../src/models/ticket.model";
import { RoomModel } from "../src/models/room.model";
import { UserModel } from "../src/models/user.model";

function tokenFor(role: "admin" | "receptionist" = "receptionist") {
  return jwt.sign({ sub: "507f1f77bcf86cd799439011", role, name: "Test Staff" }, env.JWT_ACCESS_SECRET);
}

function authHeader(role: "admin" | "receptionist" = "receptionist") {
  return `Bearer ${tokenFor(role)}`;
}

describe("ticket APIs", () => {
  beforeEach(() => {
    redisMock.counter = 0;
    vi.clearAllMocks();
  });

  it("creates a patient ticket, sets a private restore cookie, and restores status", async () => {
    const joined = await request(app).post("/api/tickets").send({ name: "  Alex Patient  " });

    expect(joined.status).toBe(201);
    expect(joined.body.ticket).toMatchObject({
      name: "Alex Patient",
      source: "qr",
      number: 1,
      displayNumber: "A001",
      status: "waiting",
    });
    expect(joined.body.ticket).not.toHaveProperty("token");
    const cookie = joined.headers["set-cookie"]?.[0];
    expect(cookie).toContain("queue_ticket=");
    expect(cookie).toContain("HttpOnly");

    const restored = await request(app).get("/api/tickets/my").set("Cookie", cookie);
    expect(restored.status).toBe(200);
    expect(restored.body).toMatchObject({ ahead: 0, estimatedWaitMinutes: 0 });
    expect(restored.body.ticket.name).toBe("Alex Patient");
    expect(restored.body.ticket).not.toHaveProperty("token");
    expect(await TicketModel.countDocuments()).toBe(1);
  });

  it("validates patient names and reports a missing restore ticket", async () => {
    expect((await request(app).post("/api/tickets").send({ name: " " })).status).toBe(400);
    expect((await request(app).get("/api/tickets/my")).status).toBe(404);
  });

  it("allows authenticated staff to add walk-ins without setting a patient cookie", async () => {
    const response = await request(app).post("/api/tickets").set("Authorization", authHeader()).send({ name: "Walk In" });
    expect(response.status).toBe(201);
    expect(response.body.ticket.source).toBe("walk-in");
    expect(response.body.token).toBeTruthy();
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect((await request(app).post("/api/tickets").send({ name: "Unauthorized Walk In" })).status).toBe(201);
  });
});

describe("queue APIs", () => {
  beforeEach(() => {
    redisMock.counter = 0;
    vi.clearAllMocks();
  });

  it("protects staff queue listing and validates status filters", async () => {
    expect((await request(app).get("/api/queue")).status).toBe(401);
    expect((await request(app).get("/api/queue").set("Authorization", authHeader()).query({ status: "unknown" })).status).toBe(400);
    await request(app).post("/api/tickets").send({ name: "Queue Patient" });
    const listed = await request(app).get("/api/queue").set("Authorization", authHeader()).query({ status: "waiting" });
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
  });

  it("calls a patient, assigns a room, completes the ticket, and frees the room", async () => {
    await request(app).post("/api/tickets").send({ name: "Queue Patient" });
    const room = await RoomModel.create({ name: "Room A", isActive: true });

    const called = await request(app).post("/api/queue/next").set("Authorization", authHeader());
    expect(called.status).toBe(200);
    expect(called.body.status).toBe("serving");

    const assigned = await request(app).patch(`/api/tickets/${called.body._id}/room`).set("Authorization", authHeader()).send({ roomId: room.id });
    expect(assigned.status).toBe(200);
    expect(assigned.body.roomId.name).toBe("Room A");
    expect((await RoomModel.findById(room.id))?.currentTicketId?.toString()).toBe(called.body._id);

    const completed = await request(app).patch(`/api/tickets/${called.body._id}/completed`).set("Authorization", authHeader());
    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe("completed");
    expect((await RoomModel.findById(room.id))?.currentTicketId).toBeNull();
  });

  it("supports missed and removed transitions and exposes public display data", async () => {
    await request(app).post("/api/tickets").send({ name: "Missed Patient" });
    const called = await request(app).post("/api/queue/next").set("Authorization", authHeader());
    expect((await request(app).patch(`/api/tickets/${called.body._id}/missed`).set("Authorization", authHeader())).body.status).toBe("missed");

    await request(app).post("/api/tickets").send({ name: "Skipped Patient" });
    const queue = await request(app).get("/api/queue").set("Authorization", authHeader()).query({ status: "waiting" });
    const removed = await request(app).patch(`/api/tickets/${queue.body[0]._id}/remove`).set("Authorization", authHeader());
    expect(removed.body.status).toBe("removed");

    const display = await request(app).get("/api/queue/display");
    expect(display.status).toBe(200);
    expect(display.body.missed).toHaveLength(1);
  });
});

describe("staff, stats, and QR APIs", () => {
  it("restricts staff management to admins and creates receptionists with hashed passwords", async () => {
    expect((await request(app).get("/api/staff").set("Authorization", authHeader())).status).toBe(403);
    const created = await request(app).post("/api/staff").set("Authorization", authHeader("admin")).send({
      name: "Front Desk",
      email: "FRONT@example.com",
      password: "a-strong-password",
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ email: "front@example.com", role: "receptionist" });
    expect(created.body).not.toHaveProperty("password");
    const stored = await UserModel.findOne({ email: "front@example.com" }).select("+password");
    expect(stored?.password).not.toBe("a-strong-password");

    const duplicate = await request(app).post("/api/staff").set("Authorization", authHeader("admin")).send({
      name: "Duplicate",
      email: "front@example.com",
      password: "a-strong-password",
    });
    expect(duplicate.status).toBe(409);
  });

  it("exposes public QR URL and protects admin statistics", async () => {
    expect((await request(app).get("/api/qr")).body.url).toBe(`${env.CLIENT_URL}/join`);
    expect((await request(app).get("/api/stats").set("Authorization", authHeader())).status).toBe(403);
    const adminStats = await request(app).get("/api/stats").set("Authorization", authHeader("admin"));
    expect(adminStats.status).toBe(200);
    expect(adminStats.body).toMatchObject({ total: 0, waiting: 0, completed: 0 });
  });
});
