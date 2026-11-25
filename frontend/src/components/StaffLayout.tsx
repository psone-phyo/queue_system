import { Activity, BarChart3, LogOut, MonitorPlay, Settings2, Users, WandSparkles } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function StaffLayout() {
  const { staff, signOut } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }: { isActive: boolean }) => `side-link ${isActive ? "side-link-active" : ""}`;

  async function logout() {
    await signOut();
    navigate("/staff/login");
  }

  return <div className="staff-shell">
    <aside className="staff-sidebar">
      <a href="/staff" className="flex items-center gap-3 px-2 py-2">
        <span className="brand-mark brand-mark-light"><Activity size={18} strokeWidth={2.5} /></span>
        <span className="text-[15px] font-bold tracking-wide text-white">queuewell</span>
      </a>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="flex flex-col gap-1">
        <NavLink to="/staff" end className={navClass}><Settings2 size={17} /> Queue desk</NavLink>
        {staff?.role === "admin" && <>
          <NavLink to="/staff/overview" className={navClass}><BarChart3 size={17} /> Overview</NavLink>
          <NavLink to="/staff/team" className={navClass}><Users size={17} /> Team</NavLink>
        </>}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-note"><WandSparkles size={17} /><div><b>Keep it moving</b><span>One patient at a time.</span></div></div>
      <NavLink to="/display" className="side-link"><MonitorPlay size={17} /> Public display</NavLink>
      <button onClick={() => void logout()} className="side-link w-full text-left"><LogOut size={17} /> Sign out</button>
      <div className="sidebar-user"><span className="avatar">{staff?.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><b>{staff?.name}</b><span>{staff?.role}</span></div><span className="online-dot" /></div>
    </aside>
    <div className="staff-main"><header className="staff-topbar"><div className="lg:hidden"><span className="font-bold text-clinic-900">queuewell</span></div><span className="hidden text-xs text-slate-400 sm:inline">Dental clinic · Front desk</span><div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-card"><span className="online-dot" /> Live queue</div></header><main className="staff-content"><Outlet /></main></div>
  </div>;
}
