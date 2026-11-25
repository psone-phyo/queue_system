import { useEffect, useState } from "react";
import { Clock3, Maximize, MonitorPlay, Sparkles } from "lucide-react";
import { io } from "socket.io-client";
import { Brand, StatusPill } from "../components/Brand";
import { API_BASE, api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { DisplayData, Ticket } from "../types";

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <span>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}</span>;
}

function NumberCard({ ticket }: { ticket: Ticket }) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card sm:px-5"><span className="text-2xl font-semibold tracking-tight text-clinic-900">{ticket.displayNumber}</span><span className="max-w-[44%] truncate text-xs text-slate-400">{ticket.name}</span></div>;
}

export function DisplayPage() {
  const [data, setData] = useState<DisplayData>({ serving: [], upcoming: [], missed: [] });
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try { const next = await api<DisplayData>("/api/queue/display", {}, false); if (alive) { setData(next); setError(false); } }
      catch { if (alive) setError(true); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    const socket = io(API_BASE, { withCredentials: true });
    socket.emit("join:display");
    socket.on("queue:updated", () => void refresh());
    socket.on("ticket:called", () => void refresh());
    socket.on("ticket:completed", () => void refresh());
    socket.on("ticket:missed", () => void refresh());
    return () => { alive = false; window.clearInterval(timer); socket.disconnect(); };
  }, []);

  async function fullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen?.();
  }

  // Repeat the list so one half is always wider than the box, then loop two halves seamlessly
  const marqueeItems = data.missed.length ? Array.from({ length: Math.ceil(10 / data.missed.length) * data.missed.length }, (_, i) => data.missed[i % data.missed.length]) : [];
  return <div className="display-page min-h-screen bg-clinic-50 px-5 py-5 sm:px-8 sm:py-7">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4"><Brand /><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-2 text-xs font-medium text-slate-500 shadow-card sm:flex"><span className="online-dot" /> Clinic is open</div><button onClick={() => void fullscreen()} aria-label="Toggle fullscreen" className="icon-button"><Maximize size={17} /></button></div></header>
      <div className="mt-9 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow"><MonitorPlay size={14} /> LIVE CLINIC BOARD</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-clinic-900 sm:text-4xl">Your next step, at a glance.</h1></div><div className="text-sm text-slate-400"><div>{formatDate(new Date())}</div><div className="mt-1 flex items-center gap-1.5"><Clock3 size={13} /><Clock /></div></div></div>
      {error && <div role="status" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Connecting to the clinic queue…</div>}
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <section className="now-serving-card min-w-0 rounded-[28px] p-6 text-white shadow-soft sm:p-9"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.2em] text-white/70">Now serving</span><span className="live-label"><span className="status-dot" /> LIVE</span></div>{data.serving.length ? <div className="mt-6 flex flex-col gap-3">{data.serving.map((ticket) => {
          const room = typeof ticket.roomId === "object" && ticket.roomId ? ticket.roomId.name : "";
          const numberSize = data.serving.length === 1 ? "text-[88px] sm:text-[120px]" : data.serving.length <= 3 ? "text-[56px] sm:text-[72px]" : "text-[44px] sm:text-[56px]";
          return <div key={ticket._id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 sm:px-7"><div className={`${numberSize} font-semibold leading-none tracking-[-.06em]`}>{ticket.displayNumber}</div><div className="flex min-w-0 flex-col items-end gap-1.5 text-right"><span className="rounded-lg bg-white/15 px-3 py-1.5 text-base font-semibold text-white sm:text-lg">{room || "Room pending"}</span><span className="max-w-[16rem] truncate text-xs text-white/70">{ticket.name}</span></div></div>;
        })}</div> : <div className="mt-14 sm:mt-20"><div className="text-5xl font-semibold tracking-tight sm:text-7xl">—</div><p className="mt-4 text-sm text-white/70">Your clinic team will call the next number shortly.</p></div>}<div className="mt-8 border-t border-white/15 pt-4 text-xs text-white/60"><Sparkles size={13} className="mr-1 inline" /> Please wait until your number is called.</div></section>
        <section className="min-w-0 rounded-[28px] border border-white bg-white p-5 shadow-card sm:p-7"><div className="flex items-center justify-between"><div><span className="eyebrow">COMING UP</span><h2 className="mt-1 text-xl font-semibold text-slate-800">Up next</h2></div><span className="rounded-full bg-clinic-50 px-3 py-1.5 text-xs font-semibold text-clinic-700">{data.upcoming.length} waiting</span></div><div className="mt-5 grid max-h-[22rem] gap-2.5 overflow-y-auto pr-1">{data.upcoming.length ? data.upcoming.map((ticket) => <NumberCard key={ticket._id} ticket={ticket} />) : <div className="empty-board"><Sparkles size={19} /><span>The queue is clear for now.</span></div>}</div><div className="mt-7 border-t border-slate-100 pt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-600">Missed numbers</h3><span className="text-xs text-slate-400">Recent</span></div>{data.missed.length ? <div className="marquee mt-3"><div className="marquee-track marquee-run">{[...marqueeItems, ...marqueeItems].map((ticket, index) => <span key={`${ticket._id}-${index}`} className="missed-chip">{ticket.displayNumber}</span>)}</div></div> : <p className="mt-3 text-xs text-slate-400">No missed numbers.</p>}</div></section>
      </div>
      <footer className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400"><StatusPill status="waiting" /> Thank you for your patience</footer>
    </div>
  </div>;
}
