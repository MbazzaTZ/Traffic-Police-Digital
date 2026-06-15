import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ── Tanzania: 31 regions + districts (local reference) ──
export const TZ_REGIONS = {
  "Arusha":         ["Arusha Urban","Meru","Ngorongoro","Monduli","Karatu","Longido","Arusha Rural"],
  "Dar es Salaam":  ["Ilala","Kinondoni","Temeke","Ubungo","Kigamboni"],
  "Dodoma":         ["Dodoma Urban","Bahi","Chamwino","Kondoa","Mpwapwa","Chemba"],
  "Geita":          ["Geita Urban","Bukombe","Chato","Mbogwe","Nyang'hwale"],
  "Iringa":         ["Iringa Urban","Kilolo","Mufindi","Iringa Rural"],
  "Kagera":         ["Bukoba Urban","Bukoba Rural","Biharamulo","Karagwe","Kyerwa","Muleba","Ngara","Misenyi"],
  "Katavi":         ["Mpanda Urban","Mpanda Rural","Mlele","Nsimbo"],
  "Kigoma":         ["Kigoma Urban","Kigoma Rural","Kibondo","Kasulu","Buhigwe","Kakonko","Uvinza"],
  "Kilimanjaro":    ["Moshi Urban","Moshi Rural","Hai","Rombo","Same","Siha","Mwanga"],
  "Lindi":          ["Lindi Urban","Lindi Rural","Kilwa","Liwale","Nachingwea","Ruangwa"],
  "Mara":           ["Musoma Urban","Musoma Rural","Bunda","Butiama","Rorya","Serengeti","Tarime"],
  "Mbeya":          ["Mbeya Urban","Mbeya Rural","Busokelo","Chunya","Kyela","Mbarali","Momba","Rungwe"],
  "Morogoro":       ["Morogoro Urban","Morogoro Rural","Gairo","Ifakara","Kilombero","Kilosa","Mvomero","Ulanga"],
  "Mtwara":         ["Mtwara Urban","Mtwara Rural","Masasi","Nanyumbu","Newala","Tandahimba"],
  "Mwanza":         ["Ilemela","Nyamagana","Buchosa","Kwimba","Magu","Misungwi","Sengerema","Ukerewe"],
  "Njombe":         ["Njombe Urban","Makete","Wanging'ombe","Ludewa","Njombe Rural"],
  "Pemba North":    ["Micheweni","Wete"],
  "Pemba South":    ["Chake Chake","Mkoani"],
  "Pwani":          ["Bagamoyo","Kibaha Urban","Kibaha Rural","Kisarawe","Mafia","Mkuranga","Rufiji"],
  "Rukwa":          ["Sumbawanga Urban","Sumbawanga Rural","Kalambo","Nkasi"],
  "Ruvuma":         ["Songea Urban","Songea Rural","Mbinga","Namtumbo","Nyasa","Tunduru"],
  "Shinyanga":      ["Shinyanga Urban","Shinyanga Rural","Kahama Urban","Kahama Rural","Kishapu","Ushetu"],
  "Simiyu":         ["Bariadi","Busega","Itilima","Maswa","Meatu"],
  "Singida":        ["Singida Urban","Singida Rural","Ikungi","Iramba","Manyoni","Mkalama"],
  "Songwe":         ["Mbozi","Momba","Songwe","Ileje","Vwawa"],
  "Tabora":         ["Tabora Urban","Igunga","Kaliua","Nzega","Sikonge","Urambo","Uyui"],
  "Tanga":          ["Tanga Urban","Handeni","Kilindi","Korogwe Urban","Korogwe Rural","Lushoto","Mkinga","Muheza","Pangani"],
  "Zanzibar North": ["Kaskazini A","Kaskazini B"],
  "Zanzibar South": ["Kati","Kusini"],
  "Zanzibar West":  ["Magharibi A","Magharibi B","Mjini"],
};

export const TZ_ZONES = {
  "Northern":  ["Arusha","Kilimanjaro","Tanga"],
  "Eastern":   ["Dar es Salaam","Pwani","Morogoro"],
  "Southern":  ["Iringa","Njombe","Mbeya","Ruvuma","Lindi","Mtwara","Songwe","Rukwa","Katavi"],
  "Central":   ["Dodoma","Singida","Tabora"],
  "Lake":      ["Mwanza","Mara","Kagera","Simiyu","Shinyanga","Geita","Kigoma"],
  "Zanzibar":  ["Zanzibar North","Zanzibar South","Zanzibar West","Pemba North","Pemba South"],
};

