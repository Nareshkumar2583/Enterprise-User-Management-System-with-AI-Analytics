import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
function AdminUserActivityChart() {
  // Mock data (replace with backend later)
  const data = [
    { name: "Mon", logins: 40 },
    { name: "Tue", logins: 55 },
    { name: "Wed", logins: 35 },
    { name: "Thu", logins: 60 },
    { name: "Fri", logins: 75 },
  ];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>User Activity (Logins)</h3>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="logins" fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export default AdminUserActivityChart;
