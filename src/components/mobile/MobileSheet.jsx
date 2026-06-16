// MobileSheet - bottom sheet modal that slides up from the bottom on mobile.
// On desktop it falls back to a centered modal (the existing pattern).
// USAGE:
//   <MobileSheet open={modal} onClose={()=>setModal(false)} title="New Report">
//     ...form...
//   </MobileSheet>
import { useIsMobile } from "../../hooks/useIsMobile";
import { X } from "lucide-react";

export default function MobileSheet({ open, onClose, title, children, maxWidth=560 }) {
  const isMobile = useIsMobile();
  if (!open) return null;

  if (isMobile) {
    return (
      <div onClick={e=>e.target===e.currentTarget&&onClose&&onClose()}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }}>
        <div style={{ background:"white", width:"100%", maxHeight:"92vh", overflowY:"auto", borderTopLeftRadius:20, borderTopRightRadius:20, padding:"14px 18px 24px", boxShadow:"0 -8px 32px rgba(0,0,0,.2)", animation:"slideUp .25s ease" }}>
          {/* Drag handle */}
          <div style={{ width:40, height:4, background:"#CBD5E1", borderRadius:2, margin:"0 auto 12px" }}/>
          {title && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0D3477" }}>{title}</h3>
              {onClose && <button onClick={onClose} aria-label="Close" style={{ width:32, height:32, borderRadius:8, border:"none", background:"#F1F5F9", color:"#64748B", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>}
            </div>
          )}
          {children}
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        </div>
      </div>
    );
  }

  // Desktop fallback: centered modal
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose&&onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
      <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth, maxHeight:"90vh", overflowY:"auto" }}>
        {title && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0D3477" }}>{title}</h3>
            {onClose && <button onClick={onClose} aria-label="Close" style={{ width:32, height:32, borderRadius:8, border:"none", background:"#F1F5F9", color:"#64748B", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
