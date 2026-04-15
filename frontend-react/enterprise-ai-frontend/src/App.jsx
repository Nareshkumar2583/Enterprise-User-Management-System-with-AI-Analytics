import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminUserDetail from "./pages/AdminUserDetail";
import Kanban from "./pages/Kanban";
import AuditLogPage from "./pages/AuditLogPage";
import AdminInsights from "./pages/AdminInsights";
import ApprovalsPage from "./pages/ApprovalsPage";
import LeavePage from "./pages/LeavePage";
import AIAssistantPage from "./pages/AIAssistantPage";
import UserProfilePage from "./pages/UserProfilePage";
import UserCalendarPage from "./pages/UserCalendarPage";
import UserAIAssistantPage from "./pages/UserAIAssistantPage";
import DailyPlannerPage from "./pages/DailyPlannerPage";
import GrowthInsightsPage from "./pages/GrowthInsightsPage";
import SecurityPage from "./pages/SecurityPage";
import AdminHRIntelligence from "./pages/AdminHRIntelligence";
import TicketRoutingPage from "./pages/TicketRoutingPage";
import AdminOrgAnalytics from "./pages/AdminOrgAnalytics";
import AdminProjectIntelligence from "./pages/AdminProjectIntelligence";
import AdminSupportTicketsPage from "./pages/AdminSupportTicketsPage";
import AdminSprintPage from "./pages/AdminSprintPage";
import UserSprintPage from "./pages/UserSprintPage";
import SidebarLayout from "./layouts/SidebarLayout";
import { AuthProvider, AuthContext } from "./auth/AuthContext";
import Register from "./pages/Register";
import SessionLockModal from "./components/SessionLockModal";
import api from "./api/axios";
import { useState, useEffect, useContext } from "react";

// Activity Tracker Component (Invisible)
function ActivityTracker({ onLock }) {
  const { user } = useContext(AuthContext);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (!user) return;

    const handleClick = () => {
      setActions(prev => {
        const newActions = [...prev, { time: Date.now() }];
        // Push every 10 clicks
        if (newActions.length >= 10) {
          const duration = (newActions[newActions.length - 1].time - newActions[0].time) / 1000.0;
          api.post("/api/user/track-activity", { action: "mouse_click_burst", duration })
            .then(res => {
              if (res.data.is_anomaly && res.data.anomaly_score > 0.70) {
                onLock();
              }
            })
            .catch(err => console.error("Tracking failure", err));
          return []; // reset
        }
        return newActions;
      });
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [user, onLock]);

  return null;
}

export default function App() {
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  return (
    <AuthProvider>
      <AuthContext.Consumer>
        {({ user }) => (
          <>
            {user && !isSessionLocked && <ActivityTracker onLock={() => setIsSessionLocked(true)} />}
            {isSessionLocked && <SessionLockModal onUnlock={() => setIsSessionLocked(false)} userEmail={user?.email} />}
          </>
        )}
      </AuthContext.Consumer>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in Sidebar Layout */}
          <Route element={<SidebarLayout />}>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/kanban" element={<Kanban />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
            <Route path="/admin/insights" element={<AdminInsights />} />
            <Route path="/admin/hr-intelligence" element={<AdminHRIntelligence />} />
            <Route path="/admin/org-analytics" element={<AdminOrgAnalytics />} />
            <Route path="/admin/project-intelligence" element={<AdminProjectIntelligence />} />
            <Route path="/admin/approvals" element={<ApprovalsPage />} />
            <Route path="/admin/tickets" element={<AdminSupportTicketsPage />} />
            <Route path="/admin/leave" element={<LeavePage />} />
            <Route path="/admin/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/admin/scrum" element={<AdminSprintPage />} />

            {/* User Routes */}
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserProfilePage />} />
            <Route path="/user/kanban" element={<Kanban />} />
            <Route path="/user/approvals" element={<ApprovalsPage />} />
            <Route path="/user/leave" element={<LeavePage />} />
            <Route path="/user/calendar" element={<UserCalendarPage />} />
            <Route path="/user/ai-assistant" element={<UserAIAssistantPage />} />
            <Route path="/user/daily-planner" element={<DailyPlannerPage />} />
            <Route path="/user/growth" element={<GrowthInsightsPage />} />
            <Route path="/user/security" element={<SecurityPage />} />
            <Route path="/user/support" element={<TicketRoutingPage />} />
            <Route path="/user/sprint" element={<UserSprintPage />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
