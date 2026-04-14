import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../auth/AuthContext";
import UserPerformanceChart from "../components/UserPerformanceChart";
import api from "../api/axios";
import "../styles/dashboard.css";

// ── Gamification Widget ─────────────────────────────────────────────────────────
function GamificationWidget({ user }) {
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    api.get("/api/user/leaderboard").then(r => setLeaderboard(r.data)).catch(console.error);
  }, []);

  // Local gamification from user object
  const points = user?.points || 0;
  const level = user?.level || 1;
  const badges = user?.badges || [];
  const nextLevelPoints = (level + 1) * 100;
  const progress = Math.min((points % 100), 100);

  return (
    <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", borderRadius: "12px", padding: "20px", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>🎮 Gamification</h3>
        <button onClick={() => setShowBoard(!showBoard)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer" }}>
          {showBoard ? "My Stats" : "🏆 Leaderboard"}
        </button>
      </div>

      {!showBoard ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: "bold", color: "#fbbf24" }}>{points}</div>
              <div style={{ fontSize: "11px", color: "#c7d2fe" }}>Total Points</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: "bold", color: "#34d399" }}>Lv. {level}</div>
              <div style={{ fontSize: "11px", color: "#c7d2fe" }}>Current Level</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#c7d2fe", marginBottom: "6px" }}>
              <span>XP Progress</span><span>{progress}/100 to Lv. {level + 1}</span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "4px" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #818cf8, #c4b5fd)", borderRadius: "4px", transition: "width 0.5s" }}></div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <div style={{ fontSize: "11px", color: "#c7d2fe", marginBottom: "8px" }}>BADGES EARNED</div>
            {badges.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {badges.map((b, i) => (
                  <span key={i} style={{ background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>{b}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#818cf8" }}>Complete tasks to earn badges! 🏅</div>
            )}
          </div>
        </>
      ) : (
        <div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", color: "#c7d2fe", fontSize: "13px", padding: "20px 0" }}>No leaderboard data yet</div>
          ) : leaderboard.map((entry, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <span style={{ fontSize: "14px", width: "24px", textAlign: "center" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <div style={{ flex: 1, fontSize: "12px" }}>
                <div style={{ fontWeight: "bold" }}>{entry.name}</div>
                <div style={{ color: "#a5b4fc", fontSize: "11px" }}>Lv. {entry.level}</div>
              </div>
              <span style={{ fontWeight: "bold", color: "#fbbf24", fontSize: "13px" }}>{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Advanced Burnout & Stress Detection ───────────────────────────────────────
function AdvancedBurnoutDetector({ tasks }) {
  const [focusTime, setFocusTime] = useState(0); // seconds
  const [idleTime, setIdleTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [suggestion, setSuggestion] = useState("");
  const intervalRef = useRef(null);
  const idleThreshold = 30; // seconds

  // Stress calculation based on active tasks
  const activeTasks = tasks.filter(t => t.status !== "DONE");
  const criticalCount = activeTasks.filter(t => t.priority === "CRITICAL" || t.delayRisk === "HIGH RISK").length;
  const stressLevel = Math.min(100, Math.round((criticalCount * 25) + (activeTasks.length * 5)));
  
  // Overwork calculation based on time tracking
  const overworkScore = Math.min(100, Math.round((focusTime / 3600) * 10)); // Just a mock metric for demo

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const isIdle = (now - lastActivity) / 1000 > idleThreshold;
        if (isIdle) setIdleTime(p => p + 1);
        else setFocusTime(p => p + 1);

        // Smart Break Suggestions
        setFocusTime(ft => {
          if (ft > 0 && ft % (50 * 60) === 0) setSuggestion("🚨 You've worked 50 minutes straight. High risk of eye strain! Take a 10 min break.");
          else if (ft > 0 && ft % (25 * 60) === 0) setSuggestion("🌿 Pomodoro complete! Take a 5-min mental break.");
          return ft;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTracking, lastActivity]);

  useEffect(() => {
    // Override suggestions if stress is too high
    if (stressLevel > 75) {
      setSuggestion("🔥 HIGH STRESS DETECTED! You have too many critical tasks. Speak to your manager or take an immediate recharge break.");
    }
  }, [stressLevel]);

  const fmt = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
        <span>🔥 Advanced Burnout Detection</span>
        <span style={{ fontSize: "10px", background: stressLevel > 75 ? "#ef4444" : stressLevel > 40 ? "#f59e0b" : "#10b981", color: "white", padding: "2px 8px", borderRadius: "12px" }}>
          {stressLevel > 75 ? "CRITICAL RISK" : stressLevel > 40 ? "MODERATE STRESS" : "HEALTHY"}
        </span>
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
            <span>Stress Index</span><span>{stressLevel}%</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px" }}>
            <div style={{ height: "100%", width: `${stressLevel}%`, background: stressLevel > 75 ? "#ef4444" : stressLevel > 40 ? "#f59e0b" : "#10b981", borderRadius: "3px" }}></div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
            <span>Overwork Metric</span><span>{overworkScore}%</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px" }}>
            <div style={{ height: "100%", width: `${overworkScore}%`, background: overworkScore > 75 ? "#ef4444" : "#3b82f6", borderRadius: "3px" }}></div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>{fmt(focusTime)}</div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Deep Focus Logged</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#64748b" }}>{criticalCount}</div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Critical Blockers</div>
        </div>
      </div>

      {suggestion && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#b91c1c", marginBottom: "12px", fontWeight: "500", display: "flex", gap: "8px" }}>
          <span>👉</span> {suggestion}
        </div>
      )}

      <button onClick={() => { setIsTracking(t => !t); if (!isTracking && stressLevel < 75) setSuggestion(""); }}
        style={{ width: "100%", padding: "10px", background: isTracking ? "#fee2e2" : "#0f172a", color: isTracking ? "#991b1b" : "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
        {isTracking ? "⏹ Stop Timer & Rest" : "▶ Start Deep Focus"}
      </button>
    </div>
  );
}

// ── Smart Reminder Widget ───────────────────────────────────────────────────────
function SmartReminders({ tasks }) {
  const reminders = [];
  const now = new Date();

  tasks.filter(t => t.status !== "DONE").forEach(task => {
    if (task.priority === "CRITICAL") {
      reminders.push({ icon: "🚨", text: `CRITICAL: "${task.title}" needs immediate attention!`, color: "#ef4444", bg: "#fee2e2" });
    }
    if (task.delayRisk === "HIGH RISK") {
      reminders.push({ icon: "⚠️", text: `"${task.title}" is at HIGH RISK of delay`, color: "#f59e0b", bg: "#fef3c7" });
    }
    if (task.dueDate) {
      try {
        const due = new Date(task.dueDate);
        const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 2 && daysLeft >= 0) {
          reminders.push({ icon: "📅", text: `"${task.title}" is due in ${daysLeft === 0 ? "TODAY" : daysLeft + " day(s)"}!`, color: "#dc2626", bg: "#fef2f2" });
        }
      } catch {}
    }
  });

  if (reminders.length === 0) return null;

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
        🔔 Smart Reminders <span style={{ background: "#ef4444", color: "white", borderRadius: "12px", padding: "1px 8px", fontSize: "11px" }}>{reminders.length}</span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {reminders.map((r, i) => (
          <div key={i} style={{ background: r.bg, border: `1px solid ${r.color}40`, borderLeft: `3px solid ${r.color}`, borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: r.color, fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{r.icon}</span> {r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Auto Task Prioritization ────────────────────────────────────────────────────
function AutoPrioritizedTasks({ tasks }) {
  const active = tasks.filter(t => t.status !== "DONE");
  
  const scored = active.map(t => {
    let score = 0;
    if (t.priority === "CRITICAL") score += 100;
    else if (t.priority === "NORMAL") score += 50;
    if (t.delayRisk === "HIGH RISK") score += 80;
    else if (t.delayRisk === "MEDIUM RISK") score += 40;
    if (t.status === "IN_PROGRESS") score += 30;
    if (t.dueDate) {
      try {
        const days = Math.ceil((new Date(t.dueDate) - new Date()) / 86400000);
        if (days < 2) score += 70;
        else if (days < 5) score += 40;
      } catch {}
    }
    return { ...t, _score: score };
  }).sort((a, b) => b._score - a._score);

  if (scored.length === 0) return null;

  const riskColor = { "HIGH RISK": "#ef4444", "MEDIUM RISK": "#f59e0b", "LOW RISK": "#10b981" };
  const priorityColor = { CRITICAL: "#ef4444", NORMAL: "#4f46e5", BACKLOG: "#64748b" };

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
        🔄 Auto-Prioritized Tasks <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>ML reordered by urgency</span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {scored.slice(0, 5).map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: i === 0 ? "#ede9fe" : "#f8fafc", borderRadius: "8px", border: i === 0 ? "1px solid #c4b5fd" : "1px solid #f1f5f9" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: i === 0 ? "#4f46e5" : "#e2e8f0", color: i === 0 ? "white" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: i === 0 ? "bold" : "normal", color: "#1e293b", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{t.status?.replace("_", " ")}</div>
            </div>
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "8px", background: `${priorityColor[t.priority] || "#64748b"}20`, color: priorityColor[t.priority] || "#64748b", fontWeight: "bold" }}>
                {t.priority || "?"}
              </span>
              {t.delayRisk && (
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "8px", background: `${riskColor[t.delayRisk] || "#64748b"}15`, color: riskColor[t.delayRisk] || "#64748b", fontWeight: "bold" }}>
                  {t.delayRisk?.replace(" RISK", "")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpiRes, taskRes, auditRes, profileRes] = await Promise.all([
          api.get("/api/user/risk-analysis"),
          api.get(`/api/tasks/user/${user.id}`),
          api.get(`/api/audit/user/${user.id}`),
          api.get("/api/user/me").catch(() => ({ data: null }))
        ]);
        setAnalytics(kpiRes.data);
        setTasks(taskRes.data);
        setActivityFeed(auditRes.data.slice(0, 8));
        setProfile(profileRes.data);
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user.id]);

  // Award points when task completes (hook into tasks)
  useEffect(() => {
    const doneTasks = tasks.filter(t => t.status === "DONE");
    if (doneTasks.length > 0 && profile) {
      const expectedPoints = doneTasks.length * 10;
      if ((profile.points || 0) < expectedPoints) {
        api.post("/api/user/award-points", { points: 10 }).catch(console.error);
      }
    }
  }, [tasks, profile]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>⚡ Loading AI Dashboard...</div>;
  if (!analytics) return <div style={{ padding: 40 }}>Failed to load insights. Check that all services are running.</div>;

  const completedCount = tasks.filter(t => t.status === "DONE").length;
  const pendingCount = tasks.length - completedCount;
  const profileUser = profile || user;

  return (
    <div style={{ padding: "28px", maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#1e293b" }}>
            Welcome back, {profileUser.name || user.email.split("@")[0]}! 👋
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Here's your AI-powered intelligence briefing for today.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ede9fe", padding: "6px 14px", borderRadius: "20px" }}>
          <span style={{ fontWeight: "bold", color: "#4f46e5", fontSize: "13px" }}>Lv. {profileUser.level || 1}</span>
          <span style={{ fontSize: "13px", color: "#7c3aed" }}>⚡ {profileUser.points || 0} pts</span>
        </div>
      </div>

      {/* Smart Reminders (top-of-page alerts) */}
      <SmartReminders tasks={tasks} />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Total Tasks", value: tasks.length, icon: "📋", color: "#1e293b", border: "#e2e8f0" },
          { label: "Completed", value: completedCount, icon: "✅", color: "#16a34a", border: "#16a34a" },
          { label: "Pending", value: pendingCount, icon: "⏳", color: "#f59e0b", border: "#f59e0b" },
          { label: "Productivity", value: `${analytics.productivityScore}%`, icon: "⚡", color: "#4f46e5", border: "#4f46e5" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: `4px solid ${kpi.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}><span>{kpi.icon}</span>{kpi.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: kpi.color, margin: "8px 0 0" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Next Best Task Recommendation */}
          <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)", borderRadius: "12px", padding: "24px", color: "white" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✨</span> AI Next Best Task Recommendation
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#e0e7ff" }}>ML has analyzed your skill set, deadlines, and workload to suggest your highest-impact task:</p>
            <div style={{ background: "rgba(255,255,255,0.15)", padding: "14px 18px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", borderLeft: "4px solid #818cf8" }}>
              {analytics.nextBestTask}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>{analytics.engagementScore}%</div>
                <div style={{ fontSize: "11px", color: "#c7d2fe" }}>Engagement</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: analytics.riskLevel === "HIGH" ? "#fca5a5" : "#86efac" }}>{analytics.riskLevel}</div>
                <div style={{ fontSize: "11px", color: "#c7d2fe" }}>Risk Level</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>{analytics.retentionProbability}%</div>
                <div style={{ fontSize: "11px", color: "#c7d2fe" }}>Retention Score</div>
              </div>
            </div>
          </div>

          {/* Auto-Prioritized Tasks */}
          <AutoPrioritizedTasks tasks={tasks} />

          {/* Advanced Burnout Detector */}
          <AdvancedBurnoutDetector tasks={tasks} />

          {/* Performance Chart */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b" }}>📈 Performance Forecast</h3>
            <div style={{ height: "220px" }}><UserPerformanceChart /></div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Gamification */}
          <GamificationWidget user={profileUser} />

          {/* Activity Feed */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📜</span> Activity Timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {activityFeed.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>No recent activity.</div>
              ) : activityFeed.map((log, index) => (
                <div key={log.id} style={{ display: "flex", gap: "10px", position: "relative" }}>
                  {index !== activityFeed.length - 1 && (
                    <div style={{ position: "absolute", left: "11px", top: "24px", bottom: "-14px", width: "2px", background: "#e2e8f0" }}></div>
                  )}
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#eff6ff", border: "2px solid #3b82f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }}></div>
                  </div>
                  <div style={{ flex: 1, paddingBottom: "4px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b", display: "flex", justifyContent: "space-between" }}>
                      {log.action?.replace(/_/g, " ")}
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "normal" }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {log.details?.length > 45 ? log.details.substring(0, 45) + "..." : log.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
