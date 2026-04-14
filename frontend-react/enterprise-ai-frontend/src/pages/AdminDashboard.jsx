import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import AdminRolePieChart from "../components/AdminRolePieChart";
import AdminUserActivityChart from "../components/AdminUserActivityChart";
import "../styles/dashboard.css";
import "../styles/dashboard-ml.css";

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterSegment, setFilterSegment] = useState("ALL");

  useEffect(() => {
    api.get("/api/admin/users")
      .then(res => setUsers(res.data))
      .catch(() => alert("Failed to load users"));
      
    api.get("/api/admin/analytics")
      .then(res => setAnalytics(res.data))
      .catch(() => alert("Failed to load analytics"));
  }, []);

  // Compute System Security Score
  const systemSecurityScore = useMemo(() => {
    if (!users.length) return 100;
    const totalRisk = users.reduce((acc, u) => acc + (u.riskScore || 0), 0);
    const avgRisk = totalRisk / users.length;
    return Math.max(0, Math.round(100 - avgRisk));
  }, [users]);

  // Derived data
  const suspiciousUsersCount = users.filter(u => u.suspicious).length;
  const atRiskBurnout = users.filter(u => u.burnoutRisk === "HIGH" || u.burnoutRisk === "MEDIUM");

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = filterRisk === "ALL" || (u.riskLevel && u.riskLevel.toUpperCase() === filterRisk);
      const matchSegment = filterSegment === "ALL" || u.segment === filterSegment;
      return matchSearch && matchRisk && matchSegment;
    });
  }, [users, searchTerm, filterRisk, filterSegment]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["UserID,Email,Role,RiskScore,RiskLevel,ChurnProbability,Segment,Suspicious,EngagementScore,BurnoutRisk,RoleRecommendation"];
    const rows = users.map(u => 
      `${u.id},${u.email},${u.role},${u.riskScore},${u.riskLevel},${u.churnProbability},${u.segment},${u.suspicious},${u.engagementScore},${u.burnoutRisk},${u.roleRecommendation}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enterprise_ai_user_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!analytics) return <h2>Loading dashboard...</h2>;

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <button className="btn promote" onClick={exportCSV}>⬇️ Export CSV Report</button>
      </div>

      {suspiciousUsersCount > 0 && (
        <div className="alert-banner">
          <span style={{ fontSize: "24px" }}>🚨</span>
          <div>
            <div><strong>Anomaly Detection Alert</strong></div>
            <div style={{ fontSize: "14px", fontWeight: "normal" }}>
              {suspiciousUsersCount} user(s) flagged for highly suspicious activity. Review immediately.
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Row */}
      <div className="card-container">
        <div className="card primary">
          <h3>Total Users</h3>
          <p>{analytics.totalUsers}</p>
          <small style={{ color: "#64748b" }}>↑ 12% growth this month</small>
        </div>
        
        <div className="card success">
          <h3>Admins</h3>
          <p>{analytics.adminCount}</p>
          <small style={{ color: "#64748b" }}>Critical access holders</small>
        </div>
        
        <div className="card warning">
          <h3>Active Users</h3>
          <p>{analytics.activeUsers}</p>
          <small style={{ color: "#64748b" }}>Logged in last 24 hours</small>
        </div>

        <div className="card ai" style={{ background: systemSecurityScore > 80 ? "#ecfdf5" : systemSecurityScore > 50 ? "#fefce8" : "#fef2f2" }}>
          <h3 style={{ color: "#334155" }}>System Security Health 🛡️</h3>
          <p style={{ 
            fontSize: "42px", 
            margin: "5px 0", 
            color: systemSecurityScore > 80 ? "#059669" : systemSecurityScore > 50 ? "#d97706" : "#dc2626" 
          }}>
            {systemSecurityScore}/100
          </p>
          <small style={{ color: "#64748b", fontWeight: "bold" }}>
            {systemSecurityScore > 80 ? "System Secure ✅" : systemSecurityScore > 50 ? "Caution advised ⚠️" : "Critical threats detected 🚨"}
          </small>
        </div>
      </div>

      {/* Upper Charts Row */}
      <div className="card-container">
        <div className="card" style={{ flex: 1 }}>
          <AdminRolePieChart roleDistribution={analytics.roleDistribution} />
        </div>
        
        <div className="card" style={{ flex: 1.5 }}>
          <AdminUserActivityChart />
        </div>
        
        {/* At Risk Employees Panel */}
        <div className="card" style={{ flex: 1, maxHeight: "350px", overflowY: "auto", borderTop: "4px solid #f97316" }}>
          <h3 style={{ color: "#c2410c" }}>At-Risk Employees (Burnout) 🔥</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "15px" }}>AI has flagged these users for high likelihood of burnout.</p>
          
          {atRiskBurnout.length === 0 ? (
            <p style={{ textAlign: "center", color: "#16a34a", marginTop: "20px" }}>No users are at risk! 🎉</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {atRiskBurnout.slice(0, 4).map(u => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff7ed", padding: "10px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
                  <div>
                    <strong style={{ fontSize: "14px", display: "block", color: "#9a3412" }}>{u.email}</strong>
                    <span style={{ fontSize: "12px", color: "#c2410c" }}>{u.role}</span>
                  </div>
                  <span style={{ background: u.burnoutRisk === "HIGH" ? "#ef4444" : "#f97316", color: "white", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                    {u.burnoutRisk} RISK
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lower UI Row for AI Task Allocation */}
      <div className="card-container">
        {/* AI Task Allocation Panel */}
        <div className="card" style={{ flex: 1, borderTop: "4px solid #3b82f6", display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "#1e3a8a", marginBottom: "5px" }}>AI Task Allocation 🎯</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "15px" }}>Describe a project. AI will find the best employees for the job.</p>
          
          <input 
            id="task-input"
            type="text" 
            placeholder="E.g. Analyze Q3 financial data" 
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "10px", width: "100%", boxSizing: "border-box" }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') document.getElementById('assign-task-btn').click();
            }}
          />
          <button 
            id="assign-task-btn"
            style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            onClick={async () => {
              const val = document.getElementById('task-input').value;
              if (!val) return;
              try {
                // Loading state
                document.getElementById('task-result').innerHTML = '<div style="text-align: center; color: #64748b; padding: 10px;">AI is analyzing user capacities...</div>';
                const res = await api.post("/api/admin/allocate-task", { description: val });
                
                const matchesHtml = res.data.topMatches.map(m => `
                  <div style="background: #f8fafc; padding: 8px 10px; border-radius: 6px; border-left: 3px solid #22c55e; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong>${m.email}</strong>
                      <span style="background: #dcfce7; color: #16a34a; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">Score: ${m.matchScore}</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${m.reason}</div>
                  </div>
                `).join('');
                
                document.getElementById('task-result').innerHTML = `
                  <div style="margin-top: 15px;">
                    <h4 style="margin: 0 0 10px; font-size: 13px; color: #334155;">Top Recommendations:</h4>
                    ${matchesHtml}
                  </div>
                `;
              } catch (e) {
                console.error("Task allocation error", e);
                document.getElementById('task-result').innerHTML = '<div style="color: red;">Error communicating with AI.</div>';
              }
            }}
          >
            Find Best Employees
          </button>
          
          <div id="task-result" style={{ flex: 1, overflowY: "auto", marginTop: "10px" }}></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>All Users List 📊</h3>
          
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input 
              type="text" 
              placeholder="Search email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
            <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              <option value="ALL">All Segments</option>
              <option value="Casual">Casual</option>
              <option value="Power User">Power User</option>
              <option value="Dormant">Dormant</option>
              <option value="Active/Stable">Active/Stable</option>
            </select>
          </div>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Segment</th>
              <th>AI Risk Level</th>
              <th>Churn Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className={u.suspicious ? "alert-row" : ""}>
                <td>
                  <div>
                    <strong>{u.email}</strong>
                    <div style={{ fontSize: "12px", color: u.role === "ADMIN" ? "#16a34a" : "#64748b", fontWeight: "bold" }}>
                      {u.role}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="segment-tag">{u.segment || "Unknown"}</span>
                </td>
                <td>
                  <span className={`ml-pill pill-${u.riskLevel ? u.riskLevel.toLowerCase() : 'low'}`}>
                    Score: {u.riskScore || 0} - {u.riskLevel}
                  </span>
                  {u.suspicious && <span className="pulsing-alert" style={{ marginLeft: "8px" }}>🚨</span>}
                </td>
                <td>
                  <div className="churn-wrapper">
                    <div className="churn-fill" style={{ 
                        width: `${u.churnProbability || 0}%`,
                        background: u.churnProbability > 70 ? "#ef4444" : u.churnProbability > 40 ? "#facc15" : "#22c55e"
                    }}></div>
                  </div>
                  <span className="churn-label">{u.churnProbability || 0}% Probability</span>
                </td>
                <td>
                  <button className="btn view" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No users match filters.</p>}
      </div>
    </div>
  );
}

