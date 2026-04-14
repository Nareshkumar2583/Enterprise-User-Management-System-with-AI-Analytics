import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function LeavePage() {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState({});
  const isAdmin = user?.role === "ADMIN";

  const STATUS_COLORS = {
    PENDING:  { background: "#fef3c7", color: "#92400e" },
    APPROVED: { background: "#dcfce7", color: "#166534" },
    REJECTED: { background: "#fee2e2", color: "#991b1b" },
  };

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = isAdmin ? "/api/leave" : `/api/leave/user/${user.id}`;
      const res = await api.get(url);
      setLeaves(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const decide = async (id, status) => {
    await api.put(`/api/leave/${id}/decision`, { status, adminNote: noteInput[id] || "" });
    fetchLeaves();
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.post("/api/leave", {
      userId: user.id,
      userEmail: user.email,
      startDate: form.startDate.value,
      endDate: form.endDate.value,
      reason: form.reason.value,
    });
    form.reset();
    fetchLeaves();
  };

  const approvedLeaves = leaves.filter(l => l.status === "APPROVED");
  const onLeaveToday = approvedLeaves.filter(l => {
    const now = new Date().toISOString().slice(0, 10);
    return l.startDate <= now && l.endDate >= now;
  });

  return (
    <div style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b" }}>📅 {isAdmin ? "Leave & Availability Management" : "My Leave Requests"}</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            {isAdmin ? "Manage team availability and approve leave requests." : "Submit leave requests and track approval status."}
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ background: "#fee2e2", padding: "10px 18px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontWeight: "800", fontSize: "20px", color: "#ef4444" }}>{onLeaveToday.length}</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>On Leave Today</div>
            </div>
            <div style={{ background: "#fef3c7", padding: "10px 18px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontWeight: "800", fontSize: "20px", color: "#f59e0b" }}>
                {leaves.filter(l => l.status === "PENDING").length}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Pending Requests</div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Form (Users) */}
      {!isAdmin && (
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>➕ Apply for Leave</h3>
          <form onSubmit={submitLeave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>Start Date</label>
                <input type="date" name="startDate" required style={{ display: "block", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>End Date</label>
                <input type="date" name="endDate" required style={{ display: "block", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }} />
              </div>
            </div>
            <textarea name="reason" required placeholder="Reason for leave..." rows={2}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }} />
            <button type="submit" style={{ background: "#3b82f6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", alignSelf: "flex-start" }}>
              Submit Leave Request
            </button>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>
          {isAdmin ? "All Leave Requests" : "My Leave History"}
        </h3>
        {loading ? <p>Loading...</p> : leaves.length === 0 ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>No leave requests found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {leaves.map(leave => {
              const sc = STATUS_COLORS[leave.status] || STATUS_COLORS.PENDING;
              return (
                <div key={leave.id} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ color: "#1e293b" }}>{leave.userEmail}</strong>
                      <span style={{ marginLeft: "12px", fontSize: "13px", color: "#64748b" }}>
                        📅 {leave.startDate} → {leave.endDate}
                      </span>
                    </div>
                    <span style={{ ...sc, padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {leave.status}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#475569" }}>{leave.reason}</p>
                  {leave.adminNote && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Admin: <em>{leave.adminNote}</em></p>
                  )}

                  {isAdmin && leave.status === "PENDING" && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                      <input placeholder="Optional admin note..."
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        value={noteInput[leave.id] || ""}
                        onChange={e => setNoteInput(p => ({ ...p, [leave.id]: e.target.value }))}
                      />
                      <button onClick={() => decide(leave.id, "APPROVED")}
                        style={{ background: "#22c55e", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => decide(leave.id, "REJECTED")}
                        style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
