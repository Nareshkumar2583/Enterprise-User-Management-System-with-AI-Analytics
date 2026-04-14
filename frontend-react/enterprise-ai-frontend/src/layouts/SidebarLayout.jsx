import { useState, useEffect, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import "./SidebarLayout.css";

export default function SidebarLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      api.get(`/api/notifications/user/${user.id}/unread`)
        .then(res => setNotifications(res.data))
        .catch(err => console.error("Notification load error", err));
    }
  }, [user, location.pathname]); 

  const handleDropdown = () => {
    setShowDropdown(!showDropdown);
    // Optimistically mark unread UI as read when opened
    if (!showDropdown && notifications.length > 0) {
      notifications.forEach(n => {
        api.put(`/api/notifications/${n.id}/read`).catch(console.error);
      });
      setTimeout(() => setNotifications([]), 3000); // clear UI badge after short delay
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user && user.role === "ADMIN";

  const adminMenu = [
    { label: "Overview", path: "/admin", icon: "📊" },
    { label: "Org Analytics", path: "/admin/org-analytics", icon: "🏢" },
    { label: "AI Scrum Board", path: "/admin/kanban", icon: "🍱" },
    { label: "Project Intelligence", path: "/admin/project-intelligence", icon: "🔮" },
    { label: "Role Intelligence", path: "/admin/insights", icon: "🧠" },
    { label: "HR Intelligence", path: "/admin/hr-intelligence", icon: "👥" },
    { label: "AI Assistant", path: "/admin/ai-assistant", icon: "🤖" },
    { label: "Approvals", path: "/admin/approvals", icon: "📋" },
    { label: "Leave & Availability", path: "/admin/leave", icon: "📅" },
    { label: "Audit Logs", path: "/admin/audit", icon: "🛡️" }
  ];

  const userMenu = [
    { label: "My Dashboard", path: "/user", icon: "👤" },
    { label: "My Profile", path: "/user/profile", icon: "⚙️" },
    { label: "My Tasks", path: "/user/kanban", icon: "📝" },
    { label: "AI Assistant", path: "/user/ai-assistant", icon: "🤖" },
    { label: "Daily Planner", path: "/user/daily-planner", icon: "🗓️" },
    { label: "Growth Insights", path: "/user/growth", icon: "📈" },
    { label: "My Calendar", path: "/user/calendar", icon: "📅" },
    { label: "My Requests", path: "/user/approvals", icon: "📋" },
    { label: "Apply Leave", path: "/user/leave", icon: "🏖️" },
    { label: "Support Tickets", path: "/user/support", icon: "🎫" },
    { label: "Security", path: "/user/security", icon: "🔒" }
  ];

  const menuItems = isAdmin ? adminMenu : userMenu;

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="title">
            Enterprise <span style={{ color: "#3b82f6" }}>AI</span>
          </h2>
          <div className="user-badge">
            <span className="dot"></span>
            {user?.email}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header Row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px", padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", zIndex: 5, position: "relative" }}>
          
          <div style={{ position: "relative" }}>
            <button 
              onClick={handleDropdown}
              style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", position: "relative" }}
            >
              🔔
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "white", fontSize: "10px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>
                  {notifications.length}
                </span>
              )}
            </button>
            
            {showDropdown && (
              <div style={{ position: "absolute", right: 0, top: "35px", width: "300px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, padding: "12px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", color: "#1e293b" }}>Alerts & Notifications</h4>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>You are all caught up!</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ fontSize: "12px", background: "#f8fafc", padding: "10px", borderRadius: "6px", borderLeft: n.type === 'ALERT' ? "4px solid #ef4444" : "4px solid #3b82f6" }}>
                        <div style={{ fontWeight: "bold", color: n.type === 'ALERT' ? "#ef4444" : "#3b82f6", marginBottom: "4px" }}>
                          {n.type === 'ALERT' ? '⚠️ High Priority' : 'ℹ️ System Info'}
                        </div>
                        <div style={{ color: "#475569" }}>{n.message}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#f87171"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
          >
            🚪 Logout
          </button>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
