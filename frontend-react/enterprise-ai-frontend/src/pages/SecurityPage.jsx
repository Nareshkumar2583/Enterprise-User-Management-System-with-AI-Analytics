import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function SecurityPage() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("password");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState(null);
  const [passLoading, setPassLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  useEffect(() => {
    if (tab === "history") loadHistory();
    if (tab === "alerts") loadAlerts();
  }, [tab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/user/login-history");
      setLoginHistory(res.data);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.get("/api/notifications");
      setSecurityAlerts(res.data.filter(n => n.type === "SECURITY" || n.title?.includes("Security")));
    } catch (e) { console.error(e); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPass !== confirmPass) { setPassMsg({ type: "error", text: "New passwords don't match" }); return; }
    if (newPass.length < 6) { setPassMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    setPassLoading(true);
    try {
      await api.post("/api/user/change-password", { oldPassword: oldPass, newPassword: newPass });
      setPassMsg({ type: "success", text: "✅ Password changed successfully!" });
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      setPassMsg({ type: "error", text: err.response?.data?.error || "Failed to change password" });
    } finally { setPassLoading(false); }
  };

  const runAnomalyCheck = async () => {
    setCheckLoading(true);
    const now = new Date();
    try {
      const res = await api.post("/api/user/login-anomaly", {
        email: user.email,
        loginHour: now.getHours(),
        dayOfWeek: now.getDay() === 0 ? 6 : now.getDay() - 1,
        failedAttempts: 0,
        isNewDevice: false,
        ipCountry: "IN"
      });
      setAnomalyResult(res.data);
    } catch (e) { console.error(e); }
    finally { setCheckLoading(false); }
  };

  const tabs = [
    { id: "password", label: "🔑 Change Password" },
    { id: "history", label: "📜 Login History" },
    { id: "alerts", label: "🚨 Security Alerts" },
    { id: "check", label: "🛡️ Anomaly Check" }
  ];

  return (
    <div style={{ padding: "30px", maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "16px", padding: "28px 32px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "36px" }}>🔒</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>Security Center</h2>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "13px" }}>
              Manage your password, review login activity, and monitor security alerts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "6px", borderRadius: "12px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px", background: tab === t.id ? "white" : "transparent", color: tab === t.id ? "#1e293b" : "#64748b", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Change Password Tab */}
      {tab === "password" && (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px" }}>
          <h3 style={{ margin: "0 0 24px", fontSize: "18px", color: "#1e293b" }}>Change Your Password</h3>
          {passMsg && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", background: passMsg.type === "success" ? "#d1fae5" : "#fee2e2", color: passMsg.type === "success" ? "#065f46" : "#991b1b", fontWeight: "500", fontSize: "14px" }}>
              {passMsg.text}
            </div>
          )}
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "Current Password", value: oldPass, setter: setOldPass, placeholder: "Enter your current password" },
              { label: "New Password", value: newPass, setter: setNewPass, placeholder: "At least 6 characters" },
              { label: "Confirm New Password", value: confirmPass, setter: setConfirmPass, placeholder: "Repeat your new password" }
            ].map((field, i) => (
              <div key={i}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#374151", marginBottom: "6px" }}>{field.label}</label>
                <input type="password" value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <button type="submit" disabled={passLoading}
              style={{ background: "#4f46e5", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: passLoading ? "not-allowed" : "pointer", marginTop: "8px" }}>
              {passLoading ? "⏳ Changing..." : "🔑 Change Password"}
            </button>
          </form>
        </div>
      )}

      {/* Login History Tab */}
      {tab === "history" && (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: "#1e293b" }}>
            📜 Last 20 Login & Activity Events
          </div>
          {historyLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading history...</div>
          ) : loginHistory.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No activity recorded yet.</div>
          ) : loginHistory.map((event, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 20px", borderBottom: i < loginHistory.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: event.action?.toLowerCase().includes("login") ? "#dcfce7" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {event.action?.toLowerCase().includes("login") ? "🔐" : "📋"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{event.action?.replace(/_/g, " ")}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{event.details || "—"}</div>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", flexShrink: 0 }}>
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Alerts Tab */}
      {tab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {securityAlerts.length === 0 ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
              <div style={{ fontWeight: "bold", color: "#166534", fontSize: "16px" }}>No Security Alerts</div>
              <div style={{ color: "#4ade80", fontSize: "13px", marginTop: "4px" }}>Your account shows no suspicious activity</div>
            </div>
          ) : securityAlerts.map((alert, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #fca5a5", borderLeft: "4px solid #ef4444", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ fontWeight: "bold", color: "#991b1b", marginBottom: "4px" }}>{alert.title}</div>
              <div style={{ fontSize: "13px", color: "#475569" }}>{alert.message}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>{alert.createdAt}</div>
            </div>
          ))}
        </div>
      )}

      {/* Anomaly Check Tab */}
      {tab === "check" && (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛡️</div>
          <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>Real-Time Login Anomaly Scan</h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
            The Isolation Forest ML model will analyze your current session context and flag unusual patterns.
          </p>
          <button onClick={runAnomalyCheck} disabled={checkLoading}
            style={{ background: "#4f46e5", color: "white", border: "none", padding: "14px 32px", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: checkLoading ? "not-allowed" : "pointer" }}>
            {checkLoading ? "⏳ Scanning..." : "🔍 Run Security Scan"}
          </button>

          {anomalyResult && (
            <div style={{ marginTop: "28px", textAlign: "left", background: anomalyResult.isAnomaly ? "#fef2f2" : "#f0fdf4", border: `1px solid ${anomalyResult.isAnomaly ? "#fca5a5" : "#86efac"}`, borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: anomalyResult.isAnomaly ? "#991b1b" : "#166534" }}>
                  {anomalyResult.isAnomaly ? "⚠️ Anomaly Detected" : "✅ Session Looks Safe"}
                </div>
                <span style={{ padding: "6px 14px", borderRadius: "20px", background: anomalyResult.action === "BLOCK" ? "#fee2e2" : anomalyResult.action === "WARN" ? "#fef3c7" : "#d1fae5", color: anomalyResult.action === "BLOCK" ? "#991b1b" : anomalyResult.action === "WARN" ? "#78350f" : "#065f46", fontWeight: "bold", fontSize: "13px" }}>
                  {anomalyResult.action}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "white", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>RISK SCORE</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: anomalyResult.isAnomaly ? "#dc2626" : "#16a34a" }}>
                    {Math.round(anomalyResult.riskScore * 100)}%
                  </div>
                </div>
                <div style={{ background: "white", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>ANALYSIS</div>
                  <div style={{ fontSize: "13px", color: "#374151", marginTop: "4px" }}>{anomalyResult.riskReason}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
