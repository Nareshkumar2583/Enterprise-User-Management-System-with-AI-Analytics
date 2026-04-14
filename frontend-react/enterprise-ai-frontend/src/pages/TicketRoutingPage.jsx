import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

const SAMPLE_TICKETS = [
  { subject: "Cannot access VPN", body: "My VPN stopped working since this morning. I cannot connect to internal systems. Urgent!" },
  { subject: "Requesting training course", body: "Hi, I would like to enroll in the React advanced certification course when possible." },
  { subject: "Salary discrepancy this month", body: "My salary this month was lower than expected. Please help me resolve the billing issue." }
];

export default function TicketRoutingPage() {
  const { user } = useContext(AuthContext);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState([]);

  const priorityColor = { CRITICAL: "#ef4444", HIGH: "#f59e0b", MEDIUM: "#3b82f6", LOW: "#10b981" };
  const priorityBg = { CRITICAL: "#fee2e2", HIGH: "#fef3c7", MEDIUM: "#dbeafe", LOW: "#d1fae5" };
  const deptIcon = {
    "IT Security": "🔐", "Finance & Payroll": "💰", "Human Resources": "👥",
    "IT Hardware": "💻", "Engineering": "⚙️", "Learning & Development": "📚", "General Support": "📋"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/user/smart-ticket", { subject, body });
      setResult(res.data);
      setSubmitted(prev => [{ ...res.data, subject, body, submittedAt: new Date().toLocaleString() }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fillSample = (ticket) => {
    setSubject(ticket.subject);
    setBody(ticket.body);
    setResult(null);
  };

  return (
    <div style={{ padding: "30px", maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)", borderRadius: "16px", padding: "28px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "36px" }}>🎫</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>Smart Support Tickets</h2>
            <p style={{ margin: "4px 0 0", color: "#d8b4fe", fontSize: "13px" }}>
              NLP-powered ticket routing — AI automatically classifies your request and routes to the right team
            </p>
          </div>
        </div>
      </div>

      {/* Sample Prompts */}
      <div>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "bold", marginBottom: "10px" }}>💡 Try a sample ticket:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SAMPLE_TICKETS.map((t, i) => (
            <button key={i} onClick={() => fillSample(t)}
              style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", color: "#4f46e5", fontWeight: "500", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#ede9fe"}
              onMouseOut={e => e.currentTarget.style.background = "white"}>
              {t.subject}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Left: Ticket Form */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1e293b" }}>📝 Submit a Ticket</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#374151", marginBottom: "6px" }}>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Briefly describe your issue..." required
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#374151", marginBottom: "6px" }}>Details</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Provide full details of your request or issue..." required rows={6}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: "#7c3aed", color: "white", border: "none", padding: "13px", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "⏳ AI Analyzing..." : "🚀 Submit & Auto-Route"}
            </button>
          </form>
        </div>

        {/* Right: AI Result */}
        <div>
          {!result ? (
            <div style={{ background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0", padding: "40px", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤖</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>Submit a ticket to see the AI classification result here</div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", background: "#4c1d95", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold" }}>🤖 AI Classification Result</span>
                <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "12px" }}>{result.ticketId}</span>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Department */}
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "28px" }}>{deptIcon[result.department] || "📋"}</span>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>ROUTED TO</div>
                    <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>{result.department}</div>
                  </div>
                </div>

                {/* Priority + Sentiment */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: priorityBg[result.priority], padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>PRIORITY</div>
                    <div style={{ fontWeight: "bold", color: priorityColor[result.priority], fontSize: "15px", marginTop: "4px" }}>{result.priority}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>SENTIMENT</div>
                    <div style={{ fontWeight: "bold", color: "#475569", fontSize: "13px", marginTop: "4px" }}>{result.sentiment}</div>
                  </div>
                </div>

                {/* Urgency Score */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                    <span>Urgency Score</span><span>{Math.round(result.urgencyScore * 100)}%</span>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                    <div style={{ height: "100%", width: `${result.urgencyScore * 100}%`, background: priorityColor[result.priority], borderRadius: "4px" }}></div>
                  </div>
                </div>

                {/* Action + ETA */}
                <div style={{ background: "#ede9fe", borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ fontWeight: "bold", color: "#5b21b6", marginBottom: "4px", fontSize: "13px" }}>📌 {result.suggestedAction}</div>
                  <div style={{ fontSize: "12px", color: "#7c3aed" }}>⏱ Estimated resolution: {result.estimatedResolutionHours}h</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submitted Tickets History */}
      {submitted.length > 0 && (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: "#1e293b" }}>
            📁 This Session's Submitted Tickets ({submitted.length})
          </div>
          {submitted.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 20px", borderBottom: i < submitted.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <span style={{ fontSize: "20px" }}>{deptIcon[t.department] || "📋"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{t.subject}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>{t.department} • {t.submittedAt}</div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", background: priorityBg[t.priority], color: priorityColor[t.priority] }}>{t.priority}</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{t.ticketId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
