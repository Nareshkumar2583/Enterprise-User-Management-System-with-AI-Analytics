import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";
import "../styles/insights.css";

export default function AdminInsights() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reallocResult, setReallocResult] = useState(null);
  const [reallocLoading, setReallocLoading] = useState(false);
  const [roleAudits, setRoleAudits] = useState([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [usersRes, tasksRes, auditRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/tasks"),
        api.get("/api/admin/role-audit").catch(() => ({ data: [] }))
      ]);
      const allUsers = usersRes.data || [];
      const allTasks = tasksRes.data || [];
      setUsers(allUsers);
      setTasks(allTasks);
      setRoleAudits(auditRes.data || []);

      // Build member payload for FastAPI
      const members = allUsers.map(u => {
        const uTasks = allTasks.filter(t => t.assigneeId === u.id);
        return {
          userId: u.id,
          email: u.email,
          todoCount: uTasks.filter(t => t.status === "TODO").length,
          inProgressCount: uTasks.filter(t => t.status === "IN_PROGRESS").length,
          reviewCount: uTasks.filter(t => t.status === "REVIEW").length,
          doneCount: uTasks.filter(t => t.status === "DONE").length,
          highRiskCount: uTasks.filter(t => t.delayRisk === "HIGH RISK").length,
        };
      });

      const result = await api.post("/api/admin/team-analytics", { members });
      setAnalytics(result.data);

      // Build smart alerts
      const newAlerts = [];
      result.data.memberInsights.forEach(ins => {
        if (ins.alertMessage) newAlerts.push({ type: ins.status, message: ins.alertMessage });
      });
      if (result.data.projectDelayRisk === "HIGH") {
        newAlerts.unshift({ type: "PROJECT", message: "🚨 Project at HIGH risk of delay — multiple overloaded members detected!" });
      }
      if (result.data.skillGaps.length > 0) {
        newAlerts.push({ type: "SKILL", message: `🧬 Skill Gap Detected: Missing ${result.data.skillGaps.join(", ")} on team.` });
      }
      setAlerts(newAlerts);
    } catch (err) {
      console.error("Insights load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const runAutoReallocate = async (task) => {
    setReallocLoading(true);
    setReallocResult(null);
    try {
      const candidates = users.map(u => ({ id: u.id, email: u.email, role: u.role || "USER" }));
      const assigneeTasks = tasks.filter(t => t.assigneeId === task.assigneeId && t.status !== "DONE");
      const payload = {
        taskTitle: task.title,
        currentAssigneeEmail: task.assigneeEmail || "unknown",
        currentAssigneeLoad: assigneeTasks.length,
        candidates
      };
      const res = await api.post("/api/admin/auto-reallocate", payload);
      setReallocResult(res.data);
      if (res.data.shouldReallocate) {
        await api.put(`/api/tasks/${task.id}`, {
          ...task,
          assigneeId: res.data.recommendedUserId,
          assigneeEmail: res.data.recommendedEmail,
          aiReasoning: res.data.reason,
        });
        loadInsights();
      }
    } catch (err) {
      console.error("Reallocation failed", err);
    } finally {
      setReallocLoading(false);
    }
  };

  const exportCSV = () => {
    if (!analytics) return;
    const headers = "Email,Rank,CompletionRate,Utilization,Status,DelayRisk";
    const rows = analytics.memberInsights.map(m =>
      `${m.email},${m.performanceRank},${m.completionRate}%,${m.utilizationScore}%,${m.status},${m.delayRisk}`
    );
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `team_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="insights-loading">🧠 Loading AI Team Intelligence...</div>;

  const utilizationData = analytics?.memberInsights.map(m => ({
    name: m.email.split("@")[0],
    utilization: m.utilizationScore,
    completion: m.completionRate,
  })) || [];

  const taskDistData = analytics?.memberInsights.map(m => {
    const uTasks = tasks.filter(t => t.assigneeId === m.userId);
    return { name: m.email.split("@")[0], tasks: uTasks.length };
  }) || [];

  const overloadedTasks = tasks.filter(t => {
    const assigneeTasks = tasks.filter(x => x.assigneeId === t.assigneeId && x.status !== "DONE");
    return assigneeTasks.length >= 3 && t.delayRisk === "HIGH RISK";
  });

  return (
    <div className="insights-page">
      {/* Header */}
      <div className="insights-header">
        <div>
          <h2>🧠 AI Productivity Intelligence Hub</h2>
          <p>Data-driven insights for your team's performance, risk, and efficiency</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="ins-btn ins-btn-secondary" onClick={loadInsights}>🔄 Refresh</button>
          <button className="ins-btn ins-btn-primary" onClick={exportCSV}>📥 Export CSV Report</button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="insights-kpi-row">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-value">{analytics?.teamEfficiency}%</div>
          <div className="kpi-label">Team Efficiency</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon">✅</div>
          <div className="kpi-value">{analytics?.avgCompletionRate}%</div>
          <div className="kpi-label">Avg Task Completion</div>
        </div>
        <div className={`kpi-card ${analytics?.projectDelayRisk === "HIGH" ? "kpi-red" : "kpi-yellow"}`}>
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-value">{analytics?.projectDelayRisk}</div>
          <div className="kpi-label">Project Delay Risk</div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-icon">🔥</div>
          <div className="kpi-value">{analytics?.overloadedCount}</div>
          <div className="kpi-label">Overloaded Members</div>
        </div>
        <div className="kpi-card kpi-slate">
          <div className="kpi-icon">📉</div>
          <div className="kpi-value">{analytics?.underutilizedCount}</div>
          <div className="kpi-label">Underutilized Members</div>
        </div>
        <div className="kpi-card kpi-teal">
          <div className="kpi-icon">🏆</div>
          <div className="kpi-value" style={{ fontSize: "14px" }}>{analytics?.topPerformer?.split("@")[0]}</div>
          <div className="kpi-label">Top Performer</div>
        </div>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="insights-section">
          <h3>🔔 Smart Admin Alerts</h3>
          <div className="alerts-list">
            {alerts.map((a, i) => (
              <div key={i} className={`alert-item alert-${a.type.toLowerCase()}`}>
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="insights-charts-row">
        {/* Resource Utilization Chart */}
        <div className="insights-chart-card">
          <h3>📊 Resource Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" radius={[4,4,0,0]} />
              <Bar dataKey="completion" fill="#22c55e" name="Completion %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution Chart */}
        <div className="insights-chart-card">
          <h3>🗂 Task Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskDistData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#8b5cf6" name="Total Tasks" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Ranking Table */}
      <div className="insights-section">
        <h3>📈 Team Performance Ranking</h3>
        <table className="user-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Completion Rate</th>
              <th>Utilization</th>
              <th>Delay Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.memberInsights.map(m => (
              <tr key={m.userId}>
                <td>
                  <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                    {m.performanceRank === 1 ? "🥇" : m.performanceRank === 2 ? "🥈" : m.performanceRank === 3 ? "🥉" : `#${m.performanceRank}`}
                  </span>
                </td>
                <td><strong>{m.email}</strong></td>
                <td>
                  <span className={`status-badge status-${m.status.toLowerCase()}`}>{m.status}</span>
                </td>
                <td>
                  <div className="progress-wrapper">
                    <div className="progress-fill" style={{ width: `${m.completionRate}%`, background: m.completionRate > 70 ? "#22c55e" : m.completionRate > 40 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span style={{ fontSize: "12px" }}>{m.completionRate}%</span>
                </td>
                <td>{m.utilizationScore}%</td>
                <td>
                  <span style={{ color: m.delayRisk === "HIGH" ? "#ef4444" : "#22c55e", fontWeight: "bold", fontSize: "12px" }}>
                    {m.delayRisk}
                  </span>
                </td>
                <td>
                  {m.status === "OVERLOADED" && (
                    <button
                      className="ins-btn ins-btn-warn"
                      onClick={() => {
                        const t = tasks.find(x => x.assigneeId === m.userId && x.status !== "DONE");
                        if (t) runAutoReallocate(t);
                      }}
                      disabled={reallocLoading}
                    >
                      {reallocLoading ? "⏳" : "🔄 Reallocate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reallocation Result */}
      {reallocResult && (
        <div className={`realloc-result ${reallocResult.shouldReallocate ? "realloc-success" : "realloc-none"}`}>
          {reallocResult.shouldReallocate
            ? `✅ Task reallocated to ${reallocResult.recommendedEmail} — ${reallocResult.reason}`
            : `ℹ️ ${reallocResult.reason}`}
        </div>
      )}

      {/* Skill Gap Analysis */}
      {analytics?.skillGaps?.length > 0 && (
        <div className="insights-section">
          <h3>🧬 Skill Gap Analysis</h3>
          <div className="skill-gaps">
            {analytics.skillGaps.map((gap, i) => (
              <div key={i} className="skill-gap-item">
                <span className="skill-icon">⚠️</span>
                <div>
                  <strong>{gap}</strong>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Missing from current team roster. Consider hiring or training.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Risk Tasks (Deadline Risk Section) */}
      {overloadedTasks.length > 0 && (
        <div className="insights-section">
          <h3>⚠️ High-Risk Tasks — Deadline Monitoring</h3>
          <table className="user-table">
            <thead>
              <tr><th>Task</th><th>Assignee</th><th>Est. Hours</th><th>Risk Level</th><th>Priority</th><th>Quick Reallocate</th></tr>
            </thead>
            <tbody>
              {overloadedTasks.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.title}</strong></td>
                  <td>{t.assigneeEmail || "Unassigned"}</td>
                  <td>⏱️ {t.estimatedHours || "?"} hrs</td>
                  <td><span style={{ color: "#ef4444", fontWeight: "bold" }}>{t.delayRisk}</span></td>
                  <td><span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: "8px", fontSize: "11px" }}>{t.priority}</span></td>
                  <td>
                    <button className="ins-btn ins-btn-warn" onClick={() => runAutoReallocate(t)} disabled={reallocLoading}>
                      {reallocLoading ? "⏳" : "🔄 Auto Fix"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role & Permission Audit */}
      {roleAudits.length > 0 && (
        <div className="insights-section" style={{ marginTop: "30px", borderTop: "2px solid #e2e8f0", paddingTop: "20px" }}>
          <h3 style={{ color: "#6366f1" }}>🛡️ AI Role & Permission Audit</h3>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>The machine learning layer has detected behavioral discrepancies between a user's usage and their assigned role.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {roleAudits.map((audit, idx) => (
              <div key={idx} style={{ background: "white", padding: "16px", borderRadius: "10px", border: "1px solid #cbd5e1", borderLeft: audit.roleRecommendation === "RECOMMEND_DEMOTE" ? "4px solid #ef4444" : "4px solid #22c55e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>UserId: {audit.userId}</div>
                  <div style={{ color: "#475569", fontSize: "13px" }}>
                    <strong>Risk Reason:</strong> {audit.riskReason} <br/>
                    <strong>Engagement:</strong> {audit.engagementScore}/100 | <strong>Anomaly Segment:</strong> {audit.segment}
                  </div>
                </div>
                <div>
                  <span style={{ padding: "6px 12px", background: audit.roleRecommendation === "RECOMMEND_DEMOTE" ? "#fee2e2" : "#dcfce7", color: audit.roleRecommendation === "RECOMMEND_DEMOTE" ? "#991b1b" : "#166534", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                    {audit.roleRecommendation === "RECOMMEND_DEMOTE" ? "🔻 Target for Demotion" : "🌟 Target for Promotion"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
