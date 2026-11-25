import { Activity, Sparkles } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="group inline-flex items-center gap-3" aria-label="Queuewell home">
      <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
      {!compact && <span className="leading-tight">
        <span className="block text-sm font-bold tracking-wide text-clinic-900">queuewell</span>
        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[.22em] text-slate-400">dental clinic</span>
      </span>}
    </a>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === "serving" ? "status-serving"
    : status === "completed" ? "status-completed"
    : status === "missed" ? "status-missed"
    : status === "removed" ? "status-neutral"
    : "status-waiting";
  const label = status === "serving" ? "Now serving" : `${status[0].toUpperCase()}${status.slice(1)}`;
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{label}</span>;
}

export function PublicFooter() {
  return <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-clinic-200/70 pt-5 text-xs text-slate-400">
    <span className="inline-flex items-center gap-2"><Sparkles size={13} /> A little more calm in your clinic visit.</span>
    <span>Queuewell · Dental clinic</span>
  </footer>;
}
