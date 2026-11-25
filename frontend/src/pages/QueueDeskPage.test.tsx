import { render, screen, waitFor, within } from "@testing-library/react";
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
    const rooms: Room[] = [{ _id: "room-1", name: "Room A", isActive: true, currentTicketId: null }, { _id: "room-2", name: "Room B", isActive: true, currentTicketId: "other" }];
    vi.mocked(api).mockImplementation((async (path: string, init?: RequestInit) => {
      if (path === "/api/queue/next" && init?.method === "POST") {
        queue[0] = { ...queue[0], status: "serving" };
        return queue[0];
      }
      if (path === "/api/tickets/ticket-1/room") { queue[0] = { ...queue[0], roomId: { _id: "room-1", name: "Room A", isActive: true } }; return queue[0]; }
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

  it("opens a room popup after calling, offering only free rooms, and keeps Edit room afterwards", async () => {
    render(<QueueDeskPage />);
    await screen.findAllByText("A001");
    await userEvent.click(screen.getByRole("button", { name: /call next/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Room A");
    expect(dialog).not.toHaveTextContent("Room B");
    await userEvent.selectOptions(screen.getByLabelText(/available rooms/i), "room-1");
    await userEvent.click(within(dialog).getByRole("button", { name: "Assign" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: /edit room/i })).toBeInTheDocument();
  });
});
