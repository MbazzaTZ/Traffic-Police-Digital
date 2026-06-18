// PhotoUpload - reusable file uploader that pushes to Supabase Storage
// and returns one or more public URLs to the parent.
//
// USAGE:
//   <PhotoUpload
//     bucket="uploads"
//     folder="pf3"
//     value={form.photo_urls}
//     onChange={(urls)=>setForm({...form, photo_urls:urls})}
//     maxFiles={5}
//     label="Photos of injuries"
//   />
//
// On mobile this opens the camera directly (capture="environment").
// On desktop it shows a normal file picker.
// Each file is shown as a thumbnail with a remove (X) button.
// Files are uploaded immediately on selection so the parent always
// has the final URLs in state - no waiting on submit.

import { useState, useRef } from "react";
import { Camera, X, Loader, AlertCircle, ImagePlus } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PhotoUpload({
  bucket = "uploads",
  folder = "misc",
  value = [],
  onChange,
  maxFiles = 5,
  accept = "image/*,application/pdf",
  label = "Photos",
  hint = "Tap to add photos · Camera or gallery",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (value.length + files.length > maxFiles) {
      setErr(`Maximum ${maxFiles} files allowed. You're trying to add ${files.length} more (already have ${value.length}).`);
      e.target.value = "";
      return;
    }
    setErr("");
    setUploading(true);

    const uploaded = [];
    try {
      for (const f of files) {
        if (f.size > 10 * 1024 * 1024) {
          throw new Error(`${f.name} is larger than 10 MB. Use a smaller file.`);
        }
        // Unique filename in folder: {folder}/{timestamp}-{random}-{name}
        const ext = f.name.split(".").pop()?.toLowerCase() || "bin";
        const safeBase = f.name.replace(/[^a-z0-9.\-_]/gi, "_").slice(0, 60);
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeBase}`;

        const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, {
          cacheControl: "3600",
          upsert: false,
          contentType: f.type || undefined,
        });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(publicUrl);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i) {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
  }

  const atMax = value.length >= maxFiles;

  return (
    <div>
      {label && (
        <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:0.4, marginBottom:6 }}>
          {label} <span style={{ color:"#94A3B8", fontWeight:500, textTransform:"none", letterSpacing:0 }}>({value.length}/{maxFiles})</span>
        </div>
      )}

      {/* Thumbnails row */}
      {value.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
          {value.map((url, i) => {
            const isPdf = /\.pdf(\?|$)/i.test(url);
            return (
              <div key={i} style={{ position:"relative", width:72, height:72, borderRadius:9, overflow:"hidden", border:"1px solid #E2E8F0", background:"#F8FAFC" }}>
                {isPdf ? (
                  <a href={url} target="_blank" rel="noreferrer" style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", color:"#DC2626", fontWeight:800, fontSize:11, flexDirection:"column", gap:3 }}>
                    📄 PDF
                  </a>
                ) : (
                  <a href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`upload-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  </a>
                )}
                <button type="button" onClick={()=>removeAt(i)} aria-label="Remove"
                  style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", border:"none", background:"rgba(0,0,0,.65)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                  <X size={11}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Picker button */}
      {!atMax && (
        <label htmlFor={`photo-up-${folder}`}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 16px", border:"2px dashed #CBD5E1", borderRadius:10, background:"#F8FAFC", cursor:uploading?"not-allowed":"pointer", color:"#475569", fontSize:12, fontWeight:600, transition:".15s" }}>
          {uploading ? (
            <><Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> Uploading...</>
          ) : (
            <>
              <Camera size={16}/>
              <span>{hint}</span>
              <ImagePlus size={16}/>
            </>
          )}
          <input
            id={`photo-up-${folder}`}
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            capture="environment"
            onChange={handleFiles}
            disabled={uploading}
            style={{ display:"none" }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </label>
      )}

      {err && (
        <div style={{ marginTop:7, padding:"7px 10px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:7, fontSize:11, color:"#B91C1C", display:"flex", gap:6, alignItems:"flex-start" }}>
          <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }}/>
          {err}
        </div>
      )}
    </div>
  );
}