export const RANKS = ["Constable","Corporal","Sergeant","Staff Sergeant","Inspector","ASP","SP","SSP","ACP","DCP","SCP","Commissioner of Police","RPC","DIGP","IGP"];
export const ROLES = [
  { v:"regular_officer",  l:"Regular Officer" },
  { v:"traffic_officer",  l:"Traffic Officer" },
  { v:"cid_officer",      l:"CID Officer" },
  { v:"forensic_officer", l:"Forensic Officer" },
  { v:"ocs",              l:"OCS – Station Commander" },
  { v:"ocd",              l:"OCD – District Commander" },
  { v:"rpc",              l:"RPC – Regional Commander" },
  { v:"igp",              l:"IGP – Inspector General" },
  { v:"admin_officer",    l:"Admin Officer" },
];
export const ROLE_PERMS = {
  regular_officer:  ["Person Search","Incident Reports","Arrests","Detentions","Patrol","Evidence Upload","Communications"],
  traffic_officer:  ["Vehicle Search","Driver Licenses","Traffic Citations","Accident Reports","Insurance Verification"],
  cid_officer:      ["Criminal Cases","Warrants","Investigations","Suspects","Witnesses","Evidence","Forensics","Wanted Persons"],
  forensic_officer: ["Fingerprints","DNA Records","Ballistics","Document Analysis","Digital Forensics"],
  ocs:              ["All Station Officers","Station Reports","Station Cases","Station Statistics","Detentions","Cells"],
  ocd:              ["All District Stations","District Statistics","District Crime Reports","District Performance"],
  rpc:              ["Entire Region","All Districts","Regional Intelligence","Regional Dashboards","Crime Heatmaps"],
  igp:              ["Full System Access — All Modules"],
  admin_officer:    ["Manage Users","Create Accounts","All Admin Activities","System Settings","Roles Management"],
};
export const DEPARTMENTS = ["Operations","CID","Traffic","Intelligence","Forensics","Community Policing","Anti-Narcotics","Cyber Crime","Human Resources","Administration","ICT","Internal Affairs","Training","Procurement","Legal Services"];
export const STATION_TYPES = ["Police Station","Police Post","Police HQ","Division HQ","Outpost","Marine Post","Railway Post","Airport Post"];

const Ctx = createContext(null);

