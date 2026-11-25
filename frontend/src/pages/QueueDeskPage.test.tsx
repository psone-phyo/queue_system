import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueueDeskPage } from "./QueueDeskPage";
import { api } from "../lib/api";
import type { Room, Ticket } from "../types";

vi.mock("../lib/api", () => ({
  API_BASE: "http://localhost:3000",
  api: vi.fn(),
  getAccessToken: () => "test-access-token",
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on: vi.fn(), disconnect: vi.fn() }),
}));

const ticket: Ticket = {
  _id: "ticket-1",
  number: 1,
  displayNumber: "A001",
  name: "Alex Patient",
  source: "qr",
  status: "waiting",
  queueDate: "2026-11-25",
  joinedAt: "2026-11-25T08:00:00.000Z",
};

describe("receptionist queue desk", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
    const queue: Ticket[] = [{ ...ticket }];
    const rooms: Room[] = [];
    vi.mocked(api).mockImplementation((async (path: string, init?: RequestInit) => {
      if (path === "/api/queue/next" && init?.method === "POST") {
        queue[0] = { ...queue[0], status: "serving" };
        return queue[0];
      }
      if (path === "/api/queue") return [...queue];
      if (path === "/api/rooms") return rooms;
      throw new Error(`Unexpected API call: ${path}`);
    }) as typeof api);
  });

  it("shows the waiting patient and marks them serving when called next", async () => {
    render(<QueueDeskPage />);
    expect((await screen.findAllByText("Alex Patient")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("A001")).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: /call next/i }));
    await waitFor(() => expect(screen.getByText("Now serving")).toBeInTheDocument());
    expect(api).toHaveBeenCalledWith("/api/queue/next", { method: "POST" });
  });
});
