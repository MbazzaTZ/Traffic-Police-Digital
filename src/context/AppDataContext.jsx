import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ── Tanzania: 31 regions + districts (local reference only) ──
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

const Ctx = createContext(null);

export function AppDataProvider({ children }) {
  const [regions,   setRegions]   = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stations,  setStations]  = useState([]);
  const [officers,  setOfficers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // ── Load all data on mount ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, dRes, sRes, oRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("districts").select("*, regions(name)").order("name"),
        supabase.from("stations").select("*, regions(name), districts(name)").order("name"),
        supabase.from("profiles").select("*, regions(name), districts(name), stations(name)").order("created_at", { ascending: false }),
      ]);
      if (rRes.error) throw rRes.error;
      if (dRes.error) throw dRes.error;
      if (sRes.error) throw sRes.error;
      if (oRes.error) throw oRes.error;
      setRegions(rRes.data || []);
      setDistricts(dRes.data || []);
      setStations(sRes.data || []);
      setOfficers(oRes.data || []);
    } catch (e) {
      setError(e.message);
      console.error("TPDOP load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Regions ──
  async function addRegion({ name, code, zone }) {
    // 1. Insert or get zone
    let zone_id = null;
    if (zone) {
      const { data: zd } = await supabase.from("zones").upsert({ name: zone }, { onConflict: "name" }).select("id").single();
      zone_id = zd?.id;
      if (!zone_id) {
        const { data: ze } = await supabase.from("zones").select("id").eq("name", zone).single();
        zone_id = ze?.id;
      }
    }

    // 2. Insert region
    const { data: region, error: rErr } = await supabase
      .from("regions")
      .insert({ name, code: code || null, zone_id })
      .select()
      .single();
    if (rErr) throw rErr;

    // 3. Auto-insert all districts for this region
    const districtNames = TZ_REGIONS[name] || [];
    if (districtNames.length > 0) {
      const rows = districtNames.map(d => ({ name: d, region_id: region.id }));
      await supabase.from("districts").insert(rows);
    }

    await loadAll();
    return region;
  }

  // ── Stations ──
  async function addStation({ name, code, type, region, district, phone, address, ocs_name }) {
    // Resolve region_id
    const rRow = regions.find(r => r.name === region);
    const region_id = rRow?.id || null;

    // Resolve district_id
    const dRow = districts.find(d => d.name === district && d.region_id === region_id);
    const district_id = dRow?.id || null;

    const { data, error: sErr } = await supabase
      .from("stations")
      .insert({
        name,
        code: code || null,
        type: type || "police_station",
        region_id,
        district_id,
        phone: phone || null,
        address: address || null,
        status: "active",
      })
      .select()
      .single();
    if (sErr) throw sErr;
    await loadAll();
    return data;
  }

  // ── Officers (profiles) ──
  async function addOfficer({ full_name, badge, nida, phone, email, rank, role, department, region, district, station_id, password, notes }) {
    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin
      ? await supabase.auth.signUp({ email, password, options: { data: { role, badge, full_name } } })
      : await supabase.auth.signUp({ email, password, options: { data: { role, badge, full_name } } });

    if (authErr) throw authErr;
    const user_id = authData?.user?.id;
    if (!user_id) throw new Error("Failed to create auth user");

    // 2. Resolve IDs
    const rRow = regions.find(r => r.name === region);
    const region_id = rRow?.id || null;
    const dRow = districts.find(d => d.name === district && d.region_id === region_id);
    const district_id = dRow?.id || null;

    // 3. Insert profile
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .insert({
        id: user_id,
        badge,
        full_name,
        rank,
        role,
        department: department || null,
        region_id,
        district_id,
        station_id: station_id || null,
        phone: phone || null,
        email: email || null,
        nida: nida || null,
        status: "active",
      })
      .select()
      .single();
    if (pErr) throw pErr;

    await loadAll();
    return profile;
  }

  async function deleteStation(id) {
    await supabase.from("stations").delete().eq("id", id);
    await loadAll();
  }

  async function deleteOfficer(id) {
    await supabase.from("profiles").delete().eq("id", id);
    await loadAll();
  }

  async function deleteRegion(id) {
    await supabase.from("regions").delete().eq("id", id);
    await loadAll();
  }

  // ── Helpers ──
  function districtsForRegion(regionName) {
    const r = regions.find(x => x.name === regionName);
    if (!r) return [];
    return districts.filter(d => d.region_id === r.id);
  }

  function stationsForRegion(regionName, districtName) {
    const r = regions.find(x => x.name === regionName);
    if (!r) return [];
    return stations.filter(s => {
      const regionMatch = s.region_id === r.id;
      if (!districtName) return regionMatch;
      const d = districts.find(x => x.name === districtName && x.region_id === r.id);
      return regionMatch && (!d || s.district_id === d.id);
    });
  }

  return (
    <Ctx.Provider value={{
      regions, districts, stations, officers,
      loading, error,
      addRegion, addStation, addOfficer,
      deleteRegion, deleteStation, deleteOfficer,
      districtsForRegion, stationsForRegion,
      refresh: loadAll,
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
