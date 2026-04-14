import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function UserAIAssistantPage() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/tasks/user/${user.id}`)
      .then(r => { setTasks(r.data); setInitialLoading(false); })
      .catch(() => setInitialLoading(false));
  }, [user.id]);

  const askAssistant = async (q = query) => {
    if (!q.trim() && !result) return;
    setLoading(true);
    try {
      const res = await api.post("/api/user/ai-assistant", {
        tasks: tasks.map(t => ({
          id: t.id, title: t.title, status: t.status,
          priority: t.priority, delayRisk: t.delayRisk,
          estimatedHours: t.estimatedHours, dueDate: t.dueDate
        })),
        query: q || "what should I do next"
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "What should I do next?",
    "Show my high-priority tasks",
    "Am I overloaded?",
    "Which tasks are at risk?"
  ];

  const typeColors = { suggestion: "#4f46e5", warning: "#f59e0b", info: "#10b981" };
  const typeBg = { suggestion: "#ede9fe", warning: "#fef3c7", info: "#d1fae5" };

  if (initialLoading) return <div style={{ padding: 40 }}>Loading AI Assistant...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)", borderRadius: "16px", padding: "32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "36px" }}>🤖</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px" }}>AI Personal Assistant</h2>
            <p style={{ margin: "4px 0 0", color: "#c7d2fe", fontSize: "14px" }}>Powered by Machine Learning • Always learning your work style</p>
          </div>
        </div>
        {result && <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.12)", padding: "14px 18px", borderRadius: "10px", fontSize: "15px", fontWeight: "bold" }}>
          {result.greeting}
        </div>}
      </div>

      {/* Quick Prompts */}
      <div>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "bold", marginBottom: "10px" }}>⚡ Quick Ask</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {quickQueries.map((q, i) => (
            <button key={i} onClick={() => { setQuery(q); askAssistant(q); }}
              style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", color: "#4f46e5", fontWeight: "500", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#ede9fe"}
              onMouseOut={e => e.currentTarget.style.background = "white"}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askAssistant()}
          placeholder='Ask anything: "What should I focus on?" or "Show urgent tasks"...'
          style={{ flex: 1, padding: "14px 18px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = "#4f46e5"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <button onClick={() => askAssistant()} disabled={loading}
          style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: "12px", padding: "14px 24px", fontSize: "14px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", minWidth: "100px" }}>
          {loading ? "⏳" : "Ask AI →"}
        </button>
      </div>

      {/* AI Response */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Top Recommendation */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #86efac", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>🎯 TOP RECOMMENDATION</div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#15803d" }}>{result.topRecommendation}</div>
          </div>

          {/* Message Cards */}
          {result.messages?.map((msg, i) => (
            <div key={i} style={{ background: typeBg[msg.type] || "#f8fafc", border: `1px solid ${typeColors[msg.type] || "#e2e8f0"}30`, borderLeft: `4px solid ${typeColors[msg.type] || "#64748b"}`, borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "18px" }}>{msg.icon}</span>
                <strong style={{ color: typeColors[msg.type] || "#1e293b", fontSize: "14px" }}>{msg.title}</strong>
              </div>
              <div style={{ color: "#475569", fontSize: "13px", lineHeight: "1.6" }}>{msg.body}</div>
            </div>
          ))}

          {/* Prioritized Task Order */}
          {result.prioritizedTaskIds?.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: "12px", fontSize: "15px" }}>📋 ML-Prioritized Task Order</div>
              {result.prioritizedTaskIds.map((tid, idx) => {
                const t = tasks.find(x => x.id === tid);
                if (!t) return null;
                return (
                  <div key={tid} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "#f8fafc", borderRadius: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "28px", height: "28px", background: idx === 0 ? "#4f46e5" : "#e2e8f0", color: idx === 0 ? "white" : "#64748b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{t.title}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{t.priority} • {t.status} • {t.delayRisk}</div>
                    </div>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "12px", background: t.priority === "CRITICAL" ? "#fee2e2" : "#ede9fe", color: t.priority === "CRITICAL" ? "#991b1b" : "#4f46e5", fontWeight: "bold" }}>
                      {idx === 0 ? "DO NOW" : `#${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
          <div style={{ fontSize: "16px" }}>Ask your AI assistant anything about your work!</div>
        </div>
      )}
    </div>
  );
}
