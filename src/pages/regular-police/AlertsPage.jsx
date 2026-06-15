import DashboardLayout from "../../layouts/DashboardLayout";
import { Bell } from "lucide-react";

export default function AlertsPage() {
  return (
    <DashboardLayout pageTitle="Alerts" pageTitle2="Tahadhari">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Alert Center <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Kituo cha Tahadhari</span></h1>
        <p style={{ color:"#64748B", marginTop:3 }}>Live operational alerts · Tahadhari za Wakati Halisi</p>
      </div>
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
        <Bell size={48} style={{ opacity:.2, marginBottom:14 }} />
        <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No active alerts</div>
        <div style={{ fontSize:13, marginTop:6 }}>Hakuna tahadhari · Alerts from Control Room will appear here</div>
      </div>
    </DashboardLayout>
  );
}
