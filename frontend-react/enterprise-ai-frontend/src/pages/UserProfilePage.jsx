import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api/axios";
import "../styles/profile.css";

export default function UserProfilePage() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
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

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!profile) return <div className="profile-loading">Failed to load profile.</div>;

  return (
    <div className="profile-page">
      
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h2 className="profile-page-title">My Profile</h2>
          <p className="profile-page-subtitle">Manage your personal details, skills, and secure your account.</p>
        </div>
      </div>

      {/* Two-column Grid (stacks on mobile) */}
      <div className="profile-grid">
        
        {/* Left Column: Edit Profile */}
        <div className="profile-card">
          <div className="profile-identity">
            <div className="profile-avatar">👤</div>
            <div>
              <h3 className="profile-name">{profile.name}</h3>
              <p className="profile-sub">Edit your personal details below.</p>
              <span className="profile-role-badge">Role: {profile.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input 
                  type="text" value={department} onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Sales..."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea 
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="A short description about your role and expertise..."
                rows={3}
                className="form-input form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Skills &amp; Capabilities</label>
              <div className="skill-input-row">
                <input 
                  type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (e.g. React, Java, Management)"
                  className="form-input"
                />
                <button type="button" onClick={addSkill} className="skill-add-btn">
                  Add
                </button>
              </div>
              <div className="skill-tags">
                {skills.map(s => (
                  <div key={s} className="skill-tag">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="skill-remove-btn">×</button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="profile-save-btn">
              {saving ? "Saving..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Right Column: Security & Activity */}
        <div className="profile-right-col">
          
          {/* Security Status */}
          <div className="profile-card profile-security-card">
            <h3 className="profile-card-title">
              <span>🔐</span> Security Status
            </h3>
            <div className="security-row">
              <span className="security-label">Account Risk:</span>
              <span className={`risk-badge ${profile.riskLevel === 'HIGH' ? 'risk-high' : 'risk-low'}`}>
                {profile.riskLevel || "LOW"}
              </span>
            </div>
            <div className="security-row">
              <span className="security-label">2FA Status:</span>
              <span className="twofa-disabled">Disabled</span>
            </div>
            <button className="change-password-btn">Change Password</button>
          </div>

          {/* Recent Activity */}
          <div className="profile-card">
            <h3 className="profile-card-title">
              <span>🕒</span> Recent Activity
            </h3>
            {securityLogs.length === 0 ? (
              <p className="no-activity">No recent activity.</p>
            ) : (
              <div className="activity-list">
                {securityLogs.map(log => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-action">{log.action}</div>
                    <div className="activity-meta">
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
