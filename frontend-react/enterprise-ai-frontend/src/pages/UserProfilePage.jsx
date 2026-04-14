import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";

export default function UserProfilePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form stats
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const [securityLogs, setSecurityLogs] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSecurityLogs();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/users/${user.id}`);
      const data = res.data;
      setProfile(data);
      setEmail(data.email || "");
      setDepartment(data.department || "");
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setSkills(data.skills || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const res = await api.get(`/api/audit/user/${user.id}`);
      // Filter for login/security related events if desired, or just show all
      setSecurityLogs(res.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}/profile`, {
        email,
        department,
        phone,
        bio,
        skills
      });
      alert("Profile updated successfully!");
      fetchProfile();
    } catch (e) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  if (loading) return <div style={{ padding: 40 }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: 40 }}>Failed to load profile.</div>;

  return (
    <div style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "24px" }}>My Profile</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Manage your personal details, skills, and secure your account.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Left Column: Edit Profile */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
              👤
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>{profile.name}</h3>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>Edit your personal details below.</p>
              <span style={{ display: "inline-block", marginTop: "8px", background: "#f1f5f9", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", color: "#475569" }}>
                Role: {profile.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>Email Address</label>
              <input 
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>Department</label>
                <input 
                  type="text" value={department} onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Sales..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>Phone Number</label>
                <input 
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>Bio</label>
              <textarea 
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="A short description about your role and expertise..."
                rows={3}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#475569", fontWeight: "bold", marginBottom: "6px" }}>Skills & Capabilities</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input 
                  type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (e.g. React, Java, Management)"
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <button type="button" onClick={addSkill} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 16px", fontWeight: "bold", cursor: "pointer", color: "#475569" }}>
                  Add
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map(s => (
                  <div key={s} style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} style={{ background: "transparent", border: "none", color: "#3730a3", cursor: "pointer", padding: 0, fontWeight: "bold", fontSize: "14px" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ background: "#4f46e5", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
              {saving ? "Saving..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Right Column: Security & Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #16a34a" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔐</span> Security Status
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Account Risk:</span>
              <span style={{ background: profile.riskLevel === 'HIGH' ? '#fee2e2' : '#dcfce7', color: profile.riskLevel === 'HIGH' ? '#dc2626' : '#16a34a', padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                {profile.riskLevel || "LOW"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>2FA Status:</span>
              <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "13px" }}>Disabled</span>
            </div>
            <button style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "6px", width: "100%", padding: "8px", cursor: "pointer", fontWeight: "500", color: "#475569" }}>
              Change Password
            </button>
          </div>

          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🕒</span> Recent Activity
            </h3>
            {securityLogs.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No recent activity.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {securityLogs.map(log => (
                  <div key={log.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#334155" }}>{log.action}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                      <span>{log.details.length > 30 ? log.details.substring(0, 30) + "..." : log.details}</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
