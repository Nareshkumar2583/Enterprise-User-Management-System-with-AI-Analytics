import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import TaskDetailsModal from "./TaskDetailsModal";
import "../styles/kanban.css";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function Kanban() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // New: Manual Assignment
  const [users, setUsers] = useState([]);
  const [manualAssigneeId, setManualAssigneeId] = useState("");
  
  // WAVE 8: Bulk Management
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBulkTasks, setSelectedBulkTasks] = useState(new Set());

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const url = isAdmin ? "/api/tasks" : `/api/tasks/user/${user.id}`;
      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || task.status === targetStatus) return;
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: targetStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks(); // Revert on failure
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // WAVE 8: Bulk Handlers
  const toggleBulkTask = (taskId) => {
    const newSelected = new Set(selectedBulkTasks);
    if (newSelected.has(taskId)) newSelected.delete(taskId);
    else newSelected.add(taskId);
    setSelectedBulkTasks(newSelected);
  };

  const executeBulkStatusChange = async (targetStatus) => {
    if (selectedBulkTasks.size === 0) return;
    try {
      await api.put("/api/tasks/bulk-update", {
        taskIds: Array.from(selectedBulkTasks),
        updates: { status: targetStatus }
      });
      setSelectedBulkTasks(new Set());
      setIsBulkMode(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Bulk update failed");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (useAi && isAdmin) {
      setIsAssigning(true);
      try {
        // 1. Ask FastAPI for the best assignment (mock via our proxy)
        const aiRes = await api.post("/api/admin/allocate-task", { description: newTaskTitle });
        const topMatch = aiRes.data.topMatches[0];

        // 2. Create the task with AI Assignment
        const taskData = {
          title: newTaskTitle,
          status: "TODO",
          assigneeId: topMatch.userId,
          assigneeEmail: topMatch.email,
          aiReasoning: topMatch.reason,
          matchScore: topMatch.matchScore
        };

        const createRes = await api.post("/api/tasks", taskData);
        setTasks([...tasks, createRes.data]);
        
      } catch (err) {
        console.error("AI Assignment Failed", err);
        alert("Failed to auto-assign task via AI");
      } finally {
        setIsAssigning(false);
        setNewTaskTitle("");
      }
    } else {
      // Manual/Standard creation without AI
      try {
        const selectedUser = users.find(u => u.id === manualAssigneeId);
        const taskData = {
          title: newTaskTitle,
          status: "TODO",
          assigneeId: isAdmin ? (selectedUser ? selectedUser.id : null) : user.id,
          assigneeEmail: isAdmin ? (selectedUser ? selectedUser.email : null) : user.email
        };
        const res = await api.post("/api/tasks", taskData);
        setTasks([...tasks, res.data]);
        setNewTaskTitle("");
        setManualAssigneeId("");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      console.error("Failed to delete task", err);
      alert("Failed to delete task");
    }
  };

  if (loading) return <div style={{ padding: "40px" }}>Loading Kanban Board...</div>;

  return (
    <div className="kanban-page">
      <div className="kanban-header">
        <h2>{isAdmin ? "Company Scrum Board 🌊" : "My Tasks 📝"}</h2>
        
        {/* Task Creation Form */}
        <form className="task-form" onSubmit={handleCreateTask}>
          <input 
            type="text" 
            placeholder="What needs to be done?" 
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            disabled={isAssigning}
          />
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label className="ai-checkbox">
                <input 
                  type="checkbox" 
                  checked={useAi} 
                  onChange={e => setUseAi(e.target.checked)} 
                  disabled={isAssigning}
                />
                ✨ AI Scrum Master
              </label>

              {!useAi && (
                <select 
                  value={manualAssigneeId} 
                  onChange={e => setManualAssigneeId(e.target.value)}
                  style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                >
                  <option value="">Assign To (Optional)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <button type="submit" disabled={isAssigning || !newTaskTitle.trim()}>
            {isAssigning ? "🤖 AI Thinking..." : "Add Task"}
          </button>
        </form>

        {/* WAVE 8: Bulk Task Controls */}
        {isAdmin && (
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
            <button 
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedBulkTasks(new Set());
              }}
              style={{ background: isBulkMode ? "#ef4444" : "#475569", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              {isBulkMode ? "Cancel Bulk Mode" : "🗂️ Enable Bulk Mode"}
            </button>

            {isBulkMode && selectedBulkTasks.size > 0 && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f1f5f9", padding: "4px 10px", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#334155" }}>Move {selectedBulkTasks.size} tasks to:</span>
                {COLUMNS.map(c => (
                  <button key={c} onClick={() => executeBulkStatusChange(c)} style={{ border: "1px solid #cbd5e1", background: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
                    {c.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => (
          <div 
            key={col} 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, col)}
            onDragOver={handleDragOver}
          >
            <div className="column-header">
              <h3>{col.replace("_", " ")}</h3>
              <span className="task-count">
                {tasks.filter(t => t.status === col).length}
              </span>
            </div>
            
            <div className="column-content">
              {tasks.filter(t => t.status === col).map(task => {
                const isHighRisk = task.delayRisk === "HIGH RISK" || (task.aiReasoning && task.aiReasoning.includes('Penalized'));
                return (
                  <div 
                    key={task.id} 
                    className={`kanban-card ${isHighRisk ? 'card-risk' : ''}`}
                    draggable={!isBulkMode}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => {
                      if (isBulkMode) toggleBulkTask(task.id);
                      else setSelectedTask(task);
                    }}
                    style={{ 
                      cursor: "pointer", 
                      border: isBulkMode && selectedBulkTasks.has(task.id) ? "2px solid #3b82f6" : "",
                      background: isBulkMode && selectedBulkTasks.has(task.id) ? "#eff6ff" : ""
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <p className="task-title" style={{ margin: 0, flex: 1 }}>{task.title}</p>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {isAdmin && (
                          <button 
                            className="task-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                          >
                            ×
                          </button>
                        )}
                        {task.priority && (
                          <span style={{ 
                            fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px", 
                            background: task.priority === "CRITICAL" ? "#fee2e2" : "#f1f5f9", 
                            color: task.priority === "CRITICAL" ? "#ef4444" : "#64748b" 
                          }}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {task.assigneeEmail && (
                      <div className="task-assignee">
                        🗣️ {task.assigneeEmail.split('@')[0]}
                      </div>
                    )}

                    {task.estimatedHours && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                        <span>⏱️ {task.estimatedHours} hrs</span>
                        <span style={{ color: task.delayRisk === "HIGH RISK" ? "#ef4444" : task.delayRisk === "MEDIUM RISK" ? "#f59e0b" : "#22c55e", fontWeight: "bold" }}>
                          Risk: {task.delayRisk}
                        </span>
                      </div>
                    )}

                    {task.aiReasoning && (
                      <div className="task-ai-reason">
                        <strong>AI Match ({task.matchScore}):</strong> {task.aiReasoning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDeleteTask}
          onUpdate={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
        />
      )}
    </div>
  );
}
