import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Send, Search, MessageSquare } from "lucide-react";

const threads = [
  { id: 1, from: "OCS Makambako",    role: "Station Commander", badge: "TZP-2020-00012", time: "09:45", unread: 2, lastMsg: "Please submit your patrol report by 17:00 today.", avatar: "OCS" },
  { id: 2, from: "Sgt. Mwenda",      role: "Sergeant",          badge: "TZP-2019-00087", time: "08:30", unread: 0, lastMsg: "On my way to Sector B checkpoint. ETA 15 mins.", avatar: "SGT" },
  { id: 3, from: "Control Room",     role: "Dispatch",          badge: "TZP-CTRL-0001",  time: "07:55", unread: 1, lastMsg: "Alert: Wanted person Juma Abdallah spotted near bus terminal.", avatar: "CTRL" },
  { id: 4, from: "Cpl. Kilosa",      role: "Corporal",          badge: "TZP-2021-00134", time: "Yesterday", unread: 0, lastMsg: "Evidence EVD-2026-003 delivered to custody officer.", avatar: "CPL" },
  { id: 5, from: "CID Unit",         role: "CID Department",    badge: "TZP-CID-0056",   time: "Yesterday", unread: 0, lastMsg: "Case INC-2026-002 upgraded to CID investigation.", avatar: "CID" },
];

const conversations = {
  1: [
    { from: "OCS Makambako", text: "Good morning Inspector Mbaza. Please confirm patrol Sector A started.", time: "07:00", mine: false },
    { from: "Me", text: "Good morning sir. Patrol started at 07:05. All clear.", time: "07:06", mine: true },
    { from: "OCS Makambako", text: "Please submit your patrol report by 17:00 today.", time: "09:45", mine: false },
  ],
  2: [
    { from: "Sgt. Mwenda", text: "INC-2026-003 suspect may have fled towards Mafinga. Need backup?", time: "08:00", mine: false },
    { from: "Me", text: "Received. Will coordinate with District. Stand by.", time: "08:15", mine: true },
    { from: "Sgt. Mwenda", text: "On my way to Sector B checkpoint. ETA 15 mins.", time: "08:30", mine: false },
  ],
};

export default function MessagesPage() {
  const [selected, setSelected] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [msgs, setMsgs] = useState(conversations);

  function sendMessage() {
    if (!newMsg.trim()) return;
    const id = selected;
    const updated = [...(msgs[id] || []), { from: "Me", text: newMsg, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), mine: true }];
    setMsgs({ ...msgs, [id]: updated });
    setNewMsg("");
  }

  const activeThread = threads.find(t => t.id === selected);
  const activeMessages = msgs[selected] || [{ from: activeThread?.from || "", text: activeThread?.lastMsg || "", time: activeThread?.time || "", mine: false }];

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: "0 0 20px" }}>Messages · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Ujumbe</span></h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: 600 }}>
        {/* THREAD LIST */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 12, padding: "10px 14px" }}>
              <Search size={16} color="#94a3b8" />
              <input placeholder="Search messages..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: "100%" }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {threads.map(t => (
              <div key={t.id} onClick={() => setSelected(t.id)}
                style={{
                  padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                  background: selected === t.id ? "#eff6ff" : "white",
                  borderLeft: selected === t.id ? "3px solid #0D3477" : "3px solid transparent"
                }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg, #082A63, #0D3477)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 11, fontWeight: 800, flexShrink: 0
                  }}>{t.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0D3477" }}>{t.from}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.time}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.lastMsg}</div>
                  </div>
                  {t.unread > 0 && (
                    <span style={{ background: "#dc2626", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.unread}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT WINDOW */}
        {selected ? (
          <div style={{ background: "white", borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #082A63, #0D3477)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800 }}>
                {activeThread?.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0D3477" }}>{activeThread?.from}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{activeThread?.role} · {activeThread?.badge}</div>
              </div>
              <div style={{ marginLeft: "auto", background: "#f0fdf4", color: "#16a34a", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● Online</div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {activeMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "70%", padding: "12px 16px", borderRadius: m.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.mine ? "#0D3477" : "#f8fafc",
                    color: m.mine ? "white" : "#1e293b",
                    fontSize: 14
                  }}>
                    <div>{m.text}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type message... (Andika ujumbe...)"
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 16px", fontSize: 14, outline: "none" }} />
              <button onClick={sendMessage}
                style={{ background: "#0D3477", color: "white", border: "none", borderRadius: 14, padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <Send size={16} /> Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#94a3b8", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <MessageSquare size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 16 }}>Select a conversation · Chagua mazungumzo</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
