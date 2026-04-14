import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

function AdminUserActivityChart() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Seed the River model with a startup event on mount
  const seedEvent = () => {
    api.post("/api/admin/track", {
      userId: "system",
      action: "dashboard_view",
      duration: Math.random() * 10 + 1,
    }).catch(() => {});
  };

  const fetchTrends = () => {
    api.get("/api/admin/live-trends")
      .then(res => {
        const raw = res.data;
        const formatted = raw.map((pt, i) => ({
          t: `T${i + 1}`,
          score: parseFloat((pt.score ?? 0).toFixed(3)),
          anomaly: pt.isAnomaly ? 1 : 0,
        }));
        setTrends(formatted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    seedEvent();
    fetchTrends();
    // Poll every 4 seconds and also emit pseudo-events to keep River learning
    intervalRef.current = setInterval(() => {
      seedEvent();
      fetchTrends();
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const isAnomaly = score > 0.7;
      return (
        <div style={{
          background: isAnomaly ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${isAnomaly ? "#f87171" : "#86efac"}`,
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 600
        }}>
          <div style={{ color: "#64748b" }}>{label}</div>
          <div style={{ color: isAnomaly ? "#dc2626" : "#16a34a" }}>
            {isAnomaly ? "ANOMALY" : "Normal"} | Score: {score}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 300 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Live AI Risk Trend</h3>
        <span style={{
          background: "#dcfce7",
          color: "#16a34a",
          fontSize: 11, fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 10,
          animation: "pulse 1.5s infinite"
        }}>LIVE</span>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 60 }}>
          Waiting for River model data...
        </p>
      ) : trends.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 60 }}>
          No trend data yet. Dashboard activity will seed the model.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Anomaly Threshold", position: "right", fontSize: 10, fill: "#ef4444" }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={d => d.payload.anomaly ? <circle key={d.key} cx={d.cx} cy={d.cy} r={5} fill="#ef4444" stroke="#ef4444" /> : null}
              activeDot={{ r: 6, fill: "#8b5cf6" }}
              isAnimationActive={true}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default AdminUserActivityChart;

