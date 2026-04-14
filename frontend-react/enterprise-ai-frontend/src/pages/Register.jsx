import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/login.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/auth/register", { name, email, password, role: "USER" });
      alert("Registration successful! You can now log in.");
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err.response?.data);
      alert(err.response?.data || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleRegister}>
        <h2>Sign Up for Enterprise AI</h2>

        <input
          type="text"
          placeholder="Full Name"
          required
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email Address"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px" }}>
          Already have an account? <Link to="/" style={{ color: "#3b82f6", textDecoration: "none" }}>Log in here</Link>
        </div>

        <div className="login-footer">
          Enterprise AI Analytics System
        </div>
      </form>
    </div>
  );
}
