// ============================================================
// TPDOP PDF Export — citations, reports, official documents
// Uses dynamic import so jsPDF only loads when a PDF is generated
// (avoids dev-server pre-bundle 500 errors on page load)
// ============================================================

const NAVY = [8, 42, 99];
const GOLD = [217, 119, 6];

async function getJsPDF() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF, autoTable };
}

function header(doc, title, subtitle) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("JAMHURI YA MUUNGANO WA TANZANIA", 105, 13, { align: "center" });
  doc.setFontSize(11);
  doc.text("JESHI LA POLISI TANZANIA - TANZANIA POLICE FORCE", 105, 20, { align: "center" });
  doc.setFontSize(13);
  doc.setTextColor(252, 211, 77);
  doc.text(title, 105, 30, { align: "center" });
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(subtitle, 105, 35, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
}

function footer(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`TPDOP - Generated ${new Date().toLocaleString("en-GB")}`, 14, 290);
    doc.text(`Page ${i} of ${pages}`, 196, 290, { align: "right" });
    doc.text("OFFICIAL DOCUMENT - HATI RASMI", 105, 290, { align: "center" });
  }
}

// ── Single citation PDF ──
export async function exportCitation(c, officerName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "TRAFFIC CITATION - FAINI YA BARABARA", c.ref_number);

  doc.setFontSize(10);
  let y = 50;
  const row = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), 80, y);
    y += 8;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DRIVER INFORMATION - TAARIFA YA DEREVA", 14, y); y += 9;
  doc.setFontSize(10);
  row("Driver Name:", c.driver_name);
  row("License No:", c.driver_license);
  row("NIDA:", c.driver_nida);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VEHICLE - GARI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Plate Number:", c.vehicle_plate);
  row("Type / Make:", `${c.vehicle_type || ""} ${c.vehicle_make || ""}`);
  row("Color:", c.vehicle_color);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OFFENSE & FINE - KOSA NA FAINI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Offense:", c.offense_type);
  row("Location:", c.location_text);
  row("Date Issued:", new Date(c.created_at).toLocaleString("en-GB"));
  row("Issued By:", officerName);
  row("Status:", (c.status || "unpaid").toUpperCase());

  y += 6;
  doc.setFillColor(...GOLD);
  doc.rect(14, y, 182, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`FINE AMOUNT: TZS ${(c.fine_amount || 0).toLocaleString()}`, 105, y + 10, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += 28;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Payment due within 30 days. Failure to pay may result in additional penalties.", 14, y);
  doc.text("Malipo ndani ya siku 30. Kutolipa kunaweza kusababisha adhabu za ziada.", 14, y + 5);

  footer(doc);
  doc.save(`Citation_${c.ref_number}.pdf`);
}

// ── PF3 Medical Examination Form PDF ──
export async function exportPF3(f, officerName, stationName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "PF.3 - MEDICAL EXAMINATION FORM", f.ref_number);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Police request for medical examination / Ombi la uchunguzi wa kitabibu", 105, 44, { align: "center" });

  let y = 54;
  const row = (label, value) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0,0,0);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), 85, y);
    y += 8;
  };

  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("SECTION A - POLICE (to be filled by officer)", 14, y); y += 9;
  row("Patient Name:", f.patient_name);
  row("NIDA:", f.patient_nida);
  row("Age / Gender:", `${f.patient_age || "-"} / ${f.patient_gender || "-"}`);
  row("Phone:", f.patient_phone);
  row("Patient Type:", (f.patient_type || "").toUpperCase());
  row("Incident Type:", f.incident_type);
  row("Incident Date:", f.incident_date ? new Date(f.incident_date).toLocaleDateString("en-GB") : "-");
  row("Referred To:", f.hospital_name);
  row("Issued By:", officerName);
  row("Station:", stationName || f.station_name || "-");
  row("Date Issued:", new Date(f.created_at).toLocaleString("en-GB"));

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Alleged Injuries:", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  const injuries = doc.splitTextToSize(f.injuries_alleged || "Not specified", 180);
  doc.text(injuries, 14, y); y += injuries.length * 5 + 6;

  // Section B - doctor
  doc.setDrawColor(8, 42, 99); doc.setLineWidth(0.5);
  doc.line(14, y, 196, y); y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("SECTION B - MEDICAL OFFICER (to be filled by doctor)", 14, y); y += 12;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  ["Examination findings:", "", "", "", "Nature of injuries (Sec 5 PC):", "", "Probable cause / weapon:", "", "Doctor's Name & Signature:", "Hospital Stamp & Date:"].forEach(line => {
    if (line) doc.text(line, 14, y);
    else { doc.setDrawColor(180,180,180); doc.line(14, y, 196, y); }
    y += 9;
  });

  footer(doc);
  doc.save(`PF3_${f.ref_number}.pdf`);
}

// ── Generic table report PDF ──
export async function exportReport(title, columns, rows, subtitle) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, title, subtitle);
  autoTable(doc, {
    startY: 44,
    head: [columns],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
  });
  footer(doc);
  doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`);
}
