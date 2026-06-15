import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Search, Send, MessageSquare } from "lucide-react";

const THREADS = [
  { id:1, from:"OCS Makambako",  role:"Station Commander", badge:"TZP-2020-00012", time:"09:45", unread:2, last:"Please submit your patrol report by 17:00 today.", init:"OCS" },
  { id:2, from:"Sgt. Mwenda",    role:"Sergeant",          badge:"TZP-2019-00087", time:"08:30", unread:0, last:"On my way to Sector B checkpoint. ETA 15 mins.",   init:"SGT" },
  { id:3, from:"Control Room",   role:"Dispatch",          badge:"TZP-CTRL-0001",  time:"07:55", unread:1, last:"Alert: Wanted person Juma Abdallah spotted near bus terminal.", init:"CTRL" },
  { id:4, from:"Cpl. Kilosa",    role:"Corporal",          badge:"TZP-2021-00134", time:"Yesterday", unread:0, last:"Evidence EVD-2026-003 delivered to custody officer.", init:"CPL" },
  { id:5, from:"CID Unit",       role:"CID Department",    badge:"TZP-CID-0056",   time:"Yesterday", unread:0, last:"Case INC-2026-002 upgraded to CID investigation.", init:"CID" },
];

const CONVOS = {
  1: [
    { mine:false, text:"Good morning Inspector Mbaza. Please confirm patrol Sector A started.", time:"07:00" },
    { mine:true,  text:"Good morning sir. Patrol started at 07:05. All clear.", time:"07:06" },
    { mine:false, text:"Please submit your patrol report by 17:00 today.", time:"09:45" },
  ],
  2: [
    { mine:false, text:"INC-2026-003 suspect may have fled towards Mafinga. Need backup?", time:"08:00" },
    { mine:true,  text:"Received. Will coordinate with District. Stand by.", time:"08:15" },
    { mine:false, text:"On my way to Sector B checkpoint. ETA 15 mins.", time:"08:30" },
  ],
  3: [
    { mine:false, text:"Alert: Wanted person Juma Abdallah spotted near bus terminal. All units respond.", time:"07:55" },
    { mine:true,  text:"Acknowledged. Proceeding to bus terminal now.", time:"07:58" },
  ],
};

export default function MessagesPage() {
  const [sel, setSel]     = useState(null);
  const [msg, setMsg]     = useState("");
  const [convos, setConvos] = useState(CONVOS);

  function send() {
    if (!msg.trim() || !sel) return;
    const t = new Date().toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
    setConvos(c => ({ ...c, [sel]: [...(c[sel] || []), { mine:true, text:msg, time:t }] }));
    setMsg("");
  }

  const active = THREADS.find(t => t.id === sel);
  const msgs   = convos[sel] || (active ? [{ mine:false, text:active.last, time:active.time }] : []);

  return (
    <DashboardLayout pageTitle="Messages" pageTitle2="Ujumbe">
      <div className="page-hd">
        <h1 className="page-title">Messages <span className="page-title-sw">· Ujumbe</span></h1>
        <p className="page-sub">Secure internal communications · Mawasiliano ya Ndani</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: 580 }}>
        {/* Thread List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--gray-100)" }}>
            <div className="search-input-wrap" style={{ height: 38 }}>
              <Search size={15} color="var(--gray-400)" />
              <input placeholder="Search messages..." />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {THREADS.map(t => (
              <div key={t.id} onClick={() => setSel(t.id)}
                style={{
                  padding: "13px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--gray-100)",
                  background: sel === t.id ? "var(--blue-50)" : "white",
                  borderLeft: `3px solid ${sel === t.id ? "var(--blue-700)" : "transparent"}`,
                  transition: ".1s",
                }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--blue-900), var(--blue-700))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>{t.init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--blue-800)" }}>{t.from}</span>
                      <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{t.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 1 }}>{t.role}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.last}</div>
                  </div>
                  {t.unread > 0 && (
                    <span style={{ background: "var(--danger)", color: "white", fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.unread}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {sel ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, var(--blue-900), var(--blue-700))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 800 }}>
                {active?.init}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--blue-800)" }}>{active?.from}</div>
                <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{active?.role} · {active?.badge}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className="badge badge-success">● Online</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "68%", padding: "11px 15px",
                    borderRadius: m.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.mine ? "var(--blue-700)" : "var(--gray-50)",
                    border: m.mine ? "none" : "1px solid var(--gray-200)",
                    color: m.mine ? "white" : "var(--gray-900)",
                    fontSize: 13,
                  }}>
                    <div style={{ lineHeight: 1.5 }}>{m.text}</div>
                    <div style={{ fontSize: 10, opacity: .55, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--gray-100)", display: "flex", gap: 10 }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message... (Andika ujumbe...)"
                style={{ flex: 1, border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, outline: "none" }} />
              <button onClick={send} className="btn btn-primary">
                <Send size={15} /> Send
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--gray-400)" }}>
            <MessageSquare size={48} style={{ opacity: .2 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Select a conversation</p>
            <p style={{ fontSize: 13 }}>Chagua mazungumzo</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
