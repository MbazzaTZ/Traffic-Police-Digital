// ============================================================
// TPDOP Approval Flow — upward escalation chain
// regular_officer / inspector / traffic / cid → OCS → OCD → RPC → IGP
// ============================================================
import { supabase } from "./supabase";
import { logAction } from "./audit";

// The chain of approver levels in order
export const APPROVAL_CHAIN = ["ocs", "ocd", "rpc", "igp"];

// Roles that submit requests (start of chain)
export const SUBMITTER_ROLES = ["regular_officer","inspector","traffic_officer","cid_officer","forensic_officer"];

// Which level approves at each tier
export const LEVEL_LABEL = {
  ocs: "OCS – Station Commander",
  ocd: "OCD – District Commander",
  rpc: "RPC – Regional Commander",
  igp: "IGP – Inspector General",
};

// Request types and which final level they need
export const REQUEST_TYPES = [
  { v:"leave",            l:"Leave / Likizo",                  finalLevel:"ocs",  icon:"🏖️" },
  { v:"transfer",         l:"Transfer / Uhamisho",             finalLevel:"rpc",  icon:"🔄" },
  { v:"resource",         l:"Resource / Rasilimali",           finalLevel:"ocd",  icon:"📦" },
  { v:"case_escalation",  l:"Case Escalation / Kupandisha Kesi",finalLevel:"rpc", icon:"📁" },
  { v:"arrest_warrant",   l:"Arrest Warrant / Hati ya Kukamata",finalLevel:"ocd", icon:"⚖️" },
  { v:"operation",        l:"Operation / Operesheni",          finalLevel:"rpc",  icon:"🎯" },
  { v:"budget",           l:"Budget / Bajeti",                 finalLevel:"igp",  icon:"💰" },
  { v:"evidence_release", l:"Evidence Release / Kutoa Ushahidi",finalLevel:"ocd", icon:"🔒" },
  { v:"other",            l:"Other / Nyingine",                finalLevel:"ocs",  icon:"📋" },
];

// Get the next level up in the chain
export function nextLevel(currentLevel) {
  const idx = APPROVAL_CHAIN.indexOf(currentLevel);
  if (idx === -1 || idx === APPROVAL_CHAIN.length - 1) return null;
  return APPROVAL_CHAIN[idx + 1];
}

// Get the starting approval level for a request type (always begins at OCS)
export function startLevel() { return "ocs"; }

// Can this role approve at the request's current level?
export function canApprove(userRole, currentLevel) {
  // IGP and DIGP can approve anything; admin_officer can act as IGP
  if (["igp","digp","admin_officer"].includes(userRole)) return true;
  return userRole === currentLevel;
}

// Find the approver profile for a given level within the requester's chain (station/district/region)
export async function findApprover(level, { station_id, district_id, region_id }) {
  let q = supabase.from("profiles").select("id,full_name,role").eq("role", level).eq("status","active");
  if (level === "ocs" && station_id) q = q.eq("station_id", station_id);
  else if (level === "ocd" && district_id) q = q.eq("district_id", district_id);
  else if (level === "rpc" && region_id) q = q.eq("region_id", region_id);
  const { data } = await q.limit(1).maybeSingle();
  return data;
}

// Submit a new request — starts at OCS level
export async function submitRequest(form, profile) {
  const level = startLevel();
  const approver = await findApprover(level, profile);
  const { data, error } = await supabase.from("requests").insert({
    type: form.type, title: form.title, description: form.description,
    amount: form.amount ? parseInt(form.amount) : null,
    priority: form.priority || "normal",
    status: "pending",
    requested_by: profile.id, requester_role: profile.role,
    current_level: level, current_approver: approver?.id || null,
    station_id: profile.station_id || null,
    region_id: profile.region_id || null,
    district_id: profile.district_id || null,
  }).select().single();
  if (error) throw error;
  await supabase.from("request_approvals").insert({
    request_id: data.id, actor_id: profile.id, actor_role: profile.role,
    action: "submitted", to_level: level, note: "Request submitted",
  });
  return data;
}

// Approve at current level — either escalate up or finalize
export async function approveRequest(request, profile, note) {
  const type = REQUEST_TYPES.find(t => t.v === request.type);
  const finalLevel = type?.finalLevel || "ocs";

  // If current level IS the final level → approved & done
  if (request.current_level === finalLevel || ["igp","digp","admin_officer"].includes(profile.role)) {
    await supabase.from("requests").update({
      status: "approved", decided_by: profile.id,
      decision_note: note || "Approved", decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", request.id);
    await supabase.from("request_approvals").insert({
      request_id: request.id, actor_id: profile.id, actor_role: profile.role,
      action: "approved", from_level: request.current_level, note: note || "Final approval granted",
    });
    logAction({ profile, action:"approve_request", entityType:"request", entityId:request.id, entityRef:request.ref_number, description:`Approved (final): ${request.title}` });
    return "approved";
  }

  // Otherwise escalate to next level up
  const up = nextLevel(request.current_level);
  const approver = await findApprover(up, request);
  await supabase.from("requests").update({
    status: "escalated", current_level: up, current_approver: approver?.id || null,
    updated_at: new Date().toISOString(),
  }).eq("id", request.id);
  await supabase.from("request_approvals").insert({
    request_id: request.id, actor_id: profile.id, actor_role: profile.role,
    action: "escalated", from_level: request.current_level, to_level: up,
    note: note || `Approved at ${request.current_level.toUpperCase()}, escalated to ${up.toUpperCase()}`,
  });
  return "escalated";
}

// Reject a request
export async function rejectRequest(request, profile, note) {
  await supabase.from("requests").update({
    status: "rejected", decided_by: profile.id,
    decision_note: note || "Rejected", decided_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", request.id);
  await supabase.from("request_approvals").insert({
    request_id: request.id, actor_id: profile.id, actor_role: profile.role,
    action: "rejected", from_level: request.current_level, note: note || "Request rejected",
  });
  logAction({ profile, action:"reject_request", entityType:"request", entityId:request.id, entityRef:request.ref_number, description:`Rejected: ${request.title}` });
}
