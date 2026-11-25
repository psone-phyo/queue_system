import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const { staff, busy } = useAuth();
  if (busy) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Preparing your workspace…</div>;
  if (!staff) return <Navigate to="/staff/login" replace />;
  if (admin && staff.role !== "admin") return <Navigate to="/staff" replace />;
  return <Outlet />;
}
