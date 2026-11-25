import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, DoorOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import type { Room } from "../types";

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try { setRooms(await api<Room[]>("/api/rooms")); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load rooms."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function run(operation: () => Promise<unknown>, success: string) {
    setPending(true); setError(""); setMessage("");
    try { await operation(); setMessage(success); await load(); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "That action could not be completed."); return false; }
    finally { setPending(false); }
  }

  async function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await run(() => api("/api/rooms", { method: "POST", body: JSON.stringify({ name, isActive: true }) }), "Room added.")) setName("");
  }

  async function saveEdit(room: Room) {
    if (await run(() => api(`/api/rooms/${room._id}`, { method: "PUT", body: JSON.stringify({ name: editName, isActive: room.isActive }) }), "Room renamed.")) setEditingId("");
  }

  const toggle = (room: Room) => run(() => api(`/api/rooms/${room._id}`, { method: "PUT", body: JSON.stringify({ name: room.name, isActive: !room.isActive }) }), room.isActive ? "Room deactivated." : "Room activated.");
  const remove = (room: Room) => run(() => api(`/api/rooms/${room._id}`, { method: "DELETE" }), "Room deleted.");

  return <div className="mx-auto max-w-6xl"><div><span className="eyebrow">ADMIN · ROOMS</span><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">Treatment rooms</h1><p className="mt-1 text-sm text-slate-400">Rooms staff can assign patients to.</p></div>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_.82fr]">
      <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-card"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7"><div><h2 className="text-lg font-semibold text-slate-800">All rooms</h2><p className="mt-0.5 text-xs text-slate-400">{rooms.length} rooms</p></div><span className="rounded-xl bg-clinic-50 p-2.5 text-clinic-700"><DoorOpen size={18} /></span></div>
        {error && <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-7"><CircleAlert size={15} />{error}</div>}
        {message && <div role="status" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-clinic-50 px-3 py-2.5 text-sm text-clinic-800 sm:mx-7"><Check size={15} />{message}</div>}
        <div className="divide-y divide-slate-100 px-5 sm:px-7">{rooms.map((room) => <div key={room._id} className="flex flex-wrap items-center gap-3 py-4">
          {editingId === room._id
            ? <><input aria-label="Room name" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={50} className="text-input h-10 flex-1 text-sm" /><button disabled={pending || !editName.trim()} onClick={() => void saveEdit(room)} className="small-action small-action-green"><Check size={14} /> Save</button><button onClick={() => setEditingId("")} className="table-icon-action" aria-label="Cancel"><X size={14} /></button></>
            : <><div className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-700">{room.name}</b><span className="block text-xs text-slate-400">{!room.isActive ? "Inactive" : room.currentTicketId ? "In use" : "Free"}</span></div>
              <button disabled={pending} onClick={() => void toggle(room)} className="small-action">{room.isActive ? "Deactivate" : "Activate"}</button>
              <button aria-label={`Rename ${room.name}`} onClick={() => { setEditingId(room._id); setEditName(room.name); }} className="table-icon-action"><Pencil size={14} /></button>
              <button aria-label={`Delete ${room.name}`} disabled={pending || !!room.currentTicketId} onClick={() => void remove(room)} className="table-icon-action"><Trash2 size={14} /></button></>}
        </div>)}{rooms.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No rooms yet. Add your first one.</p>}</div></section>
      <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clinic-100 text-clinic-700"><DoorOpen size={19} /></span><div><h2 className="font-semibold text-slate-800">Add a room</h2><p className="text-xs text-slate-400">New rooms are active right away.</p></div></div>
        <form onSubmit={(e) => void addRoom(e)} className="space-y-4"><div><label htmlFor="room-name" className="mb-1.5 block text-xs font-semibold text-slate-500">Room name</label><input id="room-name" required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} className="text-input" placeholder="Room 1" /></div><button disabled={pending || !name.trim()} className="primary-button mt-1 w-full"><Plus size={16} /> Add room</button></form></section>
    </div></div>;
}
