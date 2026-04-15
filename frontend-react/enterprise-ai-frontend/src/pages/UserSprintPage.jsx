import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import "../styles/kanban.css";

export default function UserSprintPage() {
  const { user } = useContext(AuthContext);
  const [activeSprint, setActiveSprint] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Standup Form State
  const [standup, setStandup] = useState({
    yesterday: "",
    today: "",
    blockers: "",
    mood: "GOOD"
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [sprintRes, tasksRes] = await Promise.all([
        api.get("/api/sprints/active").catch(() => ({ data: null })),
        api.get(`/api/tasks/user/${user.id}`).then(res => {
          // Filter tasks belonging to active sprint locally for now contextually
          return res;
        })
      ]);

      if (sprintRes.data) {
        setActiveSprint(sprintRes.data);
        // Filter tasks that belong to THIS sprint specifically if sprintId is used
        const sprintId = sprintRes.data.id;
        const sprintFiltered = tasksRes.data.filter(t => t.sprintId === sprintId);
        setMyTasks(sprintFiltered);
      }
    } catch (err) {
      console.error("User sprint load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStandupSubmit = async (e) => {
    e.preventDefault();
    if (!activeSprint) return;
    try {
      setSubmitting(true);
      await api.post("/api/sprints/standup", {
        ...standup,
        sprintId: activeSprint.id,
        userEmail: user.email
      });
      alert("Standup submitted successfully! 🚀");
      setStandup({ yesterday: "", today: "", blockers: "", mood: "GOOD" });
    } catch (err) {
      alert("Failed to submit standup");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchUserData();
    } catch (err) {
      console.error("Task update failed", err);
    }
  };

  if (loading) return <div className="loading-state">🏃 Preparing your sprint dashboard...</div>;

  if (!activeSprint) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#1e293b" }}>No active sprint at the moment.</h2>
        <p style={{ color: "#64748b" }}>Wait for your manager to start the next sprint.</p>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(activeSprint.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const completedCount = myTasks.filter(t => t.status === "DONE").length;
  const progressPercent = myTasks.length > 0 ? (completedCount / myTasks.length) * 100 : 0;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* 1. Sprint Info & 4. Deadline awareness */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", borderLeft: "6px solid #3b82f6" }}>
          <div style={{ fontSize: "14px", color: "#3b82f6", fontWeight: "700", textTransform: "uppercase" }}>Current Sprint</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: "28px", color: "#1e293b" }}>{activeSprint.name}</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Goal: {activeSprint.goal}</p>
          <div style={{ display: "flex", gap: "20px", marginTop: "16px" }}>
            <div style={{ fontSize: "13px" }}>🗓️ {activeSprint.startDate} → {activeSprint.endDate}</div>
            <div style={{ fontSize: "13px", color: daysLeft < 3 ? "#ef4444" : "#059669", fontWeight: "700" }}>
              ⏳ {daysLeft} days remaining
            </div>
          </div>
        </div>

        {/* 3. Progress View */}
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>MY PROGRESS</div>
          <div style={{ fontSize: "40px", fontWeight: "800", color: "#1e293b", margin: "10px 0" }}>{Math.round(progressPercent)}%</div>
          <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
             <div style={{ width: `${progressPercent}%`, height: "100%", background: "#3b82f6", transition: "width 0.5s ease" }}></div>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>{completedCount} of {myTasks.length} tasks completed</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        {/* 2. My Sprint Tasks */}
        <div>
          <h2 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "16px" }}>📋 My Sprint Tasks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {myTasks.length === 0 ? (
              <div style={{ padding: "40px", background: "#f8fafc", borderRadius: "12px", textAlign: "center", color: "#94a3b8" }}>
                No tasks assigned to you in this sprint.
              </div>
            ) : myTasks.map(task => (
              <div key={task.id} style={{ background: "white", padding: "16px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${task.status === 'DONE' ? '#059669' : '#3b82f6'}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: "700", color: "#1e293b", textDecoration: task.status === 'DONE' ? 'line-through' : 'none', opacity: task.status === 'DONE' ? 0.6 : 1 }}>{task.title}</div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "#f1f5f9", fontWeight: "700" }}>{task.status}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  {task.status !== 'DONE' && (
                    <button onClick={() => updateTaskStatus(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')} style={{ padding: "6px 12px", borderRadius: "6px", background: "#3b82f6", color: "white", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                      {task.status === 'TODO' ? 'Start Task' : 'Complete Task'}
                    </button>
                  )}
                  {task.status !== 'TODO' && task.status !== 'DONE' && (
                    <button onClick={() => updateTaskStatus(task.id, 'TODO')} style={{ padding: "6px 12px", borderRadius: "6px", background: "#f1f5f9", color: "#64748b", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                      Reset to TODO
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Daily Update (Standup) */}
        <div>
          <h2 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "16px" }}>🚀 Submit Daily Standup</h2>
          <form onSubmit={handleStandupSubmit} style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>Yesterday - What did I do?</label>
              <textarea 
                required
                value={standup.yesterday}
                onChange={e => setStandup({...standup, yesterday: e.target.value})}
                style={{ width: "100%", height: "60px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} 
                placeholder="Achievements..."
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>Today - What will I do?</label>
              <textarea 
                required
                value={standup.today}
                onChange={e => setStandup({...standup, today: e.target.value})}
                style={{ width: "100%", height: "60px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} 
                placeholder="Today's focus..."
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>Blockers? (Optional)</label>
              <input 
                value={standup.blockers}
                onChange={e => setStandup({...standup, blockers: e.target.value})}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} 
                placeholder="Any obstacles?"
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#1e293b", color: "white", border: "none", fontWeight: "700", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Sending..." : "Submit Standup Log →"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
