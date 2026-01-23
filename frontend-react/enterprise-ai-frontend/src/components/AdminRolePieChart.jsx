import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#2563eb", "#16a34a"];

export default function AdminRolePieChart({ roleDistribution }) {

  const data = Object.entries(roleDistribution).map(
    ([role, count]) => ({ name: role, value: count })
  );

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>Role Distribution</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={100} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

