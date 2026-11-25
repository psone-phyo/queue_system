import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinPage } from "./JoinPage";
import { formatMinutes, statusLabel } from "../lib/format";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({ api: vi.fn() }));

describe("patient queue join", () => {
  beforeEach(() => vi.mocked(api).mockReset());

  it("keeps the submit button disabled until a name is entered", async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><JoinPage /></MemoryRouter>);
    const button = screen.getByRole("button", { name: /get my queue number/i });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/your full name/i), "   ");
    expect(button).toBeDisabled();
    await userEvent.clear(screen.getByLabelText(/your full name/i));
    await userEvent.type(screen.getByLabelText(/your full name/i), "Sam Lee");
    expect(button).toBeEnabled();
  });

  it("submits a name then navigates to the ticket page", async () => {
    vi.mocked(api).mockResolvedValue({ ticket: { displayNumber: "A001" } });
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/"]}><Routes><Route path="/" element={<JoinPage />} /><Route path="/ticket" element={<h1>Your ticket</h1>} /></Routes></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/your full name/i), "Sam Lee");
    await userEvent.click(screen.getByRole("button", { name: /get my queue number/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your ticket" })).toBeInTheDocument());
    expect(api).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({ method: "POST" }), false);
  });

  it("shows a link to the ticket instead of the form when a ticket is already active", async () => {
    vi.mocked(api).mockResolvedValue({ ticket: { displayNumber: "A007", status: "waiting" } });
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><JoinPage /></MemoryRouter>);
    expect(await screen.findByRole("link", { name: /view my ticket/i })).toHaveAttribute("href", "/ticket");
    expect(screen.queryByLabelText(/your full name/i)).not.toBeInTheDocument();
  });

});

describe("queue formatting", () => {
  it("formats wait times and statuses for patients", () => {
    expect(formatMinutes(0)).toBe("Less than a minute");
    expect(formatMinutes(75)).toBe("1 hr 15 min");
    expect(statusLabel("serving")).toBe("Now serving");
  });
});
