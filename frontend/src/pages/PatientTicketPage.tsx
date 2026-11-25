import { useEffect, useState } from "react";
import { ArrowLeft, BellRing, Clock3, Heart, MapPin, RefreshCw, TicketCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE, api } from "../lib/api";
import { formatMinutes, statusLabel } from "../lib/format";
import type { PatientTicket } from "../types";
import { StatusPill } from "../components/Brand";

export function PatientTicketPage() {
  const [data, setData] = useState<PatientTicket | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const result = await api<PatientTicket>("/api/tickets/my", {}, false);
        if (alive) { setData(result); setError(""); }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "We couldn't find your ticket.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    const socket = io(API_BASE, { withCredentials: true });
    socket.on("ticket:status", () => void load());
    socket.on("ticket:room", () => void load());
    return () => { alive = false; window.clearInterval(timer); socket.disconnect(); };
  }, []);

  if (!data && error) return <div className="mx-auto w-full max-w-xl rounded-[28px] bg-white p-8 text-center shadow-soft sm:p-12"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clinic-100 text-clinic-700"><TicketCheck /></span><h1 className="mt-5 text-2xl font-semibold text-slate-800">No active ticket found</h1><p className="mt-2 text-sm text-slate-500">Join the queue to save your place for today.</p><button onClick={() => navigate("/")} className="primary-button mx-auto mt-6">Join the queue</button></div>;
  if (!data) return <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-card"><RefreshCw size={17} className="animate-spin text-clinic-600" /> Finding your place…</div>;

  const { ticket, ahead, estimatedWaitMinutes } = data;
  const currentRoom = typeof ticket.roomId === "object" ? ticket.roomId?.name : undefined;
  return <div className="mx-auto w-full max-w-3xl">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-clinic-800"><ArrowLeft size={15} /> Back to clinic</Link>
    <div className="ticket-card mt-5 overflow-hidden rounded-[30px] bg-white shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-6 sm:px-10 sm:py-8"><div><span className="eyebrow">YOUR PLACE IS SAVED</span><h1 className="mt-2 text-2xl font-semibold text-slate-800">You’re in the queue, {ticket.name.split(" ")[0]}.</h1><p className="mt-1 text-sm text-slate-400">We’ll let you know when it’s your turn.</p></div><StatusPill status={ticket.status} /></div>
      <div className="grid md:grid-cols-[1fr_1fr]">
        <div className="queue-number-panel p-7 sm:p-10"><span className="text-xs font-semibold uppercase tracking-[.18em] text-clinic-700">YOUR QUEUE NUMBER</span><div className="mt-3 text-[84px] font-semibold leading-none tracking-[-.06em] text-clinic-900 sm:text-[104px]">{ticket.displayNumber}</div><div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} className="text-clinic-600" /> {currentRoom ? currentRoom : "Please wait in the reception area"}</div></div>
        <div className="grid grid-cols-2 gap-3 p-6 sm:p-8">
          <div className="metric-tile"><span className="metric-icon"><TicketCheck size={17} /></span><span className="metric-label">People ahead</span><b>{ahead}</b><small>{ahead === 1 ? "person" : "people"} before you</small></div>
          <div className="metric-tile"><span className="metric-icon"><Clock3 size={17} /></span><span className="metric-label">Est. wait</span><b className="!text-[23px]">{formatMinutes(estimatedWaitMinutes)}</b><small>Approximate time</small></div>
        </div>
      </div>
      {ticket.status === "serving" && <div className="mx-6 mb-6 flex items-center gap-3 rounded-2xl bg-clinic-50 px-5 py-4 text-sm text-clinic-900 sm:mx-10"><BellRing size={18} className="text-clinic-700" /><span><b>It’s your turn.</b> Please head to {currentRoom ?? "the front desk"}.</span></div>}
      {(ticket.status === "completed" || ticket.status === "missed" || ticket.status === "removed") && <div className="mx-6 mb-6 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:mx-10">{statusLabel(ticket.status)}. If you need help, please speak with reception.</div>}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:px-10"><span className="flex items-center gap-2"><Heart size={13} className="text-clinic-600" /> Thanks for your patience</span><span className="flex items-center gap-1"><RefreshCw size={12} /> Updates automatically</span></div>
    </div>
  </div>;
}
