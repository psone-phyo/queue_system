import { FormEvent, useState } from "react";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function StaffLoginPage() {
  const { signIn, staff, busy } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!busy && staff) return <Navigate to="/staff" replace />;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try { await signIn(email, password); navigate("/staff"); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in failed. Check your details."); }
    finally { setPending(false); }
  }

  return <div className="login-screen min-h-screen bg-clinic-50 p-5 sm:p-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><a href="/" className="inline-flex items-center gap-3"><span className="brand-mark"><Activity size={18} /></span><span className="text-sm font-bold text-clinic-900">queuewell <span className="font-normal text-slate-400">· staff</span></span></a><Link to="/" className="text-sm font-medium text-slate-500 hover:text-clinic-800">Back to patient page</Link></div>
    <div className="mx-auto grid min-h-[calc(100vh-110px)] max-w-5xl items-center gap-10 py-12 lg:grid-cols-[1fr_.85fr]">
      <section className="hidden lg:block"><span className="eyebrow"><ShieldCheck size={14} /> TEAM WORKSPACE</span><h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight tracking-[-.045em] text-clinic-900">Good care starts with a smooth queue.</h1><p className="mt-5 max-w-md text-lg leading-8 text-slate-500">Keep the front desk calm, the team in sync, and every patient moving comfortably.</p><div className="mt-10 flex gap-3"><div className="rounded-2xl border border-white bg-white/70 p-4 shadow-card"><b className="block text-2xl text-clinic-900">01</b><span className="mt-1 block text-xs text-slate-400">Call next</span></div><div className="rounded-2xl border border-white bg-white/70 p-4 shadow-card"><b className="block text-2xl text-clinic-900">02</b><span className="mt-1 block text-xs text-slate-400">Assign a room</span></div><div className="rounded-2xl border border-white bg-white/70 p-4 shadow-card"><b className="block text-2xl text-clinic-900">03</b><span className="mt-1 block text-xs text-slate-400">Care for people</span></div></div></section>
      <section className="mx-auto w-full max-w-md rounded-[30px] border border-white bg-white p-7 shadow-soft sm:p-10"><div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-100 text-clinic-700"><LockKeyhole size={21} /></div><span className="eyebrow">WELCOME BACK</span><h2 className="mt-2 text-2xl font-semibold text-slate-800">Sign in to your desk</h2><p className="mt-1 text-sm text-slate-400">Use your clinic staff account to continue.</p>
        <form onSubmit={(event) => void login(event)} className="mt-7 space-y-4"><div><label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="email">Work email</label><div className="relative"><Mail className="input-icon" size={17} /><input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="text-input pl-11" placeholder="name@clinic.com" /></div></div><div><label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="password">Password</label><div className="relative"><LockKeyhole className="input-icon" size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="text-input pl-11 pr-11" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="password-toggle">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button disabled={pending} className="primary-button mt-2 w-full">{pending ? "Signing in…" : <>Open queue desk <ArrowRight size={17} /></>}</button>
        </form><p className="mt-6 text-center text-xs text-slate-400">Need access? Ask your clinic administrator.</p>
      </section>
    </div>
  </div>;
}
