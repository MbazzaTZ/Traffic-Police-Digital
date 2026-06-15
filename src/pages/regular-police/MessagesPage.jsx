import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { MessageSquare, Send } from "lucide-react";

export default function MessagesPage() {
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const [threads] = useState([]);

  return (
    <DashboardLayout pageTitle="Messages" pageTitle2="Ujumbe">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Messages <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Ujumbe</span></h1>
        <p style={{ color:"#64748B", marginTop:3 }}>Secure internal communications · Mawasiliano ya Ndani</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16, height:560 }}>
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #F1F5F9", fontWeight:700, fontSize:14, color:"#0D3477" }}>Conversations</div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, color:"#94A3B8", padding:20 }}>
            <MessageSquare size={36} style={{ opacity:.2 }} />
            <div style={{ fontSize:13, fontWeight:600, color:"#64748B", textAlign:"center" }}>No conversations yet</div>
            <div style={{ fontSize:12, textAlign:"center" }}>Mazungumzo hayajaanza bado</div>
          </div>
        </div>

        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"#94A3B8" }}>
          <MessageSquare size={48} style={{ opacity:.2 }} />
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Select a conversation</div>
          <div style={{ fontSize:13 }}>Chagua mazungumzo · Messages will appear here</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
