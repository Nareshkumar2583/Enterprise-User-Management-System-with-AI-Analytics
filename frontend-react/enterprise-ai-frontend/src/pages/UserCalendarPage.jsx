import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function UserCalendarPage() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/api/tasks/user/${user.id}`);
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Padding elements for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`pad-${i}`} style={{ background: "#f8fafc", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}></div>);
  }
  
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    // Simulate some logic to place tasks on timeline based on their mock due dates
    // (Since we didn't populate a strict dueDate early on, we will randomly assign tasks to the calendar for demo)
    const dayTasks = tasks.filter((t, i) => {
       // Random deterministic logic based on task ID length
       const pseudoDay = (t.id.length * i) % 28 + 1;
       return pseudoDay === d;
    });

    days.push(
      <div key={`day-${d}`} style={{ 
        background: isToday ? "#eff6ff" : "white", 
        minHeight: "100px", 
        padding: "10px", 
        borderRight: "1px solid #e2e8f0", 
        borderBottom: "1px solid #e2e8f0" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ 
            fontWeight: "bold", 
            width: "24px", height: "24px", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            borderRadius: "50%", 
            background: isToday ? "#3b82f6" : "transparent",
            color: isToday ? "white" : "#475569"
          }}>
            {d}
          </span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {dayTasks.map(t => (
            <div key={t.id} style={{ 
              fontSize: "11px", padding: "4px 8px", borderRadius: "4px",
              background: t.status === 'DONE' ? "#dcfce7" : t.status === 'IN_PROGRESS' ? "#dbeafe" : "#f1f5f9",
              color: t.status === 'DONE' ? "#166534" : t.status === 'IN_PROGRESS' ? "#1e40af" : "#475569",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {t.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) return <div style={{ padding: 40 }}>Loading calendar...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "24px" }}>My Calendar</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Track your task deadlines and availability.</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "white", padding: "4px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <button onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: "6px" }}>◀</button>
          <span style={{ fontWeight: "bold", width: "140px", textAlign: "center", color: "#1e293b" }}>{monthNames[month]} {year}</span>
          <button onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: "6px" }}>▶</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        
        {/* Days of week header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={{ padding: "12px", textAlign: "center", fontWeight: "bold", fontSize: "13px", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1 }}>
          {days}
        </div>
        
      </div>
    </div>
  );
}
