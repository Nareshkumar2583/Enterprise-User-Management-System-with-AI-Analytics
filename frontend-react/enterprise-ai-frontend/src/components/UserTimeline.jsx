export default function UserTimeline({ timeline }) {
  return (
    <div>
      <h3>Activity Timeline</h3>

      <ul style={{ marginTop: 15 }}>
        {timeline.map((item, index) => (
          <li key={index} style={{
            padding: "12px",
            marginBottom: "10px",
            borderLeft: "4px solid #2563eb",
            background: "#f8fafc",
            borderRadius: "6px"
          }}>
            <strong>{item.action}</strong>
            <br />
            <small>
              {new Date(item.timestamp).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
