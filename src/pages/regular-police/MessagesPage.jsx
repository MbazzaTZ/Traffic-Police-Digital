import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Send, Search, MessageSquare, Bell, X, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function MessagesPage() {
  const { profile, fullName } = useCurrentUser();
  const [threads,   setThreads]   = useState([]);
  const [officers,  setOfficers]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [newMsg,    setNewMsg]     = useState("");
  const [search,    setSearch]     = useState("");
  const [compose,   setCompose]    = useState(false);
  const [compTo,    setCompTo]     = useState("");
  const [compSubj,  setCompSubj]   = useState("");
  const [compBody,  setCompBody]   = useState("");
  const [sending,   setSending]    = useState(false);
  const [priority,  setPriority]   = useState("normal");
  const [loading,   setLoading]    = useState(true);
  const bottomRef = useRef(null);

  async function loadThreads() {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,badge,role), receiver:profiles!messages_receiver_id_fkey(id,full_name,badge)")
      .or(`receiver_id.eq.${profile.id},sender_id.eq.${profile.id},is_broadcast.eq.true`)
      .order("created_at", { ascending:false })
      .limit(100);
    setThreads(data||[]);
    setLoading(false);
  }

  async function loadOfficers() {
    const { data } = await supabase.from("profiles").select("id,full_name,badge,role,status").eq("status","active").neq("id", profile?.id||"").limit(100);
    setOfficers(data||[]);
  }

  useEffect(() => { if (profile?.id) { loadThreads(); loadOfficers(); } }, [profile?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return;
    const sub = supabase.channel("messages-realtime")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, () => {
        loadThreads();
        if (selected) loadConversation(selected);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [profile?.id, selected]);

  async function loadConversation(otherId) {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name,badge)")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending:true });
    setMessages(data||[]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    // Mark read
    await supabase.from("messages").update({ read_at:new Date().toISOString() })
      .eq("receiver_id", profile.id).eq("sender_id", otherId).is("read_at", null);
  }

  function selectThread(otherId) {
    setSelected(otherId);
    loadConversation(otherId);
  }

  async function sendMsg(e) {
    e.preventDefault();
    if (!newMsg.trim() || !selected || !profile?.id) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id:profile.id, receiver_id:selected, body:newMsg.trim(), priority:"normal" });
    setNewMsg("");
    setSending(false);
    await loadConversation(selected);
  }

  async function sendCompose(e) {
    e.preventDefault();
    if (!compBody.trim() || !profile?.id) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id:profile.id, receiver_id:compTo||null,
      is_broadcast:!compTo, subject:compSubj||null,
      body:compBody.trim(), priority,
    });
    setSending(false);
    setCompose(false); setCompTo(""); setCompSubj(""); setCompBody(""); setPriority("normal");
    await loadThreads();
  }

  // Build unique conversation partners
  const partners = [...new Map(threads.map(m => {
    const otherId = m.sender_id===profile?.id ? m.receiver_id : m.sender_id;
    const other   = m.sender_id===profile?.id ? m.receiver : m.sender;
    return [otherId, { id:otherId, name:other?.full_name||"Unknown", badge:other?.badge||"", last:m.body, time:m.created_at, unread:!m.read_at&&m.receiver_id===profile?.id, broadcast:m.is_broadcast, priority:m.priority }];
  }).filter(([id]) => id)).values()].sort((a,b) => new Date(b[1].time)-new Date(a[1].time)).map(([,v])=>v);

  const filteredPartners = partners.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const selectedOfficer = officers.find(o=>o.id===selected);
  const unreadCount = threads.filter(m=>!m.read_at && m.receiver_id===profile?.id).length;

  const PRIORITY_C = { normal:"#0D3477", urgent:"#D97706", emergency:"#DC2626" };

  return (
    <DashboardLayout pageTitle="Messages" pageTitle2="Ujumbe">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Messages <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Ujumbe</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Secure internal communications · Real-time · Supabase</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={loadThreads} style={{ width:38, height:38, borderRadius:9, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><RefreshCw size={16}/></button>
          <button onClick={()=>setCompose(true)}
            style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <MessageSquare size={15}/> Compose · Tunga Ujumbe
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:14, height:580 }}>
        {/* Sidebar */}
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#F8FAFC", borderRadius:8, padding:"7px 10px" }}>
              <Search size={13} color="#94A3B8"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations..."
                style={{ border:"none", outline:"none", fontSize:12, width:"100%", background:"transparent", color:"#1E293B" }}/>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {loading ? (
              <div style={{ padding:"30px", textAlign:"center", color:"#94A3B8", fontSize:13 }}>Loading...</div>
            ) : filteredPartners.length===0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8" }}>
                <MessageSquare size={32} style={{ opacity:.2, marginBottom:10 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:"#64748B" }}>No conversations yet</div>
                <div style={{ fontSize:12, marginTop:4 }}>Click Compose to start</div>
              </div>
            ) : filteredPartners.map(p => (
              <div key={p.id} onClick={()=>selectThread(p.id)}
                style={{ padding:"13px 16px", borderBottom:"1px solid #F8FAFC", cursor:"pointer", background:selected===p.id?"#EFF6FF":"white", borderLeft:selected===p.id?"3px solid #0D3477":"3px solid transparent", transition:".1s" }}
                onMouseEnter={e=>{if(selected!==p.id)e.currentTarget.style.background="#F8FAFC";}}
                onMouseLeave={e=>{if(selected!==p.id)e.currentTarget.style.background="white";}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"#0D3477", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:800, flexShrink:0 }}>
                      {p.name?.split(" ").map(n=>n[0]).slice(0,2).join("")||"?"}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:p.unread?800:600, color:"#1E293B" }}>{p.name}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>{p.badge||"—"}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                    <div style={{ fontSize:10, color:"#94A3B8" }}>{new Date(p.time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                    {p.unread && <div style={{ width:8, height:8, borderRadius:"50%", background:"#0D3477" }}/>}
                  </div>
                </div>
                <div style={{ fontSize:12, color:"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", paddingLeft:40 }}>
                  {p.broadcast?"📢 Broadcast: ":""}{p.last}
                </div>
                {p.priority!=="normal" && (
                  <div style={{ marginTop:4, paddingLeft:40 }}>
                    <span style={{ background:`${PRIORITY_C[p.priority]}18`, color:PRIORITY_C[p.priority], padding:"1px 7px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{p.priority}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {!selected ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"#94A3B8" }}>
              <MessageSquare size={48} style={{ opacity:.15 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Select a conversation</div>
              <div style={{ fontSize:13 }}>Chagua mazungumzo · Or compose a new message</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"#0D3477", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:800 }}>
                    {selectedOfficer?.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")||"?"}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{selectedOfficer?.full_name||"Officer"}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{selectedOfficer?.badge||""} · {selectedOfficer?.role?.replace(/_/g," ")||""}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#16A34A", fontWeight:600 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#16A34A", display:"inline-block" }}/>Online
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                {messages.length===0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8" }}>
                    <div style={{ fontSize:13 }}>No messages yet · Send the first one</div>
                  </div>
                ) : messages.map(m => {
                  const isMine = m.sender_id === profile?.id;
                  const pc = PRIORITY_C[m.priority]||"#0D3477";
                  return (
                    <div key={m.id} style={{ display:"flex", justifyContent:isMine?"flex-end":"flex-start" }}>
                      <div style={{ maxWidth:"70%" }}>
                        {m.priority!=="normal" && (
                          <div style={{ fontSize:10, fontWeight:700, color:pc, textAlign:isMine?"right":"left", marginBottom:2 }}>
                            {m.priority==="emergency"?"🚨":"⚠"} {m.priority.toUpperCase()}
                          </div>
                        )}
                        <div style={{ background:isMine?"#0D3477":"#F1F5F9", color:isMine?"white":"#1E293B", borderRadius:isMine?"14px 14px 4px 14px":"14px 14px 14px 4px", padding:"10px 14px", fontSize:13, lineHeight:1.5, border:m.priority!=="normal"?`2px solid ${pc}`:"none" }}>
                          {m.subject && <div style={{ fontWeight:700, marginBottom:4, fontSize:12 }}>{m.subject}</div>}
                          {m.body}
                        </div>
                        <div style={{ fontSize:10, color:"#94A3B8", marginTop:3, textAlign:isMine?"right":"left" }}>
                          {new Date(m.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
                          {isMine && m.read_at ? " · ✓✓" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <form onSubmit={sendMsg} style={{ padding:"12px 16px", borderTop:"1px solid #F1F5F9", display:"flex", gap:8 }}>
                <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Type a message · Andika ujumbe..."
                  style={{ flex:1, height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", fontSize:13, outline:"none" }}
                  onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                <button type="submit" disabled={sending||!newMsg.trim()}
                  style={{ width:42, height:42, borderRadius:10, border:"none", background:"#0D3477", color:"white", cursor:sending||!newMsg.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:sending||!newMsg.trim()?.5:1 }}>
                  <Send size={16}/>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {compose && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setCompose(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>New Message · Ujumbe Mpya</div>
              <button onClick={()=>setCompose(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            <form onSubmit={sendCompose}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>To · Kwa (leave empty for broadcast)</label>
                <select value={compTo} onChange={e=>setCompTo(e.target.value)}
                  style={{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white" }}>
                  <option value="">📢 All Officers (Broadcast)</option>
                  {officers.map(o=><option key={o.id} value={o.id}>{o.full_name} — {o.badge}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Priority · Kipaumbele</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["normal","urgent","emergency"].map(p=>(
                    <button key={p} type="button" onClick={()=>setPriority(p)}
                      style={{ flex:1, padding:"8px", borderRadius:8, border:`2px solid ${priority===p?PRIORITY_C[p]:"#E2E8F0"}`, background:priority===p?`${PRIORITY_C[p]}18`:"white", color:priority===p?PRIORITY_C[p]:"#475569", cursor:"pointer", fontWeight:700, fontSize:12, textTransform:"capitalize" }}>
                      {p==="emergency"?"🚨":p==="urgent"?"⚠":""} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Subject · Mada</label>
                <input value={compSubj} onChange={e=>setCompSubj(e.target.value)} placeholder="Optional subject..."
                  style={{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Message · Ujumbe *</label>
                <textarea value={compBody} onChange={e=>setCompBody(e.target.value)} rows={5} required placeholder="Type your message..."
                  style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box", resize:"vertical" }}
                  onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
              </div>
              <button type="submit" disabled={sending}
                style={{ width:"100%", height:46, background:sending?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:sending?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Send size={16}/> {sending?"Sending...":"Send Message · Tuma"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
