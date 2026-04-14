import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminProjectIntelligence() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, tRes] = await Promise.all([
          api.get("/api/admin/users"),
          api.get("/api/tasks")
        ]);
        
        const allUsers = uRes.data;
        const allTasks = tRes.data;
        setUsers(allUsers);
        setTasks(allTasks);

        // Calculate Project Predictions
        const predReq = {
          totalTasks: allTasks.length,
          completedTasks: allTasks.filter(t => t.status === "DONE").length,
          blockedTasks: allTasks.filter(t => t.status === "BLOCKED").length,
          daysUntilDeadline: 14,
          burnRateRemainingDays: 20
        };
        const predRes = await api.post("/api/admin/project-predictions", predReq);
        setPredictions(predRes.data);

        // Calculate Workload Heatmap
        const hwReq = {
          users: allUsers.map(u => ({
            id: u.id,
            name: u.name || u.email,
            totalAssigned: allTasks.filter(t => t.assigneeId === u.id).length,
            pendingAssigned: allTasks.filter(t => t.assigneeId === u.id && t.status !== "DONE").length,
            completedPastWeek: allTasks.filter(t => t.assigneeId === u.id && t.status === "DONE").length || 1
          }))
        };
        const hwRes = await api.post("/api/admin/workload-heatmap", hwReq);
        setHeatmap(hwRes.data.heatmap || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}><h2>🧠 Analyzing Project Data...</h2></div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #020617 0%, #1e1b4b 100%)", borderRadius: "16px", padding: "32px", color: "white" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ fontSize: "40px" }}>🧠</span>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "24px" }}>Predictive Project Insights</h2>
            <p style={{ margin: 0, color: "#a5b4fc", fontSize: "14px" }}>AI-driven delay forecasting & team workload heatmaps</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Predictive Radar */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "16px" }}>🔮 Risk Forecast</h3>
          
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>PREDICTION STATUS</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", 
              color: predictions.predictionStatus === "ON_TRACK" ? "#16a34a" : predictions.predictionStatus === "AT_RISK" ? "#d97706" : "#dc2626" }}>
              {predictions.predictionStatus.replace("_", " ")}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>
                <span>Delay Probability</span><span>{Math.round(predictions.delayProbability * 100)}%</span>
              </div>
              <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: `${predictions.delayProbability * 100}%`, background: "#dc2626", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>
                <span>Resource Shortage Risk</span><span>{Math.round(predictions.resourceShortageRisk * 100)}%</span>
              </div>
              <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: `${predictions.resourceShortageRisk * 100}%`, background: "#d97706", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Workload Heatmap */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "16px" }}>⚖️ Team Workload Heatmap</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {heatmap.map(h => (
              <div key={h.userId} style={{ 
                border: "1px solid", 
                borderColor: h.status === "OVERLOADED" ? "#fca5a5" : h.status === "FREE_CAPACITY" ? "#86efac" : "#e2e8f0",
                background: h.status === "OVERLOADED" ? "#fef2f2" : h.status === "FREE_CAPACITY" ? "#f0fdf4" : "#f8fafc",
                borderRadius: "10px", padding: "16px" 
              }}>
                <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.userName}</div>
                <div style={{ fontSize: "20px", fontWeight: "bold", margin: "8px 0", color: h.status === "OVERLOADED" ? "#dc2626" : h.status === "FREE_CAPACITY" ? "#16a34a" : "#475569" }}>
                  {Math.round(h.loadIndex * 100)}% Load
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {h.pendingCount} Pending Tasks <br/>
                  <span style={{ fontWeight: "bold" }}>{h.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Skill Matrix */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
        <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "16px" }}>🧬 Organization Skill Matrix</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#64748b" }}>
                <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Employee</th>
                <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Department</th>
                <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Primary Skills</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#334155" }}>{u.name || u.email}</td>
                  <td style={{ padding: "12px", color: "#64748b" }}>{u.department || "Unassigned"}</td>
                  <td style={{ padding: "12px", color: "#3b82f6" }}>
                    {(u.skills && u.skills.length > 0) ? u.skills.join(", ") : "No skills mapped"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
