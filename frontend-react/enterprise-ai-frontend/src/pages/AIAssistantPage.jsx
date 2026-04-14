import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import "../styles/ai-assistant.css";

const SUGGESTIONS = [
  "Show high-risk users",
  "Who is overloaded?",
  "Which tasks are delayed?",
  "Show pending approvals",
  "Who is on leave?",
  "Show top performers",
  "What are our skill gaps?",
  "List all users",
  "Show task overview",
];

export default function AIAssistantPage() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    { from: "ai", type: "text", content: "Hello! I'm your Enterprise AI Assistant 🤖\nAsk me anything about your team, tasks, risks, or approvals.", data: [] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (query) => {
    const q = query || input;
    if (!q.trim()) return;
    setInput("");

    const userMsg = { from: "user", type: "text", content: q, data: [] };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Fetch live context to pass to AI
      const [usersRes, tasksRes, approvalsRes, leavesRes] = await Promise.all([
        api.get("/api/admin/users").catch(() => ({ data: [] })),
        api.get("/api/tasks").catch(() => ({ data: [] })),
        api.get("/api/approvals").catch(() => ({ data: [] })),
        api.get("/api/leave").catch(() => ({ data: [] })),
      ]);

      const users = (usersRes.data || []).map(u => ({ id: u.id, email: u.email, role: u.role || "USER" }));

      const payload = {
        query: q,
        users,
        tasks: tasksRes.data || [],
        approvals: approvalsRes.data || [],
        leaves: leavesRes.data || [],
      };

      const res = await api.post("/api/admin/ai-chat", payload);
      const { reply, messages: aiMessages } = res.data;

      const aiMsg = { from: "ai", type: "compound", reply, parts: aiMessages, data: [] };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        from: "ai", type: "text",
        content: "Sorry, I couldn't process that right now. Make sure all services are running.",
        data: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderDataCard = (item, idx) => (
    <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#475569" }}>
      {Object.entries(item).map(([k, v]) => (
        <div key={k}><strong style={{ color: "#1e293b" }}>{k}:</strong> {String(v)}</div>
      ))}
    </div>
  );

  const renderAIMessage = (msg, idx) => {
    if (msg.type === "compound") {
      return (
        <div key={idx} className="chat-bubble chat-ai">
          <div className="chat-avatar">🤖</div>
          <div className="chat-body">
            <div className="chat-reply">{msg.reply}</div>
            {msg.parts?.map((part, pi) => (
              <div key={pi} style={{ marginTop: "10px" }}>
                <div className={`chat-part-header type-${part.type}`}>{part.content}</div>
                {part.data?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                    {part.data.map((item, di) => renderDataCard(item, di))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div key={idx} className="chat-bubble chat-ai">
        <div className="chat-avatar">🤖</div>
        <div className="chat-body"><div className="chat-reply" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div></div>
      </div>
    );
  };

  return (
    <div className="ai-assistant-page">
      <div className="ai-assistant-header">
        <h2>🤖 AI Enterprise Assistant</h2>
        <p>Ask questions in plain English — I'll query your live data and respond instantly.</p>
      </div>

      {/* Suggestions */}
      <div className="chat-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {messages.map((msg, idx) =>
          msg.from === "user" ? (
            <div key={idx} className="chat-bubble chat-user">
              <div className="chat-body chat-body-user">{msg.content}</div>
              <div className="chat-avatar chat-avatar-user">👤</div>
            </div>
          ) : renderAIMessage(msg, idx)
        )}
        {loading && (
          <div className="chat-bubble chat-ai">
            <div className="chat-avatar">🤖</div>
            <div className="chat-body">
              <div className="typing-indicator"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-row" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything: 'Who is overloaded?', 'Show delayed tasks'..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "⏳" : "Send ↑"}
        </button>
      </form>
    </div>
  );
}
