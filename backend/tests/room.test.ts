import request from "supertest";
import app from "../src/app";
import { RoomModel } from "../src/models/room.model";
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { logger } from "../src/config/logger";

const missingId = () => new mongoose.Types.ObjectId().toString();

describe("POST /rooms", () => {
    it("create a new room with active true", async () => {
        const res = await request(app)
            .post("/api/rooms")
            .send({ name: "Room 1", isActive: "true" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.name).toBe("Room 1");
        expect(res.body.isActive).toBe(true);
    })

    it("create a new room with active false", async () => {
        const res = await request(app)
            .post("/api/rooms")
            .send({ name: "Room 1", isActive: "false" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.name).toBe("Room 1");
        expect(res.body.isActive).toBe(false);
    })

    it("return invalid request for empty name and isActive", async () => {
        const res = await request(app)
            .post("/api/rooms")
            .send({ name: "", isActive: "" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Validation failed");
        const fields = res.body.details.map((d: { field: string }) => d.field);
        expect(fields.sort()).toEqual(["isActive", "name"]);
    })

    it("duplicate room name should return 409", async () => {
        await RoomModel.create({ name: "Room 1", isActive: true });
        const res = await request(app)
            .post("/api/rooms")
            .send({ name: "Room 1", isActive: "true" });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Room name already exists");
    })
})

describe("GET /api/rooms", () => {
  it("lists rooms and filters by name", async () => {
    await RoomModel.create([{ name: "Alpha", isActive: true }, { name: "Beta", isActive: true }]);

    const res = await request(app).get("/api/rooms").query({ name: "alp", isActive: "true" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alpha");
  });
});

describe("PUT /api/rooms/:id", () => {
  it("updates a room", async () => {
    const room = await RoomModel.create({ name: "Old", isActive: true });

    const res = await request(app)
      .put(`/api/rooms/${room.id}`)
      .send({ name: "New", isActive: "false" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New");
    expect(res.body.isActive).toBe(false);
  });

  it("returns 404 when room does not exist", async () => {
    const res = await request(app)
      .put(`/api/rooms/${missingId()}`)
      .send({ name: "New", isActive: "true" });

    expect(res.status).toBe(404);
  });

  it("returns 409 when name belongs to another room", async () => {
    await RoomModel.create({ name: "Taken" });
    const room = await RoomModel.create({ name: "Mine" });

    const res = await request(app)
      .put(`/api/rooms/${room.id}`)
      .send({ name: "Taken", isActive: "true" });

    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/rooms/:id", () => {
  it("deletes a room", async () => {
    const room = await RoomModel.create({ name: "Temp" });

    const res = await request(app).delete(`/api/rooms/${room.id}`);

    expect(res.status).toBe(204);
    expect(await RoomModel.findById(room.id)).toBeNull();
  });

  it("returns 404 when room does not exist", async () => {
    const res = await request(app).delete(`/api/rooms/${missingId()}`);

    expect(res.status).toBe(404);
  });
});
