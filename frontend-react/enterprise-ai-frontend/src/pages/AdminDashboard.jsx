import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import AdminRolePieChart from "../components/AdminRolePieChart";
import AdminUserActivityChart from "../components/AdminUserActivityChart";
import "../styles/dashboard.css";

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get("/api/admin/users")
      .then(res => setUsers(res.data))
      .catch(() => alert("Failed to load users"));
  }, []);

  useEffect(() => {
    api.get("/api/admin/analytics")
      .then(res => setAnalytics(res.data))
      .catch(() => alert("Failed to load analytics"));
  }, []);

  if (!analytics) return <h2>Loading dashboard...</h2>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <button onClick={() => { logout(); navigate("/"); }}>
          Logout
        </button>
      </div>

      <div className="card-container">
          <div className="card primary">
            <h3>Total Users</h3>
            <p>{analytics.totalUsers}</p>

            <small style={{ color: "#64748b" }}>
              ↑ 12% growth this month
            </small>
            </div>
              <div className="card success">
                  <h3>Admins</h3>
                  <p>{analytics.adminCount}</p>

                  <small style={{ color: "#64748b" }}>
                    Critical access holders
                  </small>
              </div>
           <div className="card warning">
              <h3>Active Users</h3>
              <p>{analytics.activeUsers}</p>

              <small style={{ color: "#64748b" }}>
                Logged in last 24 hours
              </small>
           </div>

      </div>

      <div className="card-container">
        <div className="card">
          <AdminRolePieChart roleDistribution={analytics.roleDistribution} />
        </div>
        <div className="card">
          <AdminUserActivityChart />
        </div>
            <div className="card ai">
        <h3>AI Engagement Score 🤖</h3>

        <p style={{ fontSize: "42px", margin: "10px 0" }}>
          {analytics.engagementScore}%
        </p>

        <div style={{
          background: "#e5e7eb",
          height: "12px",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${analytics.engagementScore}%`,
            height: "100%",
            background:
              analytics.engagementScore > 75 ? "#22c55e" :
              analytics.engagementScore > 50 ? "#facc15" :
              "#ef4444",
            transition: "width 0.5s"
          }} />
        </div>

          <p style={{ marginTop: "10px", fontWeight: 600 }}>
            {analytics.engagementScore > 75
              ? "High Engagement 🚀"
              : analytics.engagementScore > 50
              ? "Moderate Engagement ⚡"
              : "Low Engagement ⚠️"}
          </p>
       </div>
       </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => navigate(`/admin/users/${u.id}`)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

