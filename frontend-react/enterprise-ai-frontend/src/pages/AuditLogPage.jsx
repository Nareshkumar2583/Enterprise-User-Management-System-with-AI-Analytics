import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/audit");
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "40px" }}>Loading SOC2 Audit Logs...</div>;

  return (
    <div style={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#1e293b" }}>System Audit Logs 📜</h2>
      </div>

      <div className="table-container" style={{ flex: 1, overflowY: "auto" }}>
        <table className="user-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor Email</th>
              <th>Action Type</th>
              <th>System Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const dateObj = new Date(log.timestamp);
              return (
                <tr key={log.id}>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>
                    {dateObj.toLocaleString()}
                  </td>
                  <td><strong>{log.actorEmail}</strong></td>
                  <td>
                    <span style={{ 
                      background: log.action.includes("CREATED") ? "#dcfce7" : "#e0e7ff",
                      color: log.action.includes("CREATED") ? "#16a34a" : "#4f46e5",
                      padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold"
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: "#475569" }}>{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && <p style={{ textAlign: "center", padding: "20px" }}>No audit events recorded yet.</p>}
      </div>
    </div>
  );
}
