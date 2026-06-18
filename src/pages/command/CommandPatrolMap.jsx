import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { MapPin, RefreshCw, Activity, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default-icon resolution under Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tanzania centroid
const TZ_CENTER = [-6.369, 34.889];
const TZ_ZOOM = 6;

const card = { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" };

// Color by role
const ROLE_C = { traffic_officer:"#D97706", cid_officer:"#7C3AED", regular_officer:"#0D3477", ocs:"#059669", ocd:"#059669", rpc:"#0891B2", igp:"#DC2626" };

// Build a colored circle DivIcon for each officer
function officerIcon(role, isLive) {
  const c = ROLE_C[role] || "#0D3477";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${c};border:3px solid white;
      box-shadow:0 0 0 2px ${c}66, 0 2px 4px rgba(0,0,0,.4);
      ${isLive ? `animation:pulse 1.5s infinite;` : ""}
    "></div>
    <style>@keyframes pulse{0%,100%{box-shadow:0 0 0 2px ${c}66, 0 2px 4px rgba(0,0,0,.4)}50%{box-shadow:0 0 0 8px ${c}22, 0 2px 4px rgba(0,0,0,.4)}}</style>`,
    iconSize: [18,18], iconAnchor:[9,9], popupAnchor:[0,-9],
  });
}

export default function CommandPatrolMap() {
  const [officers, setOfficers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [auto,     setAuto]     = useState(true);

  async function load() {
    const { data } = await supabase.from("officer_latest_locations").select("*").limit(500);
    setOfficers(data||[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
    if (!auto) return;
    const t = setInterval(load, 30_000); // refresh every 30s
    return () => clearInterval(t);
  }, [auto]);

  const filtered = officers.filter(o => filter==="all" || o.role===filter);
  const roles = [...new Set(officers.map(o=>o.role).filter(Boolean))];

  // Live = pinged within last 5 minutes
  const isLive = (o) => (Date.now() - new Date(o.recorded_at).getTime()) < 5*60_000;
  const liveCount = officers.filter(isLive).length;

  return (
    <CommandLayout pageTitle="Patrol Map" pageTitle2="Ramani ya Doria">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <h1 style={{ fontSize:23, fontWeight:900, color:"white", margin:0 }}>Live Patrol Map</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>{officers.length} officers tracked · {liveCount} live (last 5 min)</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:600 }}>
            <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} style={{ accentColor:"#16A34A" }}/>
            Auto-refresh
          </label>
          <button onClick={load} style={{ width:38, height:38, borderRadius:9, ...card, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.7)" }}>
            <RefreshCw size={15}/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
        {[
          { label:"Total Tracked", v:officers.length, c:"#0D3477", icon:Users },
          { label:"Live Now",      v:liveCount,        c:"#16A34A", icon:Activity },
          { label:"Traffic",       v:officers.filter(o=>o.role==="traffic_officer").length, c:"#D97706", icon:MapPin },
          { label:"Stations",      v:[...new Set(officers.map(o=>o.station_id).filter(Boolean))].length, c:"#7C3AED", icon:MapPin },
        ].map(k=>{
          const Icon=k.icon;
          return (
            <div key={k.label} style={{ ...card, borderRadius:14, padding:"14px", textAlign:"center", borderTop:`3px solid ${k.c}` }}>
              <Icon size={18} color={k.c} style={{ marginBottom:6 }}/>
              <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Role filter chips */}
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        <button onClick={()=>setFilter("all")} style={{ padding:"6px 14px", borderRadius:999, border:`1px solid ${filter==="all"?"#fff":"rgba(255,255,255,.15)"}`, background:filter==="all"?"rgba(255,255,255,.1)":"transparent", color:"white", cursor:"pointer", fontSize:12, fontWeight:600 }}>All ({officers.length})</button>
        {roles.map(r=>(
          <button key={r} onClick={()=>setFilter(r)} style={{ padding:"6px 14px", borderRadius:999, border:`1px solid ${filter===r?ROLE_C[r]:"rgba(255,255,255,.15)"}`, background:filter===r?`${ROLE_C[r]}22`:"transparent", color:filter===r?ROLE_C[r]||"white":"rgba(255,255,255,.6)", cursor:"pointer", fontSize:12, fontWeight:600 }}>
            <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:ROLE_C[r], marginRight:6 }}/>
            {r.replace(/_/g," ")} ({officers.filter(o=>o.role===r).length})
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ ...card, borderRadius:14, overflow:"hidden", height:520 }}>
        {loading ? (
          <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.3)" }}>Loading map...</div>
        ) : (
          <MapContainer center={TZ_CENTER} zoom={TZ_ZOOM} style={{ height:"100%", width:"100%", background:"#0a1428" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(o => (
              <Marker key={o.officer_id} position={[o.lat, o.lng]} icon={officerIcon(o.role, isLive(o))}>
                <Popup>
                  <div style={{ fontFamily:"system-ui", fontSize:13, minWidth:200 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:ROLE_C[o.role]||"#0D3477" }}>{o.full_name}</div>
                    <div style={{ fontSize:11, color:"#64748B", fontFamily:"monospace" }}>{o.badge} · {o.rank}</div>
                    <div style={{ borderTop:"1px solid #E2E8F0", margin:"6px 0", paddingTop:6 }}>
                      <div style={{ fontSize:11, color:"#64748B" }}>{o.role?.replace(/_/g," ").toUpperCase()}</div>
                      <div style={{ fontSize:12 }}>{o.station_name||"—"} · {o.region_name||"—"}</div>
                      <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>
                        Last seen: {new Date(o.recorded_at).toLocaleString("en-GB")}
                      </div>
                      {o.battery_pct != null && <div style={{ fontSize:11 }}>🔋 {o.battery_pct}%</div>}
                      {o.speed_kmh != null && o.speed_kmh > 0 && <div style={{ fontSize:11 }}>🚗 {Math.round(o.speed_kmh)} km/h</div>}
                    </div>
                    <div style={{ fontSize:10, color:"#94A3B8" }}>{o.lat.toFixed(5)}, {o.lng.toFixed(5)} ±{Math.round(o.accuracy_m||0)}m</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,.4)", textAlign:"center" }}>
        Officers ping their position every minute while on patrol. View shows last 24 hours; live dots pulse.
      </div>
    </CommandLayout>
  );
}
