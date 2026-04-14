import { useState } from "react";
import api from "../api/axios";

export default function SessionLockModal({ onUnlock, userEmail }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Re-verify password against login endpoint
      await api.post("/api/auth/login", { email: userEmail, password });
      onUnlock();
    } catch (err) {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", padding: "32px", borderRadius: "16px", width: "400px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", textAlign: "center" }}>
        
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
        
        <h2 style={{ margin: "0 0 8px", color: "#1e293b" }}>Session Locked</h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
          Our AI security systems detected highly unusual behavioral patterns indicating a potential account takeover. Please verify your identity to continue.
        </p>

        <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#475569", fontWeight: "bold", textAlign: "left", marginBottom: "4px" }}>Account</div>
            <div style={{ padding: "10px", background: "#f1f5f9", borderRadius: "8px", color: "#1e293b", textAlign: "left", fontWeight: "500", border: "1px solid #cbd5e1" }}>
              {userEmail}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: "12px", color: "#475569", fontWeight: "bold", textAlign: "left", marginBottom: "4px" }}>Password</div>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your specific password"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "bold" }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ background: "#4f46e5", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            {loading ? "Verifying..." : "Unlock Session ➔"}
          </button>
        </form>

      </div>
    </div>
  );
}
