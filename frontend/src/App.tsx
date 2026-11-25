import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { StaffLayout } from "./components/StaffLayout";
import { DisplayPage } from "./pages/DisplayPage";
import { JoinPage } from "./pages/JoinPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PatientTicketPage } from "./pages/PatientTicketPage";
import { QueueDeskPage } from "./pages/QueueDeskPage";
import { StaffLoginPage } from "./pages/StaffLoginPage";
import { TeamPage } from "./pages/TeamPage";

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<JoinPage />} />
      <Route path="ticket" element={<PatientTicketPage />} />
    </Route>
    <Route path="display" element={<DisplayPage />} />
    <Route path="staff/login" element={<StaffLoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="staff" element={<StaffLayout />}>
        <Route index element={<QueueDeskPage />} />
        <Route element={<ProtectedRoute admin />}>
          <Route path="overview" element={<OverviewPage />} />
          <Route path="team" element={<TeamPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
