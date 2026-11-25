import { ArrowUpRight, MonitorPlay } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { Brand, PublicFooter } from "./Brand";

export function PublicLayout() {
  return <div className="min-h-screen overflow-hidden bg-clinic-50">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12">
      <header className="flex h-14 items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link to="/display" className="nav-link"><MonitorPlay size={15} /> <span className="hidden sm:inline">Clinic display</span><span className="sm:hidden">Display</span></Link>
          <Link to="/staff/login" className="nav-link nav-link-dark">Staff <ArrowUpRight size={14} /></Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col justify-center py-10 lg:py-14"><Outlet /></main>
      <PublicFooter />
    </div>
  </div>;
}
