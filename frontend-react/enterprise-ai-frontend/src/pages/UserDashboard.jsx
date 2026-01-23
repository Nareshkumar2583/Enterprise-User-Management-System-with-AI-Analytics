import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import UserPerformanceChart from "../components/UserPerformanceChart";
import api from "../api/axios";
import "../styles/dashboard.css";

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch AI analytics from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/api/user/risk-analysis");
        setAnalytics(res.data);
      } catch (err) {
        console.error("AI API error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return <h3 style={{ padding: 40 }}>Loading dashboard...</h3>;
  }

  if (!analytics) {
    return <h3 style={{ padding: 40 }}>Failed to load analytics</h3>;
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <h2>User Dashboard 👤</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* USER SUMMARY */}
      <div className="card-container">

        <div className="card">
          <h3>Email</h3>
          <p>{user.email}</p>
          <small>Registered account</small>
        </div>

        <div className="card">
          <h3>Your Role</h3>
          <p>{user.role}</p>
          <small>Access permission</small>
        </div>

        <div className="card">
          <h3>Account Status</h3>
          <p>Active ✅</p>
          <small>No restrictions</small>
        </div>

        {/* ⭐ AI ENGAGEMENT SCORE */}
        <div className="card highlight">
          <h3>
            AI Engagement Score <span className="ai-tag">AI</span>
          </h3>
          <p>{analytics.engagementScore}%</p>

          <div
            style={{
              background: "rgba(255,255,255,0.3)",
              height: "10px",
              borderRadius: "8px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                width: `${analytics.engagementScore}%`,
                height: "100%",
                borderRadius: "8px",
                background: "white",
              }}
            />
          </div>

          <small>
            {analytics.engagementScore > 75
              ? "Excellent engagement 🚀"
              : analytics.engagementScore > 50
              ? "Moderate engagement ⚡"
              : "Low engagement ⚠️"}
          </small>
        </div>

        {/* 🔥 AI RISK LEVEL */}
        <div className="card">
          <h3>AI Risk Level</h3>
          <p
            style={{
              color:
                analytics.riskLevel === "LOW"
                  ? "#16a34a"
                  : analytics.riskLevel === "MEDIUM"
                  ? "#eab308"
                  : "#dc2626",
              fontWeight: "bold",
            }}
          >
            {analytics.riskLevel}
          </p>
          <small>Predicted by AI</small>
        </div>

        {/* 📊 RETENTION */}
        <div className="card">
          <h3>Retention Probability</h3>
          <p>{analytics.retentionProbability}%</p>
          <small>Next 30 days</small>
        </div>

        {/* 🧠 AI RECOMMENDATION */}
        <div className="card">
          <h3>AI Recommendation</h3>
          <p style={{ fontSize: "14px" }}>
            {analytics.recommendation}
          </p>
        </div>
      </div>

      {/* PERFORMANCE CHART */}
      <div className="table-container" style={{ minHeight: "320px" }}>
        <h3>Your Performance Overview</h3>
        <UserPerformanceChart />
      </div>

    </div>
  );
}
