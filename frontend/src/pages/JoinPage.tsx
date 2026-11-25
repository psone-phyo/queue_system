import { FormEvent, useState } from "react";
import { ArrowRight, Check, Clock3, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { PatientTicket } from "../types";

export function JoinPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api<PatientTicket>("/api/tickets", { method: "POST", body: JSON.stringify({ name }) }, false);
      navigate("/ticket");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't join the queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1.02fr] lg:gap-16">
    <section className="relative order-2 px-1 pb-3 pt-1 lg:order-1 lg:py-12">
      <span className="eyebrow"><Sparkles size={14} /> A BETTER VISIT STARTS HERE</span>
      <h1 className="mt-6 max-w-xl text-[42px] font-semibold leading-[1.08] tracking-[-.045em] text-clinic-900 sm:text-6xl">A calmer way to <span className="text-clinic-600">see the dentist.</span></h1>
      <p className="mt-5 max-w-md text-base leading-7 text-slate-500 sm:text-lg">Join the queue from your phone. We’ll keep your place and let you know when it’s your turn.</p>
      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-500">
        <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-clinic-600" /> No account needed</span>
        <span className="flex items-center gap-2"><Clock3 size={16} className="text-clinic-600" /> Live queue updates</span>
      </div>
      <div className="mt-11 hidden max-w-lg rounded-2xl border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur sm:flex">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clinic-100 text-clinic-700"><HeartPulse size={23} /></div>
        <div className="ml-4 flex-1"><div className="flex items-center justify-between"><b className="text-sm text-slate-700">Your visit, at your pace</b><span className="status-pill status-serving"><span className="status-dot" />Running smoothly</span></div><p className="mt-1 text-sm text-slate-400">Get your number, take a seat, and we’ll take it from here.</p></div>
      </div>
      <div className="decor-tooth decor-one"><Stethoscope size={22} /></div>
      <div className="decor-tooth decor-two"><Sparkles size={16} /></div>
    </section>

    <section className="order-1 lg:order-2">
      <div className="form-card overflow-hidden rounded-[30px] border border-white bg-white shadow-soft">
        <div className="border-b border-clinic-100 px-7 pb-5 pt-7 sm:px-10 sm:pt-9">
          <span className="eyebrow">WELCOME TO THE CLINIC</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">Join the queue</h2>
          <p className="mt-1 text-sm text-slate-400">A few details and your place is saved.</p>
        </div>
        <form onSubmit={join} className="px-7 pb-7 pt-6 sm:px-10 sm:pb-9">
          <label htmlFor="patient-name" className="mb-2 block text-sm font-medium text-slate-600">Your full name</label>
          <input id="patient-name" autoComplete="name" maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" className="text-input" />
          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button disabled={loading || !name.trim()} className="primary-button mt-5 w-full">{loading ? "Saving your place…" : <>Get my queue number <ArrowRight size={17} /></>}</button>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-clinic-50 p-3.5 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-clinic-600" /><span>Your place is saved on this device. You can close this page and come back anytime.</span></div>
        </form>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-7 py-4 text-xs text-slate-400 sm:px-10"><span className="flex items-center gap-1.5"><Check size={13} className="text-clinic-600" /> Quick and account-free</span><Link to="/display" className="font-medium text-clinic-700 hover:text-clinic-900">See clinic display</Link></div>
      </div>
    </section>
  </div>;
}
