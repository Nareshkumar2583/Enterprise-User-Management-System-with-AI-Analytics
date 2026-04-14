import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import "../styles/login.css";   // ✅ ADD THIS

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/api/auth/login", { email, password });
      login(res.data);

      if (res.data.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data);
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px" }}>
          Don't have an account? <Link to="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>Sign up here</Link>
        </div>

        <div className="login-footer">
          Enterprise AI Analytics System
        </div>
      </form>
    </div>
  );
}

