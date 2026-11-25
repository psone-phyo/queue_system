import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, ChevronDown, CircleAlert, Clock3, Plus, RefreshCw, Search, SkipForward, Stethoscope, UserRoundPlus, Volume2 } from "lucide-react";
import { io } from "socket.io-client";
import { API_BASE, api, getAccessToken } from "../lib/api";
import type { Room, Ticket } from "../types";
import { StatusPill } from "../components/Brand";

function roomId(room: Ticket["roomId"]) {
  if (typeof room === "object" && room) return room._id;
  return room ?? "";
}

function roomName(room: Ticket["roomId"]) {
  if (typeof room === "object" && room) return room.name;
  return "—";
}

export function QueueDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<Ticket | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("");

  const load = useCallback(async () => {
    try {
      const [queue, availableRooms] = await Promise.all([
        api<Ticket[]>("/api/queue"),
        api<Room[]>("/api/rooms"),
      ]);
      setTickets(queue);
      setRooms(availableRooms.filter((room) => room.isActive));
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load the queue."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    const socket = io(API_BASE, { withCredentials: true, auth: { accessToken: getAccessToken() } });
    socket.on("connect", () => socket.emit("join:dashboard"));
    socket.on("queue:updated", () => void load());
    socket.on("ticket:called", () => void load());
    socket.on("ticket:completed", () => void load());
    return () => { window.clearInterval(timer); socket.disconnect(); };
  }, [load]);

  const waiting = useMemo(() => tickets.filter((ticket) => ticket.status === "waiting"), [tickets]);
  const serving = useMemo(() => tickets.filter((ticket) => ticket.status === "serving"), [tickets]);
  const completed = useMemo(() => tickets.filter((ticket) => ticket.status === "completed"), [tickets]);
  const filtered = useMemo(() => tickets.filter((ticket) => {
    const matchesStatus = filter === "all" || ticket.status === filter;
    const term = search.toLowerCase().trim();
    return matchesStatus && (!term || ticket.name.toLowerCase().includes(term) || ticket.displayNumber.toLowerCase().includes(term));
  }), [tickets, filter, search]);

  async function action(id: string, operation: () => Promise<unknown>, success: string) {
    setBusyId(id); setMessage(""); setError("");
    try { await operation(); setMessage(success); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "That action could not be completed."); }
    finally { setBusyId(""); }
  }

  async function callNext() {
    let called: Ticket | undefined;
    await action("next", async () => { called = await api<Ticket>("/api/queue/next", { method: "POST" }); }, "Next patient called.");
    if (called) openAssign(called);
  }

  function openAssign(ticket: Ticket) {
    setAssigning(ticket);
    setSelectedRoom(roomId(ticket.roomId));
  }

  // Rooms that are free, plus the one this ticket already occupies (so it can be kept or changed)
  const assignableRooms = useMemo(() => !assigning ? [] : rooms.filter((room) => !room.currentTicketId || room.currentTicketId === assigning._id), [rooms, assigning]);

  async function confirmAssign() {
    if (!assigning || !selectedRoom) return;
    const ticket = assigning;
    await action(ticket._id, () => api(`/api/tickets/${ticket._id}/room`, { method: "PATCH", body: JSON.stringify({ roomId: selectedRoom }) }), "Room assigned.");
    setAssigning(null);
  }

  async function addWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action("walk-in", () => api("/api/tickets", { method: "POST", body: JSON.stringify({ name: walkInName }) }), `${walkInName.trim()} added to the queue.`);
    setWalkInName("");
  }

  async function updateStatus(ticket: Ticket, status: "missed" | "completed" | "removed") {
    const endpoint = status === "missed" ? "missed" : status === "completed" ? "completed" : "remove";
    const label = status === "removed" ? "Patient skipped." : status === "missed" ? "Patient marked missed." : "Visit completed.";
    await action(ticket._id, () => api(`/api/tickets/${ticket._id}/${endpoint}`, { method: "PATCH" }), label);
  }

  return <div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="eyebrow">FRONT DESK</span><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">Queue desk</h1><p className="mt-1 text-sm text-slate-400">A clear view of every patient and their next step.</p></div><button onClick={() => void load()} className="secondary-button"><RefreshCw size={15} /> Refresh</button></div>
    {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><CircleAlert size={17} />{error}</div>}
    {message && <div role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-clinic-50 px-4 py-3 text-sm text-clinic-800"><Check size={17} />{message}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="stat-card"><span className="stat-icon bg-clinic-100 text-clinic-700"><Clock3 size={18} /></span><span className="stat-label">Waiting</span><b>{waiting.length}</b><small>patients in line</small></div>
      <div className="stat-card"><span className="stat-icon bg-sky-50 text-sky-600"><Volume2 size={18} /></span><span className="stat-label">In service</span><b>{serving.length}</b><small>being seen now</small></div>
      <div className="stat-card"><span className="stat-icon bg-violet-50 text-violet-600"><Check size={18} /></span><span className="stat-label">Completed</span><b>{completed.length}</b><small>visits finished today</small></div>
      <div className="call-next-card"><div><span className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">UP NEXT</span><div className="mt-2 text-2xl font-semibold">{waiting[0]?.displayNumber ?? "—"}</div><p className="mt-1 text-xs text-white/70">{waiting[0]?.name ?? "No one waiting right now"}</p></div><button disabled={!waiting.length || busyId === "next"} onClick={() => void callNext()} className="call-next-button">{busyId === "next" ? "Calling…" : <>Call next <ArrowUpRight size={15} /></>}</button></div>
    </div>

    {serving.length > 0 && <div className="mt-5 space-y-3">{serving.map((current) => <section key={current._id} className="current-patient rounded-2xl border border-clinic-200 bg-clinic-50/80 p-4 sm:flex sm:items-center sm:justify-between sm:p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-clinic-700 shadow-card"><Stethoscope size={19} /></span><div><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-clinic-700">NOW SERVING</span><div className="mt-0.5 flex flex-wrap items-center gap-2"><b className="text-lg text-slate-800">{current.displayNumber}</b><span className="text-sm text-slate-500">{current.name}</span></div></div></div><div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0"><button onClick={() => openAssign(current)} className="small-action">{roomName(current.roomId) === "—" ? "Assign room" : `Room: ${roomName(current.roomId)} · Change`}</button><button disabled={busyId === current._id} onClick={() => void updateStatus(current, "missed")} className="small-action">Missed</button><button disabled={busyId === current._id} onClick={() => void updateStatus(current, "completed")} className="small-action small-action-green"><Check size={14} /> Complete</button></div></section>)}</div>}

    <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7"><div><h2 className="text-lg font-semibold text-slate-800">Today’s patients</h2><p className="mt-0.5 text-xs text-slate-400">Queue updates automatically</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="input-icon" size={15} /><input aria-label="Search patients" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or number" className="text-input h-10 w-52 pl-9 text-xs" /></div><div className="relative"><select aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="text-select h-10 pr-8 text-xs"><option value="all">All statuses</option><option value="waiting">Waiting</option><option value="serving">Serving</option><option value="missed">Missed</option><option value="completed">Completed</option><option value="removed">Removed</option></select><ChevronDown size={12} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" /></div></div></div>
      <div className="overflow-x-auto"><table className="queue-table"><thead><tr><th>Queue no.</th><th>Patient</th><th>Joined</th><th>Room</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{filtered.map((ticket) => <tr key={ticket._id}><td><span className="table-ticket-number">{ticket.displayNumber}</span></td><td><div className="flex items-center gap-2.5"><span className="table-avatar">{ticket.name.slice(0, 1).toUpperCase()}</span><span className="font-medium text-slate-700">{ticket.name}</span><span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-400 xl:inline">{ticket.source === "walk-in" ? "walk-in" : "online"}</span></div></td><td className="text-slate-400">{new Date(ticket.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td><td className="text-slate-500">{roomName(ticket.roomId)}</td><td><StatusPill status={ticket.status} /></td><td><div className="flex justify-end gap-1.5">{ticket.status === "waiting" && waiting[0]?._id === ticket._id && <button disabled={busyId === "next"} onClick={() => void callNext()} className="table-action table-action-call"><Volume2 size={13} /> Call</button>}{ticket.status === "waiting" && <button aria-label={`Skip ${ticket.displayNumber}`} disabled={busyId === ticket._id} onClick={() => void updateStatus(ticket, "removed")} className="table-icon-action"><SkipForward size={14} /></button>}{ticket.status === "serving" && <button onClick={() => openAssign(ticket)} className="table-action">{roomName(ticket.roomId) === "—" ? "Assign" : "Edit room"}</button>}{ticket.status === "serving" && <button disabled={busyId === ticket._id} onClick={() => void updateStatus(ticket, "completed")} className="table-action table-action-complete"><Check size={13} /> Complete</button>}{ticket.status === "serving" && <button disabled={busyId === ticket._id} onClick={() => void updateStatus(ticket, "missed")} className="table-icon-action" title="Mark missed"><ArrowDown size={14} /></button>}</div></td></tr>)}</tbody></table>{loading && <div className="p-12 text-center text-sm text-slate-400">Loading the queue…</div>}{!loading && filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-400">No patients match this view.</div>}</div>
      <form onSubmit={(event) => void addWalkIn(event)} className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-7"><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><UserRoundPlus size={16} className="text-clinic-700" /> Add walk-in</div><input value={walkInName} onChange={(event) => setWalkInName(event.target.value)} required maxLength={100} placeholder="Patient full name" className="text-input h-10 flex-1 bg-white text-sm" /><button disabled={busyId === "walk-in"} className="secondary-button h-10"><Plus size={15} /> Add to queue</button></form>
    </section>

    {assigning && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="assign-title" onClick={() => setAssigning(null)}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft" onClick={(event) => event.stopPropagation()}>
        <h2 id="assign-title" className="text-lg font-semibold text-slate-800">Assign a room</h2>
        <p className="mt-1 text-sm text-slate-500">{assigning.displayNumber} · {assigning.name}</p>
        <label htmlFor="assign-room" className="mb-1.5 mt-5 block text-xs font-semibold text-slate-500">Available rooms</label>
        <select id="assign-room" value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)} className="text-select w-full"><option value="">Select a room</option>{assignableRooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select>
        {assignableRooms.length === 0 && <p className="mt-2 text-xs text-amber-600">No rooms are free right now.</p>}
        <div className="mt-6 flex justify-end gap-2"><button onClick={() => setAssigning(null)} className="secondary-button">Later</button><button disabled={!selectedRoom || busyId === assigning._id} onClick={() => void confirmAssign()} className="primary-button">Assign</button></div>
      </div>
    </div>}
    <p className="mt-4 text-center text-xs text-slate-400"><RefreshCw size={12} className="mr-1 inline" /> Syncs every few seconds</p>
  </div>;
}
