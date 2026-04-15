import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import "../styles/kanban.css";

const TABS = ["📋 Backlog", "🗓️ Sprint Board", "📉 Burndown", "🧍 Standup", "🔍 Retrospective"];

export default function AdminSprintPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [standups, setStandups] = useState([]);
  const [burndownData, setBurndownData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Create Sprint Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    velocityTarget: 20
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sprintsRes, activeRes, backlogRes] = await Promise.all([
        api.get("/api/sprints"),
        api.get("/api/sprints/active").catch(() => ({ data: null })),
        api.get("/api/sprints/backlog")
      ]);
      
      setSprints(sprintsRes.data);
      setBacklogTasks(backlogRes.data);
      
      if (activeRes.data) {
        setActiveSprint(activeRes.data);
        loadSprintDetails(activeRes.data.id);
      }
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSprintDetails = async (sprintId) => {
    try {
      const [tasksRes, standupsRes, burndownRes] = await Promise.all([
        api.get(`/api/sprints/${sprintId}/tasks`),
        api.get(`/api/sprints/${sprintId}/standups`),
        api.get(`/api/sprints/${sprintId}/burndown`)
      ]);
      setSprintTasks(tasksRes.data);
      setStandups(standupsRes.data);
      setBurndownData(burndownRes.data);

      // AI Analysis
      const daysLeft = Math.max(0, Math.ceil((new Date(activeSprint?.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
      const aiRes = await api.post("http://localhost:8000/sprint_ai_analysis", {
        sprintName: activeSprint?.name,
        daysLeft: daysLeft || 5,
        tasks: tasksRes.data.map(t => ({
          id: t.id,
          status: t.status,
          storyPoints: t.storyPoints || 1,
          assigneeEmail: t.assigneeEmail || ""
        }))
      });
      setAiAnalysis(aiRes.data);
    } catch (err) {
      console.error("Sprint details load failed", err);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/sprints", newSprint);
      setShowCreateModal(false);
      setNewSprint({
        name: "",
        goal: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        velocityTarget: 20
      });
      fetchInitialData();
    } catch (err) {
      alert("Failed to create sprint");
    }
  };

  const handleStartSprint = async () => {
    if (!activeSprint && sprints.find(s => s.status === "PLANNING")) {
      const sprintToStart = sprints.find(s => s.status === "PLANNING");
      try {
        await api.put(`/api/sprints/${sprintToStart.id}/status`, { status: "ACTIVE" });
        // WAVE 9: Send notification to all users
        api.post("/api/notifications", {
          message: `🚀 Sprint ${sprintToStart.name} has officially started! Check your tasks.`,
          type: "INFO",
          userId: "ALL"
        }).catch(console.error);
        fetchInitialData();
      } catch (err) {
        alert("Failed to start sprint");
      }
    }
  };

  const handleExportCSV = () => {
    const headers = "TaskID,Title,Assignee,Status,Priority,StoryPoints\n";
    const rows = sprintTasks.map(t => 
      `${t.id},${t.title},${t.assigneeEmail},${t.status},${t.priority},${t.storyPoints}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprint_report_${activeSprint?.name || 'export'}.csv`;
    a.click();
  };

  const handleAddTaskToSprint = async (taskId) => {
    if (!activeSprint) return alert("Select or create an active sprint first");
    try {
      await api.post(`/api/sprints/${activeSprint.id}/add-task/${taskId}`);
      fetchInitialData();
    } catch (err) {
      alert("Failed to add task");
    }
  };

  if (loading) return <div className="loading-state">🧠 Initializing Scrum Engine...</div>;

  return (
    <div className="scrum-hub-container" style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)", padding: "24px 32px", borderRadius: "16px", color: "white" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>🚀 Scrum Intelligence Hub</h1>
          {activeSprint ? (
            <p style={{ margin: "4px 0 0", color: "#bfdbfe" }}>Active: <strong>{activeSprint.name}</strong> • Goal: {activeSprint.goal}</p>
          ) : (
            <p style={{ margin: "4px 0 0", color: "#bfdbfe" }}>No active sprint. Organize your backlog to begin.</p>
          )}
        </div>
        
        {activeSprint && aiAnalysis && (
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", opacity: 0.8 }}>Delay Risk</div>
              <div style={{ fontWeight: "700", color: aiAnalysis.delayRisk === "HIGH" ? "#fca5a5" : "#86efac" }}>{aiAnalysis.delayRisk}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", opacity: 0.8 }}>Forecast</div>
              <div style={{ fontWeight: "700" }}>{aiAnalysis.completionForecast}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === tab ? "#1e293b" : "#ffffff",
              color: activeTab === tab ? "#ffffff" : "#64748b",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-viewport" style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", minHeight: "600px" }}>
        
        {/* BACKLOG TAB */}
        {activeTab === TABS[0] && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#1e293b" }}>Product Backlog</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                {!activeSprint && sprints.some(s => s.status === "PLANNING") && (
                   <button onClick={handleStartSprint} style={{ padding: "8px 16px", background: "#059669", color: "white", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}>▶️ Start Sprint</button>
                )}
                <button onClick={() => setShowCreateModal(true)} style={{ padding: "8px 16px", background: "#3b82f6", color: "white", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}>+ Create Sprint</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {backlogTasks.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Backlog is empty. No tasks to assign.</div>
              ) : backlogTasks.map(task => (
                <div key={task.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "#1e293b" }}>{task.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{task.priority} • {task.storyPoints || 0} pts</div>
                  </div>
                  <button onClick={() => handleAddTaskToSprint(task.id)} style={{ padding: "6px 12px", borderRadius: "8px", background: "#dbeafe", color: "#1e40af", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                    → Move to Sprint
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SPRINT BOARD TAB */}
        {activeTab === TABS[1] && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", height: "100%" }}>
            {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(status => (
              <div key={status} style={{ background: "#f1f5f9", borderRadius: "12px", padding: "12px", minHeight: "400px" }}>
                <div style={{ fontWeight: "700", color: "#475569", fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", padding: "0 4px" }}>{status.replace('_', ' ')}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sprintTasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} style={{ background: "white", padding: "12px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${task.priority === 'CRITICAL' ? '#ef4444' : '#3b82f6'}` }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b" }}>{task.title}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{task.assigneeEmail || "Unassigned"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BURNDOWN TAB */}
        {activeTab === TABS[2] && (
          <div>
            <h2 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "20px" }}>Sprint Burndown Chart ({burndownData?.totalPoints} pts)</h2>
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={burndownData?.data || []}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" style={{ fontSize: "10px" }} />
                  <YAxis style={{ fontSize: "10px" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" fill="transparent" name="Ideal Burn" />
                  <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Remaining Points" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: "20px", padding: "20px", background: "#f8fafc", borderRadius: "12px", fontSize: "13px", color: "#475569" }}>
              💡 <strong>AI Tip:</strong> {aiAnalysis?.summary}
            </div>
          </div>
        )}

        {/* STANDUP TAB */}
        {activeTab === TABS[3] && (
          <div>
            <h2 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "20px" }}>Daily Standup Feed</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {standups.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px" }}>No standup logs found for this sprint yet.</div>
              ) : standups.map(log => (
                <div key={log.id} style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700" }}>👤 {log.userEmail ? log.userEmail.split('@')[0] : (log.userId || 'Unknown User')}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Yesterday</div>
                      <div style={{ fontSize: "13px" }}>{log.yesterday}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Today</div>
                      <div style={{ fontSize: "13px" }}>{log.today}</div>
                    </div>
                  </div>
                  {log.blockers && (
                    <div style={{ marginTop: "12px", padding: "10px", background: "#fee2e2", borderRadius: "8px", fontSize: "12px", color: "#dc2626" }}>
                      🛑 <strong>Blocker:</strong> {log.blockers}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RETROSPECTIVE TAB */}
        {activeTab === TABS[4] && (
          <div style={{ maxWidth: "800px" }}>
            <h2 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "20px" }}>Sprint Retrospective & Insights</h2>
            
            <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", padding: "24px", borderRadius: "16px", border: "1px solid #bae6fd", marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#0369a1" }}>🤖 AI Performance Summary</h3>
              <p style={{ fontSize: "14px", color: "#0c4a6e", lineHeight: "1.6" }}>
                {aiAnalysis?.summary || "Analyzing current sprint progress..."}
              </p>
              {aiAnalysis?.overloadedUsers?.length > 0 && (
                <div style={{ marginTop: "16px", background: "white", padding: "12px", borderRadius: "10px", fontSize: "13px", color: "#0c4a6e" }}>
                  ⚠️ <strong>Action Required:</strong> {aiAnalysis.reallocationSuggestion}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#059669" }}>✅ What went well?</h4>
                <textarea style={{ width: "100%", height: "100px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" }} placeholder="Notes..."></textarea>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#dc2626" }}>❌ What can be improved?</h4>
                <textarea style={{ width: "100%", height: "100px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" }} placeholder="Notes..."></textarea>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={handleExportCSV} style={{ padding: "12px 24px", background: "#ffffff", color: "#1e293b", borderRadius: "10px", border: "1px solid #e2e8f0", fontWeight: "700", cursor: "pointer" }}>
                📥 Export CSV Report
              </button>
              <button style={{ padding: "12px 24px", background: "#1e293b", color: "white", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer" }}>
                Archive & Start Next Sprint →
              </button>
            </div>
          </div>
        )}

        {/* CREATE SPRINT MODAL */}
        {showCreateModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
             <div style={{ background: "white", padding: "30px", borderRadius: "20px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Plan New Sprint</h3>
                <form onSubmit={handleCreateSprint}>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Sprint Name</label>
                    <input required className="form-input" value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px" }} />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Sprint Goal</label>
                    <input required className="form-input" value={newSprint.goal} onChange={e => setNewSprint({...newSprint, goal: e.target.value})} style={{ width: "100%", padding: "10px", marginTop: "4px" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Start Date</label>
                      <input type="date" required value={newSprint.startDate} onChange={e => setNewSprint({...newSprint, startDate: e.target.value})} style={{ width: "100%", padding: "10px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>End Date</label>
                      <input type="date" required value={newSprint.endDate} onChange={e => setNewSprint({...newSprint, endDate: e.target.value})} style={{ width: "100%", padding: "10px" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#3b82f6", color: "white", fontWeight: "700", cursor: "pointer" }}>Create Sprint</button>
                  </div>
                </form>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
