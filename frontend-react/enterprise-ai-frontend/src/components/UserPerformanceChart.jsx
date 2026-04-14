import { useEffect, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../api/axios";

export default function UserPerformanceChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/user/forecast")
      .then(res => {
        const { historical, forecast } = res.data;
        const combined = [
          ...historical.map(d => ({ name: `Day ${d.day}`, historicalValue: d.value, forecastValue: null })),
          ...forecast.map(d => ({ name: `Day +${d.day}`, historicalValue: null, forecastValue: d.value }))
        ];
        
        // Connect the lines by setting the last historical point as the first forecast point
        if (historical.length > 0 && forecast.length > 0) {
          const lastHist = historical[historical.length - 1];
          combined.find(c => c.name === `Day ${lastHist.day}`).forecastValue = lastHist.value;
        }
        
        setData(combined);
      })
      .catch(err => console.error("Forecast API error", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: "20px" }}>Loading AI Forecast Model...</p>;
  if (data.length === 0) return <p style={{ textAlign: "center", padding: "20px" }}>Failed to load forecast data.</p>;

  return (
    <div style={{ width: "100%", height: 350 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, color: "#1e293b" }}>Predictive Activity Forecast</h3>
        <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#64748b" }}>ARIMA Simulation</span>
      </div>

      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={30} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
            labelStyle={{ color: "#475569", fontWeight: "bold", marginBottom: "5px" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          
          <Area 
            type="monotone" 
            dataKey="historicalValue" 
            name="Historical Data" 
            stroke="#2563eb" 
            fillOpacity={1} 
            fill="url(#colorHist)" 
            strokeWidth={3}
            isAnimationActive={true}
          />
          <Line 
            type="monotone" 
            dataKey="forecastValue" 
            name="AI Forecast (30 days)" 
            stroke="#8b5cf6" 
            strokeDasharray="5 5" 
            strokeWidth={3} 
            dot={false}
            isAnimationActive={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
