import request from "supertest";
import app from "../src/app";
import { RoomModel } from "../src/models/room.model";
import { describe, it, expect } from "vitest";

describe("test invalid routes", () => {
    it("should return 404 for invalid route", async () => {
        const res = await request(app).get("/api/invalid-route");
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("message", "Route not found");
    })
})