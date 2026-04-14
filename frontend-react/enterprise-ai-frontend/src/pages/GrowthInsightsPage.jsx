import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function GrowthInsightsPage() {
  const { user } = useContext(AuthContext);
  const [insights, setInsights] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [collab, setCollab] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("growth");

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, usersRes, meRes] = await Promise.all([
          api.get(`/api/tasks/user/${user.id}`),
          api.get("/api/admin/users").catch(() => ({ data: [] })),
          api.get("/api/user/me").catch(() => ({ data: {} }))
        ]);
        setTasks(taskRes.data);
        setAllUsers(usersRes.data);
        const me = meRes.data || {};

        const taskList = taskRes.data.map(t => ({
          id: t.id, title: t.title, status: t.status, priority: t.priority,
          delayRisk: t.delayRisk, estimatedHours: t.estimatedHours, assigneeId: t.assigneeId
        }));

        const [growthRes, workloadRes, collabRes] = await Promise.all([
          api.post("/api/user/growth-insights", { tasks: taskList }),
          api.post("/api/user/workload-prediction", { tasks: taskList }),
          api.post("/api/user/collaboration-suggestions", {
            tasks: taskList,
            userSkills: me.skills || user.skills || [],
            allUsers: usersRes.data.map(u => ({ id: u.id, email: u.email, skills: u.skills || [] }))
          })
        ]);
        setInsights(growthRes.data);
        setWorkload(workloadRes.data);
        setCollab(collabRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
      <div style={{ fontSize: "40px" }}>📈</div>
      <div style={{ color: "#64748b" }}>Loading your Growth Intelligence...</div>
    </div>
  );

  const tabs = [
    { id: "growth", label: "📈 Growth", icon: "📈" },
    { id: "workload", label: "📊 Workload Forecast", icon: "📊" },
    { id: "collab", label: "🤝 Collaborations", icon: "🤝" }
  ];

  const intensityColor = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7c3aed" };
  const intensityBg = { LOW: "#d1fae5", MEDIUM: "#fef3c7", HIGH: "#fee2e2", CRITICAL: "#ede9fe" };

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)", borderRadius: "16px", padding: "28px 32px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>📈</span> Personal Growth Intelligence
          </h2>
          <p style={{ margin: 0, color: "#6ee7b7", fontSize: "14px" }}>
            ML-analyzed skill map, workload forecast, and collaboration insights
          </p>
        </div>
        {insights && (
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "16px 24px", borderRadius: "12px" }}>
            <div style={{ fontSize: "36px", fontWeight: "bold" }}>{insights.overallScore}</div>
            <div style={{ fontSize: "12px", color: "#6ee7b7" }}>Growth Score</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "6px", borderRadius: "12px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", background: activeTab === tab.id ? "white" : "transparent", color: activeTab === tab.id ? "#1e293b" : "#64748b", boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Growth Tab */}
      {activeTab === "growth" && insights && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Daily Challenge */}
          <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid #fcd34d", borderRadius: "12px", padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>🎯</span>
            <div>
              <div style={{ fontWeight: "bold", color: "#78350f", fontSize: "12px", marginBottom: "4px" }}>TODAY'S AI CHALLENGE</div>
              <div style={{ fontWeight: "bold", color: "#92400e", fontSize: "16px" }}>{insights.dailyChallenge}</div>
            </div>
          </div>

          {/* Next Milestone */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>🏆</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>NEXT MILESTONE</div>
              <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>{insights.nextMilestone}</div>
              <div style={{ marginTop: "10px", height: "6px", background: "#e2e8f0", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${insights.overallScore}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)", borderRadius: "3px" }}></div>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{insights.overallScore}% toward milestone</div>
            </div>
          </div>

          {/* Strong Areas */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>💪 Your Strong Areas</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {insights.strongAreas.map((area, i) => (
                <div key={i} style={{ background: "#d1fae5", color: "#065f46", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  ✅ {area}
                </div>
              ))}
            </div>
          </div>

          {/* Weak Areas */}
          {insights.weakAreas?.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>🌱 Areas to Improve</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {insights.weakAreas.map((area, i) => (
                  <div key={i} style={{ background: "#fef9f0", border: "1px solid #fde68a", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ color: "#78350f" }}>{area.area}</strong>
                      <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px" }}>Beginner</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#78350f", marginBottom: "6px" }}>📚 {area.recommendation}</div>
                    <div style={{ fontSize: "12px", color: "#92400e", background: "#fffbeb", padding: "6px 10px", borderRadius: "6px", display: "inline-block", fontWeight: "bold" }}>
                      → Action: {area.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workload Tab */}
      {activeTab === "workload" && workload && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {workload.warning && (
            <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", padding: "16px 20px", fontSize: "14px", color: "#9a3412", fontWeight: "500" }}>
              {workload.warning}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {[
              { label: "Busiest Day", value: workload.busiestDay, icon: "🔥", color: "#ef4444" },
              { label: "Total Predicted Hours", value: `${workload.totalPredictedHours}h`, icon: "⏱️", color: "#4f46e5" }
            ].map((kpi, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "32px" }}>{kpi.icon}</span>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: "#1e293b" }}>📅 Week Workload Prediction</div>
            {workload.weekPrediction.map((day, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: i < workload.weekPrediction.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: "90px", fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{day.label}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((day.predictedHours / 12) * 100, 100)}%`, background: intensityColor[day.intensity], borderRadius: "5px", transition: "width 0.5s" }}></div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{day.tip}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>{day.predictedHours}h</div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: intensityBg[day.intensity], color: intensityColor[day.intensity], fontWeight: "bold" }}>
                    {day.intensity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaboration Tab */}
      {activeTab === "collab" && collab && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px", fontSize: "14px", color: "#1e40af" }}>
            🤖 {collab.aiNote}
          </div>
          {collab.suggestions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤝</div>
              <div>No strong collaboration matches found yet. Add skills to your profile to get better suggestions!</div>
            </div>
          ) : collab.suggestions.map((s, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `hsl(${(i * 80) + 200}, 70%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px" }}>
                  {s.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: "4px" }}>{s.email.split("@")[0]}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{s.reason}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Context: {s.sharedContext}</div>
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0, marginLeft: "16px" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#4f46e5" }}>{s.matchScore}%</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Match</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