export function AppDataProvider({ children }) {
  const [regions,   setRegions]   = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards,     setWards]     = useState([]);
  const [stations,  setStations]  = useState([]);
  const [officers,  setOfficers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rR, dR, wR, sR, oR] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("districts").select("*").order("name"),
        supabase.from("wards").select("*").order("name"),
        supabase.from("stations").select("*").order("name"),
        supabase.from("profiles").select("*, stations!profiles_station_id_fkey(name,type)").order("created_at", { ascending:false }),
      ]);
      if (rR.error) console.error("regions:", rR.error.code, rR.error.message);
      if (dR.error) console.error("districts:", dR.error.code, dR.error.message);
      if (wR.error) console.error("wards:", wR.error.code, wR.error.message);
      if (sR.error) console.error("stations:", sR.error.code, sR.error.message);
      if (oR.error) console.error("profiles:", oR.error.code, oR.error.message);
      if (rR.error && dR.error && sR.error) setError(rR.error.message);
      setRegions(rR.data   || []);
      setDistricts(dR.data || []);
      setWards(wR.data     || []);
      setStations(sR.data  || []);
      setOfficers(oR.data  || []);
    } catch(e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Helpers ──
  const byRegion    = id  => districts.filter(d => d.region_id   === id);
  const byDistrict  = id  => wards.filter(w    => w.district_id  === id);
  const stByRegion  = id  => stations.filter(s  => s.region_id   === id);
  const stByDistr   = id  => stations.filter(s  => s.district_id === id);
  const stByWard    = id  => stations.filter(s  => s.ward_id     === id);

  function regionName(id)   { return regions.find(r=>r.id===id)?.name   || ""; }
  function districtName(id) { return districts.find(d=>d.id===id)?.name || ""; }
  function wardName(id)     { return wards.find(w=>w.id===id)?.name     || ""; }

  function districtsForRegion(regionName) {
    const r = regions.find(x=>x.name===regionName);
    return r ? districts.filter(d=>d.region_id===r.id) : [];
  }
  function wardsForDistrict(districtName, regionName) {
    const r = regions.find(x=>x.name===regionName);
    const d = districts.find(x=>x.name===districtName && x.region_id===r?.id);
    return d ? wards.filter(w=>w.district_id===d.id) : [];
  }
  function stationsForLocation(regionName, districtName, wardName) {
    let list = stations;
    if (regionName) {
      const r = regions.find(x=>x.name===regionName);
      if (r) list = list.filter(s=>s.region_id===r.id);
    }
    if (districtName) {
      const d = districts.find(x=>x.name===districtName);
      if (d) list = list.filter(s=>s.district_id===d.id);
    }
    if (wardName) {
      const w = wards.find(x=>x.name===wardName);
      if (w) list = list.filter(s=>s.ward_id===w.id);
    }
    return list;
  }

  // ── Mutations ──
  async function addRegion({ name, code, zone }) {
    let zone_id = null;
    if (zone) {
      const { data:z } = await supabase.from("zones").upsert({ name:zone },{ onConflict:"name" }).select("id").single();
      zone_id = z?.id;
      if (!zone_id) {
        const { data:z2 } = await supabase.from("zones").select("id").eq("name",zone).single();
        zone_id = z2?.id;
      }
    }
    const { data:region, error } = await supabase.from("regions").insert({ name, code:code||null, zone_id }).select().single();
    if (error) throw error;
    const districtNames = TZ_REGIONS[name] || [];
    if (districtNames.length) {
      await supabase.from("districts").insert(districtNames.map(d=>({ name:d, region_id:region.id })));
    }
    await loadAll(); return region;
  }

  async function addDistrict({ name, code, region_id }) {
    const { data, error } = await supabase.from("districts").insert({ name, code:code||null, region_id }).select().single();
    if (error) throw error;
    await loadAll(); return data;
  }

  async function addWard({ name, code, district_id, region_id }) {
    const { data, error } = await supabase.from("wards").insert({ name, code:code||null, district_id, region_id:region_id||null }).select().single();
    if (error) throw error;
    await loadAll(); return data;
  }

  async function addStation({ name, code, type, region, district, ward, phone, address, ocs_name }) {
    const r  = regions.find(x=>x.name===region);
    const d  = districts.find(x=>x.name===district && x.region_id===r?.id);
    const w  = wards.find(x=>x.name===ward && x.district_id===d?.id);
    const { data, error } = await supabase.from("stations").insert({
      name, code:code||null, type:type||"police_station",
      region_id:r?.id||null, district_id:d?.id||null, ward_id:w?.id||null,
      phone:phone||null, address:address||null, status:"active",
    }).select().single();
    if (error) throw error;
    await loadAll(); return data;
  }

  async function addOfficer({ full_name, badge, nida, phone, email, rank, role, department, region, district, station_id, password }) {
    // Save current admin session before signUp (which would replace it)
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    const { data:authData, error:authErr } = await supabase.auth.signUp({ email, password, options:{ data:{ role, badge, full_name } } });
    if (authErr) throw authErr;
    const uid = authData?.user?.id;
    if (!uid) throw new Error("Failed to create auth user");

    // Restore the admin session — signUp replaced it with the new user
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }

    const r = regions.find(x=>x.name===region);
    const d = districts.find(x=>x.name===district && x.region_id===r?.id);
    const { data:profile, error:pErr } = await supabase.from("profiles").insert({
      id:uid, badge, full_name, rank, role,
      department:department||null, region_id:r?.id||null,
      district_id:d?.id||null, station_id:station_id||null,
      phone:phone||null, email:email||null, nida:nida||null, status:"active",
    }).select().single();
    if (pErr) throw pErr;
    await loadAll(); return profile;
  }

  async function deleteStation(id) { await supabase.from("stations").delete().eq("id",id); await loadAll(); }
  async function deleteOfficer(id) { await supabase.from("profiles").delete().eq("id",id); await loadAll(); }

  return (
    <Ctx.Provider value={{
      regions, districts, wards, stations, officers,
      loading, error, refresh:loadAll,
      byRegion, byDistrict, stByRegion, stByDistr, stByWard,
      regionName, districtName, wardName,
      districtsForRegion, wardsForDistrict, stationsForLocation,
      addRegion, addDistrict, addWard, addStation, addOfficer,
      deleteStation, deleteOfficer,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be within AppDataProvider");
  return ctx;
}
