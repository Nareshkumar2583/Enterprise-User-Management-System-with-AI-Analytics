import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminHRIntelligence() {
  const [hrData, setHrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get("/api/admin/hr-intelligence")
      .then(r => setHrData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const riskColor = { CRITICAL: "#ef4444", HIGH: "#f59e0b", MEDIUM: "#3b82f6", LOW: "#10b981" };
  const riskBg = { CRITICAL: "#fee2e2", HIGH: "#fef3c7", MEDIUM: "#dbeafe", LOW: "#d1fae5" };
  const riskIcon = { CRITICAL: "🔴", HIGH: "🟠", MEDIUM: "🔵", LOW: "🟢" };

  const filtered = filter === "ALL" ? hrData : hrData.filter(u => u.churnRisk === filter);
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  hrData.forEach(u => { if (counts[u.churnRisk] !== undefined) counts[u.churnRisk]++; });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
      <div style={{ fontSize: "40px" }}>🧠</div>
      <div style={{ color: "#64748b" }}>Running HR Intelligence Analysis...</div>
    </div>
  );

  return (
    <div style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)", borderRadius: "16px", padding: "28px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "36px" }}>🧠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>HR Intelligence Hub</h2>
            <p style={{ margin: "4px 0 0", color: "#93c5fd", fontSize: "13px" }}>
              AI-powered burnout detection, churn prediction & disengagement alerts for every employee
            </p>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {Object.entries(counts).map(([risk, count]) => (
          <div key={risk} onClick={() => setFilter(filter === risk ? "ALL" : risk)}
            style={{ background: "white", padding: "20px", borderRadius: "12px", border: `1px solid #e2e8f0`, borderLeft: `4px solid ${riskColor[risk]}`, cursor: "pointer", boxShadow: filter === risk ? `0 0 0 2px ${riskColor[risk]}` : "none", transition: "all 0.2s" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>{riskIcon[risk]} {risk} RISK</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: riskColor[risk], margin: "8px 0 0" }}>{count}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>employees</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${f === "ALL" ? "#e2e8f0" : riskColor[f] || "#e2e8f0"}`, background: filter === f ? (f === "ALL" ? "#1e293b" : riskBg[f]) : "white", color: filter === f ? (f === "ALL" ? "white" : riskColor[f]) : "#64748b", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
            {f === "ALL" ? `All (${hrData.length})` : `${riskIcon[f]} ${f} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Employee Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", color: "#1e293b" }}>Employee Disengagement Risk Analysis</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{filtered.length} employee(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No employees in this risk category</div>
        ) : filtered.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "18px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}
            onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseOut={e => e.currentTarget.style.background = "white"}>

            {/* Avatar */}
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `hsl(${(i * 50) + 180}, 60%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px", flexShrink: 0 }}>
              {u.name?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "15px" }}>{u.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{u.email} • {u.department} • {u.role}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                  <span style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: riskBg[u.churnRisk], color: riskColor[u.churnRisk] }}>
                    {riskIcon[u.churnRisk]} {u.churnRisk}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: riskColor[u.churnRisk] }}>
                    {Math.round(u.churnScore * 100)}%
                  </span>
                  <span style={{
                    fontSize: "11px", padding: "3px 8px", borderRadius: "10px",
                    background: u.daysSinceLogin >= 14 ? "#fee2e2" : u.daysSinceLogin >= 7 ? "#fef3c7" : "#d1fae5",
                    color: u.daysSinceLogin >= 14 ? "#dc2626" : u.daysSinceLogin >= 7 ? "#b45309" : "#065f46",
                    fontWeight: "600"
                  }}>
                    {u.daysSinceLogin === 0 ? "Active today" : u.daysSinceLogin === 1 ? "1 day ago" : `${u.daysSinceLogin}d inactive`}
                  </span>
                </div>
              </div>

              {u.alert && (
                <div style={{ marginTop: "10px", background: riskBg[u.churnRisk], border: `1px solid ${riskColor[u.churnRisk]}30`, borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: riskColor[u.churnRisk] }}>
                  {u.alert}
                </div>
              )}

              <div style={{ marginTop: "10px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong style={{ color: "#374151" }}>Primary Signal:</strong> {u.primaryReason}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong style={{ color: "#374151" }}>Action:</strong> {u.recommendation}
                </div>
                {u.burnoutRisk && u.burnoutRisk !== "LOW" && (
                  <span style={{
                    fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: "700",
                    background: u.burnoutRisk === "HIGH" ? "#fff1f2" : "#fff7ed",
                    color: u.burnoutRisk === "HIGH" ? "#be123c" : "#c2410c",
                    border: `1px solid ${u.burnoutRisk === "HIGH" ? "#fda4af" : "#fed7aa"}`
                  }}>
                    🔥 Burnout: {u.burnoutRisk} ({u.activeTasks || 0} active tasks{u.criticalTasks > 0 ? `, ${u.criticalTasks} CRITICAL` : ""})
                  </span>
                )}
              </div>

              {/* Score bar */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${u.churnScore * 100}%`, background: riskColor[u.churnRisk], borderRadius: "3px", transition: "width 0.5s" }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
