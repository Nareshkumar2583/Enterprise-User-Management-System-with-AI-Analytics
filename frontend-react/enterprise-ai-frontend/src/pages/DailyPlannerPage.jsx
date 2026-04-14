import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function DailyPlannerPage() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workHours, setWorkHours] = useState(8);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get(`/api/tasks/user/${user.id}`).then(r => setTasks(r.data)).catch(console.error);
  }, [user.id]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/user/daily-planner", {
        workHours,
        tasks: tasks.map(t => ({
          id: t.id, title: t.title, status: t.status,
          priority: t.priority, delayRisk: t.delayRisk,
          estimatedHours: t.estimatedHours || 2, dueDate: t.dueDate
        }))
      });
      setPlan(res.data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = { CRITICAL: "#ef4444", NORMAL: "#4f46e5", BACKLOG: "#64748b" };
  const priorityBg = { CRITICAL: "#fee2e2", NORMAL: "#ede9fe", BACKLOG: "#f1f5f9" };

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", borderRadius: "16px", padding: "32px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "36px" }}>🗓️</span>
              <h2 style={{ margin: 0, fontSize: "24px" }}>Smart Daily Planner</h2>
            </div>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>AI auto-generates your optimal work schedule based on deadlines & priority</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>Work Hours / Day</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => setWorkHours(h => Math.max(4, h - 1))} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "18px" }}>−</button>
              <span style={{ fontSize: "28px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>{workHours}</span>
              <button onClick={() => setWorkHours(h => Math.min(12, h + 1))} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "18px" }}>+</button>
            </div>
          </div>
        </div>
        <button onClick={generatePlan} disabled={loading}
          style={{ marginTop: "20px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", padding: "12px 28px", fontSize: "15px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {loading ? "⏳ Generating..." : "✨ Generate My Day Plan"}
        </button>
      </div>

      {/* Plan Output */}
      {plan && (
        <>
          {/* AI Summary Banner */}
          <div style={{ background: plan.unscheduled.length > 0 ? "#fef3c7" : "#d1fae5", border: `1px solid ${plan.unscheduled.length > 0 ? "#f59e0b" : "#10b981"}`, borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>{plan.unscheduled.length > 0 ? "⚠️" : "✅"}</span>
            <div>
              <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: "2px" }}>{plan.date}</div>
              <div style={{ fontSize: "13px", color: "#475569" }}>{plan.aiSummary}</div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Tasks Scheduled", value: plan.planItems.length, icon: "📋", color: "#4f46e5" },
              { label: "Hours Planned", value: `${plan.totalPlannedHours}h`, icon: "⏱️", color: "#10b981" },
              { label: "Deferred Tasks", value: plan.unscheduled.length, icon: "⏭️", color: plan.unscheduled.length > 0 ? "#f59e0b" : "#10b981" }
            ].map((kpi, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "30px", marginBottom: "8px" }}>{kpi.icon}</div>
                <div style={{ fontSize: "26px", fontWeight: "bold", color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          {plan.planItems.length > 0 && (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>📅 Today's AI-Optimized Schedule</h3>
              </div>
              {plan.planItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0", borderBottom: idx < plan.planItems.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  {/* Time Slot */}
                  <div style={{ width: "110px", flexShrink: 0, padding: "20px 16px", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "2px solid #e2e8f0" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#4f46e5" }}>{item.timeSlot}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{item.estimatedHours}h block</div>
                  </div>
                  {/* Task Details */}
                  <div style={{ flex: 1, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "15px", marginBottom: "6px" }}>{item.taskTitle}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                          💡 {item.tip}
                        </div>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", background: priorityBg[item.priority] || "#f1f5f9", color: priorityColor[item.priority] || "#64748b", flexShrink: 0, marginLeft: "12px" }}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deferred list */}
          {plan.unscheduled.length > 0 && (
            <div style={{ background: "#fef9f0", border: "1px solid #fcd34d", borderRadius: "12px", padding: "20px" }}>
              <div style={{ fontWeight: "bold", color: "#92400e", marginBottom: "10px" }}>⏭️ Tasks Deferred to Tomorrow ({plan.unscheduled.length})</div>
              {plan.unscheduled.map((t, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#78350f", padding: "6px 0", borderBottom: i < plan.unscheduled.length - 1 ? "1px solid #fde68a" : "none" }}>• {t}</div>
              ))}
            </div>
          )}
        </>
      )}

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗓️</div>
          <div style={{ fontSize: "16px" }}>Click "Generate My Day Plan" to get your AI-optimized schedule</div>
          <div style={{ fontSize: "13px", marginTop: "8px" }}>You have {tasks.filter(t => t.status !== "DONE").length} active tasks to schedule</div>
        </div>
      )}
    </div>
  );
}
