import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const priorityColor = { CRITICAL: "#ef4444", HIGH: "#f59e0b", MEDIUM: "#3b82f6", LOW: "#10b981" };
  const priorityBg = { CRITICAL: "#fee2e2", HIGH: "#fef3c7", MEDIUM: "#dbeafe", LOW: "#d1fae5" };
  const deptIcon = {
    "IT Security": "🔐", "Finance & Payroll": "💰", "Human Resources": "👥",
    "IT Hardware": "💻", "Engineering": "⚙️", "Learning & Development": "📚", "General Support": "📋"
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/api/admin/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = filter === "ALL" ? tickets : tickets.filter(t => t.priority === filter);

  if (loading) return <div style={{ padding: "40px" }}>Loading tickets...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "24px" }}>Smart Support Tickets 🎫</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Monitor and manage AI-routed support requests across all departments</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(p => (
            <button 
              key={p} 
              onClick={() => setFilter(p)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
                background: filter === p ? "#4f46e5" : "white", color: filter === p ? "white" : "#64748b", transition: "all 0.2s"
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
        {filteredTickets.map(ticket => (
          <div key={ticket.id} style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{deptIcon[ticket.department] || "📋"}</span>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>{ticket.department}</span>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", background: priorityBg[ticket.priority], color: priorityColor[ticket.priority] }}>
                {ticket.priority}
              </span>
            </div>

            <div style={{ padding: "16px", flex: 1 }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b", fontSize: "15px" }}>{ticket.subject}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6", height: "60px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {ticket.body}
              </p>
            </div>

            <div style={{ padding: "16px", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>
                    {ticket.userEmail.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{ticket.userEmail}</span>
                </div>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "10px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold", marginBottom: "4px" }}>AI SUGGESTION</div>
                <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "500" }}>📌 {ticket.suggestedAction}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Urgency: {Math.round(ticket.urgencyScore * 100)}% • ETA: {ticket.estimatedResolutionHours}h</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div style={{ textAlign: "center", padding: "100px 0", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎫</div>
          <h3 style={{ margin: 0, color: "#1e293b" }}>No tickets found</h3>
          <p style={{ color: "#64748b", margin: "8px 0 0" }}>Great! All support requests have been processed.</p>
        </div>
      )}
    </div>
  );
}
