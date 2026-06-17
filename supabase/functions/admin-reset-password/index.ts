// Supabase Edge Function: admin-reset-password
// ============================================
// Lets an admin officer force-reset another officer's password.
//
// SECURITY MODEL
// --------------
// 1. The caller must include their own Supabase JWT in Authorization.
// 2. We verify the JWT and look up the caller's profile.
// 3. We refuse unless the caller's role is admin_officer / igp / digp.
// 4. Only then do we use the SERVICE_ROLE_KEY to set the target user's
//    password via auth.admin.updateUserById.
// 5. We also write an audit_logs row so the action is traceable.
//
// The service_role key NEVER leaves this function. The browser only
// ever holds the anon key.
//
// ENVIRONMENT VARIABLES (set in Supabase dashboard -> Edge Functions):
//   SUPABASE_URL              - automatic
//   SUPABASE_ANON_KEY         - automatic
//   SUPABASE_SERVICE_ROLE_KEY - must be added manually for this function
//
// DEPLOY:
//   supabase functions deploy admin-reset-password --no-verify-jwt
//
//   (--no-verify-jwt is needed because we do our own JWT check inside;
//    the built-in check would block the call before our role logic.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_ROLES = new Set(["admin_officer", "igp", "digp"]);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // 1. Parse the body
    const { target_user_id, new_password } = await req.json();
    if (!target_user_id || !new_password) {
      return json({ error: "target_user_id and new_password are required" }, 400);
    }
    if (typeof new_password !== "string" || new_password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    // 2. Verify the caller's identity using the JWT they sent
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const anonKey      = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client authenticated as the caller - used only to verify their identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user: caller }, error: whoErr } = await callerClient.auth.getUser();
    if (whoErr || !caller) return json({ error: "Invalid or expired session" }, 401);

    // 3. Check the caller's role from the profiles table
    const { data: callerProfile, error: profErr } = await callerClient
      .from("profiles")
      .select("role, full_name, badge")
      .eq("id", caller.id)
      .single();
    if (profErr || !callerProfile) {
      return json({ error: "Caller profile not found" }, 403);
    }
    if (!ADMIN_ROLES.has(callerProfile.role)) {
      return json({ error: "Permission denied - admin role required" }, 403);
    }

    // 4. Defensive: don't allow an admin to reset their own password here.
    //    Use the regular forgot-password flow for self-reset.
    if (target_user_id === caller.id) {
      return json({ error: "Use the forgot-password flow to reset your own password" }, 400);
    }

    // 5. Service-role client used ONLY for the privileged action
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 6. Set the new password
    const { data: updated, error: updateErr } = await adminClient.auth.admin.updateUserById(
      target_user_id,
      { password: new_password }
    );
    if (updateErr) return json({ error: updateErr.message }, 500);

    // 7. Audit log (best-effort - don't fail the request if audit insert fails)
    try {
      await adminClient.from("audit_logs").insert({
        officer_id:  caller.id,
        action:      "admin_password_reset",
        entity_type: "profile",
        entity_id:   target_user_id,
        description: `${callerProfile.full_name} (${callerProfile.badge}) reset password for user ${target_user_id}`,
      });
    } catch (_) { /* swallow */ }

    return json({
      ok: true,
      target_email: updated?.user?.email || null,
      message: "Password reset successful",
    });
  } catch (e) {
    return json({ error: e?.message || "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
