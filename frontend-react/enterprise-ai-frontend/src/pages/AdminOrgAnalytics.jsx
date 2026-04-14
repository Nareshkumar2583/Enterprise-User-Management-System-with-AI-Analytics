import { useState, useEffect } from "react";
import api from "../api/axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function AdminOrgAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/org-analytics")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Enterprise AI - Organization Analytics", 14, 22);
    
    doc.setFontSize(14);
    doc.text(`Total Users: ${data.totalUsers}`, 14, 34);
    doc.text(`Total Admins: ${data.adminCount}`, 14, 42);

    const tableData = Object.entries(data.departmentDistribution || {}).map(([dept, count]) => [dept, count]);
    autoTable(doc, { 
      startY: 50,
      head: [["Department", "Employee Count"]],
      body: tableData,
    });

    doc.save("org_analytics_report.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      Object.entries(data.departmentDistribution || {}).map(([dept, count]) => ({
        Department: dept,
        EmployeeCount: count
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Org Data");
    XLSX.writeFile(wb, "org_analytics_report.xlsx");
  };

  if (loading) return <div style={{ padding: "40px", color: "#64748b" }}>Loading Org Analytics...</div>;
  if (!data) return <div style={{ padding: "40px", color: "#ef4444" }}>Failed to load data</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "16px", padding: "32px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "40px" }}>📊</span>
          <h2 style={{ margin: "8px 0 4px", fontSize: "24px" }}>Organization Analytics</h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>High-level structural breakdown and reporting</p>
        </div>
        
        {/* Export Support */}
        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
          <button onClick={exportPDF} style={{ background: "#ef4444", color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>📄 Export as PDF</button>
          <button onClick={exportExcel} style={{ background: "#10b981", color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>📗 Export as Excel</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>TOTAL WORKFORCE</div>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "#1e293b" }}>{data.totalUsers}</div>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>PLATFORM ADMINS</div>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "#3b82f6" }}>{data.adminCount}</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: "0 0 16px", color: "#1e293b" }}>Department Distribution</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", fontSize: "13px" }}>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Department</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0" }}>Headcount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.departmentDistribution || {}).map(([dept, count], i) => (
              <tr key={dept} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px 16px", fontWeight: "500", color: "#334155" }}>{dept}</td>
                <td style={{ padding: "12px 16px", color: "#64748b" }}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
