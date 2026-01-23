import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { name: "Completed Tasks", value: 65 },
  { name: "Pending Tasks", value: 25 },
  { name: "Overdue Tasks", value: 10 },
];

const COLORS = ["#22c55e", "#facc15", "#ef4444"];

export default function UserPerformanceChart() {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3 style={{ marginBottom: "10px" }}>Performance Overview</h3>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            label
            outerRadius={90}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
