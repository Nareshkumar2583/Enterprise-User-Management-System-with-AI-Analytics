import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get(`/api/admin/users/${id}`)
      .then(res => setUser(res.data))
      .catch(() => navigate("/admin"));
  }, [id, navigate]);

  if (!user) return <h2 style={{ textAlign: "center", padding: 50, color: "#64748b" }}>Loading AI Intelligence Profile...</h2>;

  return (
    <div style={{ padding: 40, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.05)", maxWidth: 800, margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h2 style={{ margin: 0, color: "#0f172a" }}>Intelligence Profile</h2>
            <p style={{ margin: "5px 0 0", color: "#64748b" }}>{user.email}</p>
          </div>
          <span style={{ 
            background: user.role === "ADMIN" ? "#dcfce7" : "#e2e8f0", 
            color: user.role === "ADMIN" ? "#16a34a" : "#475569", 
            padding: "6px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px"
          }}>
            {user.role}
          </span>
        </div>

        {/* Alerts & Warnings */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          {user.suspicious && (
            <div style={{ flex: 1, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", padding: "12px", borderRadius: "8px", fontWeight: "600", fontSize: "14px" }}>
              🚨 Sec-Ops Anomaly Detected
            </div>
          )}
          {user.burnoutRisk === "HIGH" && (
            <div style={{ flex: 1, background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", padding: "12px", borderRadius: "8px", fontWeight: "600", fontSize: "14px" }}>
              🔥 Critical Burnout Risk
            </div>
          )}
        </div>

        {/* AI Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
          
          <div style={{ background: "#f1f5f9", padding: "20px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 10px", color: "#334155", fontSize: "13px", textTransform: "uppercase" }}>System Risk Score</h4>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: user.riskScore > 75 ? "#ef4444" : user.riskScore > 40 ? "#f59e0b" : "#10b981", display: "flex", alignItems: "center", gap: "10px" }}>
              {user.riskScore}/100
              <span style={{ fontSize: "12px", background: "white", padding: "4px 8px", borderRadius: "6px", color: "#475569" }}>{user.riskLevel}</span>
            </div>
            <div style={{ background: "#e2e8f0", height: "6px", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
              <div style={{ width: `${user.riskScore}%`, background: user.riskScore > 75 ? "#ef4444" : user.riskScore > 40 ? "#f59e0b" : "#10b981", height: "100%" }}></div>
            </div>
          </div>

          <div style={{ background: "#f1f5f9", padding: "20px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 10px", color: "#334155", fontSize: "13px", textTransform: "uppercase" }}>Engagement Score</h4>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: user.engagementScore > 75 ? "#10b981" : user.engagementScore > 40 ? "#f59e0b" : "#ef4444", display: "flex", alignItems: "center", gap: "10px" }}>
              {user.engagementScore}%
              <span style={{ fontSize: "12px", background: "white", padding: "4px 8px", borderRadius: "6px", color: "#475569" }}>{user.segment}</span>
            </div>
            <div style={{ background: "#e2e8f0", height: "6px", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
              <div style={{ width: `${user.engagementScore}%`, background: user.engagementScore > 75 ? "#10b981" : user.engagementScore > 40 ? "#f59e0b" : "#ef4444", height: "100%" }}></div>
            </div>
          </div>

        </div>

        {/* AI Explanations */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
          <div style={{ background: "#eff6ff", padding: 20, borderRadius: 12, borderLeft: "4px solid #3b82f6" }}>
            <h3 style={{ color: "#1e3a8a", margin: "0 0 10px", fontSize: "14px" }}>🧠 Sec-Ops XAI Insight</h3>
            <p style={{ color: "#1e40af", fontWeight: 500, fontSize: "13px", margin: 0 }}>
              {user.riskReason || "No unusual patterns detected."}
            </p>
          </div>

          <div style={{ background: user.roleRecommendation !== "ROLE_OK" ? "#fbf8cc" : "#f8fafc", padding: 20, borderRadius: 12, borderLeft: `4px solid ${user.roleRecommendation !== "ROLE_OK" ? "#eab308" : "#cbd5e1"}` }}>
            <h3 style={{ color: user.roleRecommendation !== "ROLE_OK" ? "#a16207" : "#475569", margin: "0 0 10px", fontSize: "14px" }}>🤖 Role Recommendation</h3>
            <p style={{ color: user.roleRecommendation !== "ROLE_OK" ? "#854d0e" : "#64748b", fontWeight: 500, fontSize: "13px", margin: 0 }}>
              {user.roleRecommendation === "RECOMMEND_PROMOTE" && "AI recommends promoting to ADMIN based on high engagement and zero risk."}
              {user.roleRecommendation === "RECOMMEND_DEMOTE" && "AI recommends demoting to USER due to highly suspicious activity patterns."}
              {user.roleRecommendation === "ROLE_OK" && "Current permissions align perfectly with behavioral patterns."}
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <h4 style={{ margin: "0 0 15px", color: "#334155", fontSize: "13px", textTransform: "uppercase" }}>Actions</h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          {user.role === "USER" && (
            <button className="btn promote" style={{ display: "flex", alignItems: "center", gap: "5px" }} onClick={() => api.put(`/api/admin/users/${id}/promote`).then(() => window.location.reload())}>
              {user.roleRecommendation === "RECOMMEND_PROMOTE" && "✨"} Promote to ADMIN
            </button>
          )}

          {user.role === "ADMIN" && (
            <button className="btn demote" style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 16px", background:"#f1f5f9", border:"1px solid #cbd5e1", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }} onClick={() => api.put(`/api/admin/users/${id}/demote`).then(() => window.location.reload())}>
              {user.roleRecommendation === "RECOMMEND_DEMOTE" && "✨"} Demote to USER
            </button>
          )}

          <div style={{ flexBasis: "100%", height: 0 }}></div> {/* line break */}
          <h5 style={{ margin: "10px 0 0", width: "100%", color: "#dc2626", fontSize: "12px", textTransform: "uppercase" }}>Advanced Security</h5>

          {!user.blocked ? (
            <button style={{ padding: "8px 16px", background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }} onClick={() => api.put(`/api/admin/users/${id}/block`).then(() => window.location.reload())}>
              🚫 Force Logout & Suspend
            </button>
          ) : (
            <button style={{ padding: "8px 16px", background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }} onClick={() => api.put(`/api/admin/users/${id}/unblock`).then(() => window.location.reload())}>
              ✅ Restore Account
            </button>
          )}

          <button style={{ padding: "8px 16px", background:"#ef4444", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }} onClick={() => api.delete(`/api/admin/users/${id}`).then(() => navigate("/admin"))}>
            Permanently Delete
          </button>
        </div>

        <div style={{ marginTop: "30px", borderTop: "1px solid #e2e8f0", paddingTop: "20px", textAlign: "center" }}>
          <button className="btn view" style={{ background: "transparent", color: "#64748b", border: "none" }} onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

