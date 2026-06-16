// ============================================================
// TPDOP Audit Logging
// logAction() records who/what/where/when/device for every
// significant action. Captures GPS + device automatically.
// Fire-and-forget: never blocks or throws into the caller.
// ============================================================
import { supabase } from "./supabase";

// Stable per-device id (persisted in localStorage)
function getDeviceId() {
  try {
    let id = localStorage.getItem("tpdop-device-id");
    if (!id) {
      id = "DEV-" + Math.random().toString(36).slice(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
      localStorage.setItem("tpdop-device-id", id);
    }
    return id;
  } catch { return "DEV-UNKNOWN"; }
}

// Best-effort GPS (resolves null quickly if denied/unavailable)
function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    const timer = setTimeout(() => resolve({ lat: null, lng: null }), 1500);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve({ lat: null, lng: null }); },
      { timeout: 1500, maximumAge: 60000 }
    );
  });
}

/**
 * Log an action to audit_logs.
 * @param {object} opts
 * @param {object} opts.profile  - the current user's profile (from useCurrentUser)
 * @param {string} opts.action   - e.g. "create_arrest", "issue_citation", "search_person"
 * @param {string} [opts.entityType]
 * @param {string} [opts.entityId]
 * @param {string} [opts.entityRef]
 * @param {string} [opts.description]
 * @param {object} [opts.metadata]
 */
export async function logAction({ profile, action, entityType, entityId, entityRef, description, metadata }) {
  try {
    const gps = await getGPS();
    await supabase.from("audit_logs").insert({
      officer_id:   profile?.id || null,
      officer_name: profile?.full_name || null,
      officer_rank: profile?.rank || null,
      officer_role: profile?.role || null,
      badge:        profile?.badge || null,
      station_id:   profile?.station_id || null,
      station_name: profile?.stations?.name || null,
      action,
      entity_type:  entityType || null,
      entity_id:    entityId || null,
      entity_ref:   entityRef || null,
      description:  description || null,
      metadata:     metadata || {},
      gps_lat:      gps.lat,
      gps_lng:      gps.lng,
      device_id:    getDeviceId(),
      user_agent:   navigator.userAgent,
    });
  } catch (e) {
    // Never let logging break the actual operation
    console.warn("audit log failed:", e?.message);
  }
}
