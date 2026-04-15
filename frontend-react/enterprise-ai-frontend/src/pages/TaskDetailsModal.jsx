import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function TaskDetailsModal({ task, onClose, onUpdate, onDelete }) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(task.comments || []);
  const [timeSpent, setTimeSpent] = useState(task.timeSpentSeconds || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const { user: currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  
  // WAVE 8: Decision Support
  const [decisionSupport, setDecisionSupport] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const timerRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isAdmin) {
      api.get("/api/admin/users")
        .then(res => setUsers(res.data))
        .catch(err => console.error("Error fetching users", err));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAdmin]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.put(`/api/tasks/${task.id}/comments`, { text: commentText });
      setComments(res.data.comments);
      setCommentText("");
      onUpdate(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to add comment");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const fileUri = uploadRes.data.fileDownloadUri;
      const res = await api.put(`/api/tasks/${task.id}/attachments`, { fileUri });
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const generateAiSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.post("/api/user/summarize-task", {
        taskTitle: task.title,
        taskDescription: task.description || "",
        status: task.status,
        priority: task.priority || "NORMAL",
        timeSpentSeconds: timeSpent,
        comments: task.comments || [],
        estimatedHours: task.estimatedHours || 0
      });
      setAiSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateDecisionSupport = async () => {
    setDecisionLoading(true);
    try {
      // 1. Fetch current team state
      const usersRes = await api.get("/api/admin/users");
      const userList = usersRes.data.map(u => ({
        id: u.id,
        name: u.name || u.email.split('@')[0],
        workload: Math.floor(Math.random() * 100), // In a full app, this connects to the Heatmap endpoint. We mock workload % here.
        skills: u.skills || []
      }));

      // 2. Request AI decision
      const dReq = {
        taskId: task.id,
        taskTitle: task.title,
        currentAssigneeId: task.assigneeId || "",
        teamState: userList
      };

      const dRes = await api.post("/api/admin/decision-support", dReq);
      setDecisionSupport(dRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleAssigneeChange = async (userId) => {
    const selectedUser = users.find(u => u.id === userId);
    if (!selectedUser) return;
    
    setIsUpdatingAssignee(true);
    try {
      const res = await api.put(`/api/tasks/${task.id}/assignee`, {
        assigneeId: selectedUser.id,
        assigneeEmail: selectedUser.email
      });
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to update assignee");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop timer and save to server
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
      // Wait, we should probably save the session to backend
      // But for simplicity, we update local state and call backend
      api.put(`/api/tasks/${task.id}/time`, { secondsToAdd: timeSpent - (task.timeSpentSeconds || 0) })
         .then(res => onUpdate(res.data))
         .catch(e => console.error(e));
    } else {
      // Start timer
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "500px", background: "white", height: "100%", boxShadow: "-4px 0 15px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", transform: "translateX(0)", transition: "transform 0.3s" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "bold", padding: "4px 10px", borderRadius: "12px", background: "#f1f5f9", color: "#64748b", marginBottom: "8px", display: "inline-block" }}>
              {task.status}
            </span>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#1e293b", lineHeight: 1.3 }}>{task.title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isAdmin && (
              <button 
                onClick={() => onDelete(task.id)}
                style={{ background: "#fee2e2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
              >
                🗑️ Delete Task
              </button>
            )}
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }}>×</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ fontSize: "14px", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>Assignee:</strong> 
              {isAdmin ? (
                <select 
                  value={task.assigneeId || ""} 
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  disabled={isUpdatingAssignee}
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              ) : (
                <span>{task.assigneeEmail || "Unassigned"}</span>
              )}
            </div>
            
            <button 
              onClick={generateDecisionSupport}
              disabled={decisionLoading}
              style={{ background: "#475569", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
            >
              {decisionLoading ? "🧠 Analyzing..." : "🧠 AI Recs"}
            </button>
          </div>

          {/* Decision Support Box */}
          {decisionSupport && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold", textTransform: "uppercase", marginBottom: "8px" }}>AI Decision Support Recommendation</div>
              <div style={{ color: "#15803d", fontSize: "14px", marginBottom: "8px" }}><strong>{decisionSupport.recommendation}</strong> {decisionSupport.targetUserName !== "None" && `to ${decisionSupport.targetUserName}`}</div>
              <div style={{ color: "#166534", fontSize: "12px" }}><i>"{decisionSupport.reasoning}"</i></div>
            </div>
          )}

          {/* Time Tracking Widget */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Time Logged</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", fontFamily: "monospace" }}>
                {formatTime(timeSpent)}
              </div>
            </div>
            <button 
              onClick={toggleTimer}
              style={{
                background: isTimerRunning ? "#ef4444" : "#16a34a",
                color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isTimerRunning ? "⏹ Stop Timer" : "▶ Start Timer"}
            </button>
          </div>

          {/* AI Auto Summary Section */}
          <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aiSummary ? "14px" : "0" }}>
              <div style={{ color: "white", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                🧾 AI Task Summary
              </div>
              <button onClick={generateAiSummary} disabled={summaryLoading}
                style={{ background: summaryLoading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: summaryLoading ? "not-allowed" : "pointer", fontWeight: "bold" }}>
                {summaryLoading ? "⏳ Generating..." : aiSummary ? "🔄 Regenerate" : "✨ Generate Summary"}
              </button>
            </div>
            {aiSummary && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#e0e7ff", lineHeight: "1.6" }}>
                  {aiSummary.summary}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {aiSummary.keyPoints?.map((kp, i) => (
                    <span key={i} style={{ background: "rgba(255,255,255,0.15)", color: "#c7d2fe", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>✓ {kp}</span>
                  ))}
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "8px 12px", fontSize: "10px", color: "#818cf8", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {aiSummary.reportReady}
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              📎 Attachments
              {uploading && <span style={{ fontSize: "11px", color: "#3b82f6" }}>Uploading...</span>}
            </h4>
            
            {(task.attachments && task.attachments.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {task.attachments.map((uri, idx) => {
                  const filename = uri.split('/').pop();
                  return (
                    <a key={idx} href={`http://localhost:8080${uri}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", textDecoration: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "bold" }}>
                      📄 {filename}
                    </a>
                  );
                })}
              </div>
            )}

            <label style={{ display: "block", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px", background: "#f8fafc", cursor: "pointer", transition: "background 0.2s" }}>
              <input type="file" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
              Drag & drop files here, or <span style={{ color: "#3b82f6", fontWeight: "bold" }}>browse</span> to upload documents.
            </label>
          </div>

          {/* Comments Section */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#1e293b" }}>💬 Discussion</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              {comments.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>No comments yet.</div>
              ) : (
                comments.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0e7ff", color: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
                      {c.userId.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: "0 12px 12px 12px", fontSize: "13px", color: "#334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "bold" }}>{c.userId}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                      {c.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)}
                placeholder="Type a comment or use @ to mention..."
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
              />
              <button type="submit" style={{ background: "#4f46e5", color: "white", border: "none", padding: "0 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
