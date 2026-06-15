import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useCurrentUser() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("*, stations(name,type), regions(name), districts(name)")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session) { setUser(null); setProfile(null); return; }
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("*, stations!profiles_station_id_fkey(name,type), regions(name), districts(name)")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading,
    role:       profile?.role || user?.user_metadata?.role || "",
    fullName:   profile?.full_name || "Officer",
    badge:      profile?.badge || "",
    stationId:  profile?.station_id,
    stationName:profile?.stations?.name || "",
    regionId:   profile?.region_id,
    regionName: profile?.regions?.name || "",
    districtId: profile?.district_id,
    districtName: profile?.districts?.name || "",
  };
}
