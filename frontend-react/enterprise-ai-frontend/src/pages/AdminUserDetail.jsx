import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get(`/api/admin/users/${id}`)
      .then(res => setUser(res.data))
      .catch(() => navigate("/admin"));
  }, [id, navigate]);

  if (!user) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h2>User Detail</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      {user.role === "USER" && (
        <button onClick={() => api.put(`/api/admin/users/${id}/promote`)}>
          Promote to ADMIN
        </button>
      )}

      {user.role === "ADMIN" && (
        <button onClick={() => api.put(`/api/admin/users/${id}/demote`)}>
          Demote to USER
        </button>
      )}

      <button onClick={() => api.delete(`/api/admin/users/${id}`)}>
        Delete User
      </button>

      <br /><br />
      <button onClick={() => navigate("/admin")}>Back</button>
    </div>
  );
}

