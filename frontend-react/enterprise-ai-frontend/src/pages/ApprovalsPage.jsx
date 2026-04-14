import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

const STATUS_COLORS = {
  PENDING:  { bg: "#fef3c7", color: "#92400e" },
  APPROVED: { bg: "#dcfce7", color: "#166534" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
};

export default function ApprovalsPage() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState({});
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = isAdmin ? "/api/approvals" : `/api/approvals/user/${user.id}`;
      const res = await api.get(url);
      setRequests(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const decide = async (id, status) => {
    await api.put(`/api/approvals/${id}/decision`, {
      status,
      adminNote: noteInput[id] || ""
    });
    fetchRequests();
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.post("/api/approvals", {
      requesterId: user.id,
      requesterEmail: user.email,
      type: form.type.value,
      description: form.description.value,
    });
    form.reset();
    fetchRequests();
  };

  return (
    <div style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b" }}>{isAdmin ? "📋 Approval Workflow" : "📋 My Requests"}</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            {isAdmin ? "Review and action all pending employee requests." : "Submit and track your approval requests."}
          </p>
        </div>
        <div style={{ background: "#fef3c7", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", color: "#92400e" }}>
          {requests.filter(r => r.status === "PENDING").length} Pending
        </div>
      </div>

      {/* Submit Form (Users only) */}
      {!isAdmin && (
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>➕ New Request</h3>
          <form onSubmit={submitRequest} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <select name="type" required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <option value="">Select request type...</option>
              <option value="ROLE_CHANGE">Role Change Request</option>
              <option value="ACCESS_REQUEST">Access Request</option>
              <option value="TASK_COMPLETE">Task Completion Sign-off</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea name="description" required placeholder="Describe your request in detail..." rows={3}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }} />
            <button type="submit" style={{ background: "#3b82f6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", alignSelf: "flex-start" }}>
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        {loading ? <p>Loading requests...</p> : requests.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center" }}>No requests found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {requests.map(req => {
              const sc = STATUS_COLORS[req.status] || STATUS_COLORS.PENDING;
              return (
                <div key={req.id} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", borderLeft: `4px solid ${sc.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontWeight: "bold", color: "#1e293b" }}>{req.requesterEmail}</span>
                      <span style={{ marginLeft: "10px", background: "#f1f5f9", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>
                        {req.type?.replace("_", " ")}
                      </span>
                    </div>
                    <span style={{ ...sc, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                      {req.status}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: "#475569", fontSize: "14px" }}>{req.description}</p>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Submitted: {new Date(req.createdAt).toLocaleString()}
                    {req.adminNote && <span style={{ marginLeft: "12px", color: "#64748b" }}>Admin Note: <em>{req.adminNote}</em></span>}
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && req.status === "PENDING" && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        placeholder="Optional note for requester..."
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        value={noteInput[req.id] || ""}
                        onChange={e => setNoteInput(p => ({ ...p, [req.id]: e.target.value }))}
                      />
                      <button onClick={() => decide(req.id, "APPROVED")}
                        style={{ background: "#22c55e", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => decide(req.id, "REJECTED")}
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
