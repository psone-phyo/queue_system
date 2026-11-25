import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Check, Clock3, RefreshCw, Ticket, UsersRound, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Stats } from "../types";

const cards = [
  { key: "total", label: "Tickets today", icon: Ticket, tone: "bg-clinic-100 text-clinic-700" },
  { key: "waiting", label: "Waiting now", icon: UsersRound, tone: "bg-amber-50 text-amber-600" },
  { key: "completed", label: "Completed", icon: Check, tone: "bg-sky-50 text-sky-600" },
  { key: "missed", label: "Missed", icon: UserX, tone: "bg-rose-50 text-rose-500" },
] as const;

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setStats(await api<Stats>("/api/stats")); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't load today's summary."); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);

  return <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="eyebrow">ADMIN OVERVIEW</span><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">A look at today</h1><p className="mt-1 text-sm text-slate-400">A simple snapshot of how the clinic is moving.</p></div><button onClick={() => void load()} className="secondary-button"><RefreshCw size={15} /> Refresh</button></div>
    {error && <div role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ key, label, icon: Icon, tone }) => <div key={key} className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={18} /></span><span className="stat-label">{label}</span><b>{stats?.[key] ?? "—"}</b><small>for {stats?.date ?? "today"}</small></div>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-card sm:p-8"><div className="flex items-start justify-between"><div><span className="eyebrow">QUEUE PULSE</span><h2 className="mt-1 text-xl font-semibold text-slate-800">Today’s flow</h2></div><span className="rounded-xl bg-clinic-50 p-2 text-clinic-700"><Clock3 size={19} /></span></div><div className="mt-8 grid grid-cols-3 gap-3"><div className="flow-metric"><b>{stats?.serving ?? "—"}</b><span>In service</span></div><div className="flow-metric"><b>{stats?.removed ?? "—"}</b><span>Skipped</span></div><div className="flow-metric"><b>{stats?.avgWaitMinutes ?? "—"}<small className="ml-1 text-sm font-medium">min</small></b><span>Average wait</span></div></div><div className="mt-7 rounded-2xl bg-clinic-50 px-5 py-4"><p className="text-sm font-medium text-clinic-900">Small moments add up.</p><p className="mt-1 text-xs leading-5 text-slate-500">Use the queue desk to keep room assignments and patient status up to date.</p></div></section>
      <section className="flex flex-col rounded-[24px] bg-clinic-900 p-6 text-white shadow-soft sm:p-8"><span className="eyebrow !text-clinic-200">KEEP THINGS RUNNING</span><h2 className="mt-3 text-2xl font-semibold leading-tight">Your team makes the difference.</h2><p className="mt-2 text-sm leading-6 text-white/60">Keep staff access current and make sure the front desk has the right support.</p><Link to="/staff/team" className="mt-auto inline-flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15">Manage clinic team <ArrowUpRight size={16} /></Link></section></div>
  </div>;
}
