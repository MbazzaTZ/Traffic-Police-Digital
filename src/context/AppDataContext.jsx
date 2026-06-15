import { createContext, useContext, useState } from "react";

// Tanzania complete region → districts mapping
export const TZ_REGIONS = {
  "Arusha":           ["Arusha Urban","Meru","Ngorongoro","Monduli","Karatu","Longido","Arusha Rural"],
  "Dar es Salaam":    ["Ilala","Kinondoni","Temeke","Ubungo","Kigamboni"],
  "Dodoma":           ["Dodoma Urban","Bahi","Chamwino","Kondoa","Mpwapwa","Chemba","Kondoa"],
  "Geita":            ["Geita Urban","Bukombe","Chato","Mbogwe","Nyang'hwale"],
  "Iringa":           ["Iringa Urban","Kilolo","Mufindi","Iringa Rural"],
  "Kagera":           ["Bukoba Urban","Bukoba Rural","Biharamulo","Karagwe","Kyerwa","Muleba","Ngara","Misenyi"],
  "Katavi":           ["Mpanda Urban","Mpanda Rural","Mlele","Nsimbo"],
  "Kigoma":           ["Kigoma Urban","Kigoma Rural","Kibondo","Kasulu","Buhigwe","Kakonko","Uvinza"],
  "Kilimanjaro":      ["Moshi Urban","Moshi Rural","Hai","Rombo","Same","Siha","Mwanga"],
  "Lindi":            ["Lindi Urban","Lindi Rural","Kilwa","Liwale","Nachingwea","Ruangwa"],
  "Mara":             ["Musoma Urban","Musoma Rural","Bunda","Butiama","Rorya","Serengeti","Tarime"],
  "Mbeya":            ["Mbeya Urban","Mbeya Rural","Busokelo","Chunya","Kyela","Mbarali","Momba","Rungwe"],
  "Morogoro":         ["Morogoro Urban","Morogoro Rural","Gairo","Ifakara","Kilombero","Kilosa","Mvomero","Ulanga"],
  "Mtwara":           ["Mtwara Urban","Mtwara Rural","Masasi","Nanyumbu","Newala","Tandahimba"],
  "Mwanza":           ["Ilemela","Nyamagana","Buchosa","Kwimba","Magu","Misungwi","Sengerema","Ukerewe"],
  "Njombe":           ["Njombe Urban","Makete","Wanging'ombe","Ludewa","Njombe Rural"],
  "Pemba North":      ["Micheweni","Wete"],
  "Pemba South":      ["Chake Chake","Mkoani"],
  "Pwani":            ["Bagamoyo","Kibaha Urban","Kibaha Rural","Kisarawe","Mafia","Mkuranga","Rufiji"],
  "Rukwa":            ["Sumbawanga Urban","Sumbawanga Rural","Kalambo","Nkasi"],
  "Ruvuma":           ["Songea Urban","Songea Rural","Mbinga","Namtumbo","Nyasa","Tunduru"],
  "Shinyanga":        ["Shinyanga Urban","Shinyanga Rural","Kahama Urban","Kahama Rural","Kishapu","Ushetu"],
  "Simiyu":           ["Bariadi","Busega","Itilima","Maswa","Meatu"],
  "Singida":          ["Singida Urban","Singida Rural","Ikungi","Iramba","Manyoni","Mkalama"],
  "Songwe":           ["Mbozi","Momba","Songwe","Ileje","Vwawa"],
  "Tabora":           ["Tabora Urban","Igunga","Kaliua","Nzega","Sikonge","Urambo","Uyui"],
  "Tanga":            ["Tanga Urban","Handeni","Kilindi","Korogwe Urban","Korogwe Rural","Lushoto","Mkinga","Muheza","Pangani"],
  "Zanzibar North":   ["Kaskazini A","Kaskazini B"],
  "Zanzibar South":   ["Kati","Kusini"],
  "Zanzibar West":    ["Magharibi A","Magharibi B","Mjini"],
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

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  // Stations created by admin
  const [stations, setStations] = useState([]);
  // Regions created by admin
  const [regions, setRegions] = useState([]);
  // Officers created
  const [officers, setOfficers] = useState([]);

  function addStation(station) {
    const s = { ...station, id: `STN-${Date.now()}`, officers: 0, status: "Active", createdAt: new Date().toISOString() };
    setStations(prev => [s, ...prev]);
    return s;
  }

  function addRegion(region) {
    const r = { ...region, id: `RGN-${Date.now()}`, districts: TZ_REGIONS[region.name] || [], stations: 0, officers: 0 };
    setRegions(prev => [r, ...prev]);
    return r;
  }

  function addOfficer(officer) {
    const o = { ...officer, id: `OFF-${Date.now()}`, status: "Active", createdAt: new Date().toISOString() };
    setOfficers(prev => [o, ...prev]);
    return o;
  }

  return (
    <AppDataContext.Provider value={{ stations, regions, officers, addStation, addRegion, addOfficer }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
