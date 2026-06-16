// ResponsiveTable - on desktop renders a normal table; on mobile collapses
// each row into a card with the column headers becoming inline labels.
//
// USAGE:
//   <ResponsiveTable
//     columns={[
//       { key:"ref_number", label:"Ref" },
//       { key:"accused_name", label:"Accused", primary:true },
//       { key:"status", label:"Status", render:(v)=>statusPill(v) },
//     ]}
//     rows={cases}
//     onRowClick={openDrawer}
//     emptyText="No cases yet"
//   />
//
// `primary:true` columns are shown as the card's headline on mobile.
// `render` is called with (value, row) and lets you return JSX.
import { useIsMobile } from "../../hooks/useIsMobile";

export default function ResponsiveTable({ columns, rows, onRowClick, emptyText="No records", loading=false }) {
  const isMobile = useIsMobile();

  if (loading) {
    return <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>;
  }
  if (!rows || rows.length === 0) {
    return <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>{emptyText}</div>;
  }

  // ─ Mobile: card view ─
  if (isMobile) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {rows.map((row, i) => {
          const primary = columns.find(c => c.primary) || columns[0];
          const secondaries = columns.filter(c => c !== primary);
          const pVal = primary.render ? primary.render(row[primary.key], row) : row[primary.key];
          return (
            <div key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0", padding:"12px 14px", cursor:onRowClick?"pointer":"default", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:6 }}>{pVal || "—"}</div>
              {secondaries.map(c => {
                const v = c.render ? c.render(row[c.key], row) : row[c.key];
                if (v === null || v === undefined || v === "") return null;
                return (
                  <div key={c.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", fontSize:12 }}>
                    <span style={{ color:"#94A3B8", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.3 }}>{c.label}</span>
                    <span style={{ color:"#475569", textAlign:"right" }}>{v}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ─ Desktop: table view ─
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ borderBottom:"1px solid #F1F5F9", cursor:onRowClick?"pointer":"default" }}
              onMouseEnter={e=>{ if(onRowClick) e.currentTarget.style.background="#F8FAFC"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}>
              {columns.map(c => {
                const v = c.render ? c.render(row[c.key], row) : row[c.key];
                return <td key={c.key} style={{ padding:"12px 14px", fontSize:13, color:"#475569" }}>{v ?? "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
