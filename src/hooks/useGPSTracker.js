// ============================================================
// useGPSTracker — automatic GPS position broadcasting
// Pings officer_locations every TRACK_INTERVAL while active.
// Best-effort; degrades gracefully if location is denied.
// ============================================================
import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const TRACK_INTERVAL_MS = 60_000; // 1 minute

function getDeviceId() {
  try {
    let id = localStorage.getItem("tpdop-device-id");
    if (!id) {
      id = "DEV-" + Math.random().toString(36).slice(2,10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
      localStorage.setItem("tpdop-device-id", id);
    }
    return id;
  } catch { return "DEV-UNKNOWN"; }
}

function getBattery() {
  return new Promise(res => {
    if (!navigator.getBattery) return res(null);
    navigator.getBattery().then(b => res(Math.round((b.level||0)*100))).catch(()=>res(null));
  });
}

/**
 * Tracks officer GPS while `enabled` is true.
 * @param {object} opts
 * @param {boolean} opts.enabled
 * @param {string} opts.officerId
 * @param {string|null} opts.patrolId  // optional, links pings to a patrol session
 */
export function useGPSTracker({ enabled, officerId, patrolId = null }) {
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !officerId || !navigator.geolocation) return;

    async function ping(pos) {
      try {
        const battery = await getBattery();
        await supabase.from("officer_locations").insert({
          officer_id: officerId,
          patrol_id:  patrolId,
          lat:        pos.coords.latitude,
          lng:        pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          speed_kmh:  pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
          heading:    pos.coords.heading,
          device_id:  getDeviceId(),
          battery_pct: battery,
          recorded_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("GPS ping failed:", e?.message);
      }
    }

    // Initial position + interval pings
    navigator.geolocation.getCurrentPosition(ping, ()=>{}, { enableHighAccuracy:true, timeout:8000 });
    timerRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(ping, ()=>{}, { enableHighAccuracy:true, timeout:8000, maximumAge:30000 });
    }, TRACK_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enabled, officerId, patrolId]);
}
