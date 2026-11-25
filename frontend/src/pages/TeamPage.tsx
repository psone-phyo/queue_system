import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, Plus, ShieldCheck, Users } from "lucide-react";
import { api } from "../lib/api";

interface TeamMember { _id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }

export function TeamPage() {
  const [staff, setStaff] = useState<TeamMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try { setStaff(await api<TeamMember[]>("/api/staff")); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load staff."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      await api("/api/staff", { method: "POST", body: JSON.stringify({ name, email, password }) });
      setName(""); setEmail(""); setPassword(""); setMessage("Receptionist account created."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create account."); }
    finally { setPending(false); }
  }

  return <div className="mx-auto max-w-6xl"><div><span className="eyebrow">ADMIN · TEAM</span><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">Clinic team</h1><p className="mt-1 text-sm text-slate-400">Give the front desk the access they need.</p></div>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_.82fr]"><section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-card"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7"><div><h2 className="text-lg font-semibold text-slate-800">Staff accounts</h2><p className="mt-0.5 text-xs text-slate-400">{staff.length} team members</p></div><span className="rounded-xl bg-clinic-50 p-2.5 text-clinic-700"><Users size={18} /></span></div>{error && <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-7"><CircleAlert size={15} />{error}</div>}{message && <div role="status" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-clinic-50 px-3 py-2.5 text-sm text-clinic-800 sm:mx-7"><Check size={15} />{message}</div>}<div className="divide-y divide-slate-100 px-5 sm:px-7">{staff.map((person) => <div key={person._id} className="flex items-center gap-3 py-4"><span className="table-avatar h-10 w-10 text-sm">{person.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-700">{person.name}</b><span className="block truncate text-xs text-slate-400">{person.email}</span></div><span className="hidden rounded-full bg-clinic-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-clinic-700 sm:inline-flex">{person.role}</span><span className={`h-2 w-2 rounded-full ${person.isActive ? "bg-clinic-500" : "bg-slate-300"}`} title={person.isActive ? "Active" : "Inactive"} /></div>)}{staff.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No staff accounts yet.</p>}</div></section>
      <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clinic-100 text-clinic-700"><ShieldCheck size={19} /></span><div><h2 className="font-semibold text-slate-800">Add a receptionist</h2><p className="text-xs text-slate-400">They’ll be able to manage today’s queue.</p></div></div><form onSubmit={(event) => void createStaff(event)} className="space-y-4"><div><label htmlFor="staff-name" className="mb-1.5 block text-xs font-semibold text-slate-500">Full name</label><input id="staff-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="text-input" placeholder="Jordan Lee" /></div><div><label htmlFor="staff-email" className="mb-1.5 block text-xs font-semibold text-slate-500">Work email</label><input id="staff-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="text-input" placeholder="jordan@clinic.com" /></div><div><label htmlFor="staff-password" className="mb-1.5 block text-xs font-semibold text-slate-500">Temporary password</label><input id="staff-password" required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="text-input" placeholder="At least 8 characters" /></div><button disabled={pending} className="primary-button mt-1 w-full">{pending ? "Creating account…" : <><Plus size={16} /> Create receptionist account</>}</button></form><p className="mt-4 text-center text-[11px] text-slate-400">Role is limited to receptionist for safety.</p></section></div>
  </div>;
}
