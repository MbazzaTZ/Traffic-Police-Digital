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

// ── Firearm License Certificate PDF ──
export async function exportFirearmLicense(lic, officerName, stationName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "FIREARM LICENSE CERTIFICATE", lic.license_no || lic.ref_number);

  doc.setFontSize(9);
  doc.setTextColor(80,80,80);
  doc.text("Leseni ya Silaha · Issued under the Arms and Ammunition Act", 105, 44, { align: "center" });

  let y = 56;
  // License number box
  doc.setFillColor(...GOLD);
  doc.rect(14, y, 182, 18, "F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("LICENSE NUMBER", 105, y+7, { align:"center" });
  doc.setFontSize(16);
  doc.text(lic.license_no || "—", 105, y+15, { align:"center" });
  doc.setTextColor(0,0,0);
  y += 28;

  const row = (label, value) => {
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text(label, 14, y);
    doc.setFont("helvetica","normal");
    doc.text(String(value || "—"), 85, y);
    y += 8;
  };

  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("HOLDER · MMILIKI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Full Name:", lic.holder_name);
  row("NIDA:", lic.holder_nida);
  row("License Type:", (lic.license_type||"").replace(/_/g," ").toUpperCase());

  y += 4;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("AUTHORIZED FIREARM · SILAHA", 14, y); y += 9;
  doc.setFontSize(10);
  if (lic.firearms) {
    row("Serial No:", lic.firearms.serial_number);
    row("Make / Model:", `${lic.firearms.make || ""} ${lic.firearms.model || ""}`);
  } else {
    row("Firearm:", "Not linked to specific weapon");
  }

  y += 4;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("VALIDITY · UHALALI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Issue Date:", lic.issue_date ? new Date(lic.issue_date).toLocaleDateString("en-GB") : "—");
  row("Expiry Date:", lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString("en-GB") : "—");
  row("Issued By:", officerName);
  row("Station:", stationName || "—");
  row("Status:", (lic.status || "ACTIVE").toUpperCase());

  // Signature lines
  y += 14;
  doc.setDrawColor(150,150,150);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9); doc.setTextColor(100,100,100);
  doc.text("Issuing Officer Signature", 55, y, { align:"center" });
  doc.text("Holder Signature", 155, y, { align:"center" });

  // Warning footer
  y += 14;
  doc.setFontSize(8); doc.setTextColor(150,30,30);
  doc.text("This license must be presented on demand to any police officer.", 105, y, { align:"center" });
  doc.text("Loss, theft, or transfer must be reported within 24 hours.", 105, y+5, { align:"center" });

  footer(doc);
  doc.save(`License_${lic.license_no || lic.ref_number}.pdf`);
}

// ── Payment Receipt PDF ──
export async function exportPaymentReceipt(p, officerName, stationName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "OFFICIAL PAYMENT RECEIPT", p.ref_number);

  doc.setFontSize(9);
  doc.setTextColor(80,80,80);
  doc.text("Risiti Rasmi ya Malipo · Traffic Fine Receipt", 105, 44, { align: "center" });

  // Receipt # plaque (green)
  let y = 56;
  doc.setFillColor(22, 163, 74);
  doc.rect(14, y, 182, 18, "F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("RECEIPT NUMBER", 105, y+7, { align:"center" });
  doc.setFontSize(16);
  doc.text(p.ref_number || "—", 105, y+15, { align:"center" });
  doc.setTextColor(0,0,0);
  y += 28;

  const row = (label, value) => {
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    doc.text(label, 14, y);
    doc.setFont("helvetica","normal");
    doc.text(String(value || "—"), 85, y);
    y += 8;
  };

  const cit = p.citations || {};
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("CITATION", 14, y); y += 9;
  doc.setFontSize(10);
  row("Citation Ref:",  cit.ref_number);
  row("Control No:",    p.control_number);
  row("Driver:",        cit.driver_name);
  row("Vehicle Plate:", cit.vehicle_plate);
  row("Offense:",       cit.offense_type);
  row("Fine Amount:",   `TZS ${(cit.fine_amount||0).toLocaleString()}`);

  y += 4;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("PAYMENT", 14, y); y += 9;
  doc.setFontSize(10);
  row("Amount Paid:",    `TZS ${(p.amount||0).toLocaleString()}`);
  row("Method:",         (p.method||"").replace(/_/g," ").toUpperCase());
  row("Transaction Ref:",p.transaction_ref);
  row("Payer Name:",     p.payer_name);
  row("Payer Phone:",    p.payer_phone);
  row("Paid At:",        new Date(p.paid_at).toLocaleString("en-GB"));
  const balance = (cit.fine_amount||0) - ((cit.amount_paid||0));
  row("Balance:",        `TZS ${Math.max(0,balance).toLocaleString()}`);
  row("Status:",         balance <= 0 ? "FULLY PAID" : "PARTIAL");

  y += 4;
  doc.setFont("helvetica","bold"); doc.setFontSize(11);
  doc.text("ISSUED BY", 14, y); y += 9;
  doc.setFontSize(10);
  row("Officer:",  officerName);
  row("Station:",  stationName || "—");

  // Signature line
  y += 14;
  doc.setDrawColor(150,150,150);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9); doc.setTextColor(100,100,100);
  doc.text("Receiving Officer Signature", 55, y, { align:"center" });
  doc.text("Payer Signature", 155, y, { align:"center" });

  // Footer note
  y += 12;
  doc.setFontSize(8); doc.setTextColor(100,100,100);
  doc.text("Keep this receipt as proof of payment. Quote the receipt number in case of any query.", 105, y, { align:"center" });

  footer(doc);
  doc.save(`Receipt_${p.ref_number}.pdf`);
}

// ── Court File PDF (full prosecution bundle) ──
// Compiles charges + hearings + evidence + statements into one
// official document the IO can hand to the prosecutor.
export async function exportCourtFile({ caseRecord, hearings = [], bundle = [], statements = [] }, officerName = "—", stationName = "—") {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "COURT CASE FILE - JALADA LA KESI", caseRecord.ref_number);

  // ── Cover page: case summary ──
  let y = 50;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text("CASE SUMMARY - MUHTASARI WA KESI", 14, y);
  y += 7;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
  doc.line(14, y, 196, y); y += 8;

  const row = (label, value) => {
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text(label, 14, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(0,0,0); doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(String(value || "-"), 110);
    doc.text(wrapped, 70, y);
    y += Math.max(7, wrapped.length * 5);
  };
  row("Internal Ref:",      caseRecord.ref_number);
  row("Court Case No:",     caseRecord.case_number);
  row("Accused:",           caseRecord.accused_name);
  row("Charges:",           caseRecord.charges);
  row("Court:",             `${caseRecord.court_name || "-"} (${(caseRecord.court_type||"").replace(/_/g," ")})`);
  row("Filed Date:",        caseRecord.filed_date ? new Date(caseRecord.filed_date).toLocaleDateString("en-GB") : "-");
  row("Status:",            (caseRecord.status || "-").toUpperCase());
  row("Verdict:",           caseRecord.verdict ? caseRecord.verdict.replace(/_/g," ").toUpperCase() : "PENDING");
  row("Sentence:",          caseRecord.sentence);
  row("Prosecutor:",        caseRecord.prosecutor);
  row("Defence Counsel:",   caseRecord.defence);
  row("Investigating Officer:", officerName);
  row("Station:",           stationName);

  y += 4;
  // Bundle summary box
  doc.setFillColor(245, 247, 252);
  doc.rect(14, y, 182, 22, "F");
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.rect(14, y, 182, 22);
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
  doc.text("BUNDLE CONTENTS", 18, y + 6);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(0,0,0);
  doc.text(`Hearings: ${hearings.length}`,    20, y + 14);
  doc.text(`Evidence: ${bundle.length}`,      80, y + 14);
  doc.text(`Statements: ${statements.length}`, 140, y + 14);

  // ── SECTION: Hearings ──
  doc.addPage();
  header(doc, "COURT CASE FILE", caseRecord.ref_number);
  y = 50;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(`HEARINGS - MASIKILIZO (${hearings.length})`, 14, y);
  doc.setDrawColor(...GOLD); doc.line(14, y+2, 196, y+2);
  y += 8;

  if (hearings.length === 0) {
    doc.setFont("helvetica","italic"); doc.setFontSize(10); doc.setTextColor(120,120,120);
    doc.text("No hearings recorded for this case.", 14, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Type", "Magistrate", "Outcome", "Next"]],
      body: hearings.map((h, i) => [
        i + 1,
        h.hearing_date ? new Date(h.hearing_date).toLocaleString("en-GB") : "-",
        (h.hearing_type || "").replace(/_/g," "),
        h.magistrate || "-",
        h.outcome || "-",
        h.next_date ? new Date(h.next_date).toLocaleDateString("en-GB") : "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 10 }, 4: { cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
  }

  // ── SECTION: Evidence Bundle ──
  doc.addPage();
  header(doc, "COURT CASE FILE", caseRecord.ref_number);
  y = 50;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(`EVIDENCE BUNDLE - USHAHIDI (${bundle.length})`, 14, y);
  doc.setDrawColor(...GOLD); doc.line(14, y+2, 196, y+2);
  y += 8;

  if (bundle.length === 0) {
    doc.setFont("helvetica","italic"); doc.setFontSize(10); doc.setTextColor(120,120,120);
    doc.text("No evidence has been tendered for this case.", 14, y);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Exhibit", "Ref No", "Type", "Description", "Purpose", "Storage"]],
      body: bundle.map(ce => {
        const ev = ce.evidence || {};
        return [
          ce.exhibit_label || "-",
          ev.ref_number || "-",
          ev.type || "-",
          ev.description || "-",
          ce.purpose || "-",
          ev.storage_location || "-",
        ];
      }),
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, cellPadding: 3, valign: "top" },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: "bold", textColor: GOLD },
        1: { cellWidth: 24, fontStyle: "bold" },
        2: { cellWidth: 22 },
        3: { cellWidth: 50 },
        4: { cellWidth: 40 },
        5: { cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ── SECTION: Statements ──
  for (let i = 0; i < statements.length; i++) {
    const s = statements[i];
    doc.addPage();
    header(doc, "COURT CASE FILE", caseRecord.ref_number);
    y = 50;
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text(`STATEMENT ${i + 1} OF ${statements.length} - MAELEZO`, 14, y);
    doc.setDrawColor(...GOLD); doc.line(14, y+2, 196, y+2);
    y += 10;

    doc.setFontSize(10); doc.setTextColor(0,0,0);
    const sRow = (label, value) => {
      doc.setFont("helvetica","bold"); doc.text(label, 14, y);
      doc.setFont("helvetica","normal");
      const wrapped = doc.splitTextToSize(String(value || "-"), 130);
      doc.text(wrapped, 60, y);
      y += Math.max(6, wrapped.length * 5);
    };
    sRow("Ref:",      s.ref_number);
    sRow("Type:",     (s.statement_type || "-").toUpperCase());
    sRow("Deponent:", s.deponent_name);
    sRow("NIDA:",     s.deponent_nida);
    sRow("Phone:",    s.deponent_phone);
    sRow("Address:",  s.deponent_address);
    sRow("Language:", (s.language || "sw").toUpperCase());
    sRow("Taken at:", s.taken_at ? new Date(s.taken_at).toLocaleString("en-GB") : "-");
    sRow("Taken by:", s.profiles?.full_name ? `${s.profiles.full_name} (${s.profiles.badge || "-"})` : "-");

    // Legal flags row
    const flags = [];
    if (s.sworn)        flags.push("SWORN ON OATH");
    if (s.cautioned)    flags.push("s.33 CAUTIONED");
    if (s.witness_bond) flags.push("s.34 WITNESS BOND");
    if (flags.length) {
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
      doc.text("Legal Flags:", 14, y);
      doc.setTextColor(150, 100, 0);
      doc.text(flags.join("   |   "), 60, y);
      y += 8;
    }

    // Content block - boxed
    y += 4;
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...NAVY);
    doc.text("STATEMENT CONTENT - MAUDHUI", 14, y);
    y += 4;
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    const contentLines = doc.splitTextToSize(s.content || "(no content recorded)", 180);
    const contentHeight = contentLines.length * 5 + 8;
    doc.rect(14, y, 182, Math.min(contentHeight, 230 - y));
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(0,0,0);
    doc.text(contentLines, 18, y + 6, { maxWidth: 174 });

    // Signature lines at bottom of page
    const sigY = 250;
    doc.setDrawColor(150,150,150);
    doc.line(20, sigY, 90, sigY);
    doc.line(120, sigY, 190, sigY);
    doc.setFontSize(8); doc.setTextColor(100,100,100);
    doc.text("Deponent Signature", 55, sigY + 5, { align: "center" });
    doc.text("Recording Officer Signature", 155, sigY + 5, { align: "center" });
  }

  // ── Final certification page ──
  doc.addPage();
  header(doc, "COURT CASE FILE", caseRecord.ref_number);
  y = 60;
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...NAVY);
  doc.text("CERTIFICATION OF FILE - UTHIBITISHO WA JALADA", 105, y, { align: "center" });
  y += 16;

  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(0,0,0);
  const cert = `I certify that this case file, comprising ${hearings.length} recorded hearing(s), ${bundle.length} evidence exhibit(s), and ${statements.length} witness/suspect statement(s), is a true and accurate compilation of the records held by the Tanzania Police Force in respect of case ${caseRecord.ref_number} (${caseRecord.accused_name}).`;
  const certLines = doc.splitTextToSize(cert, 180);
  doc.text(certLines, 14, y);
  y += certLines.length * 5 + 14;

  doc.setFont("helvetica","bold");
  doc.text(`Compiled by: ${officerName}`, 14, y); y += 7;
  doc.text(`Station: ${stationName}`, 14, y); y += 7;
  doc.text(`Date compiled: ${new Date().toLocaleString("en-GB")}`, 14, y); y += 20;

  doc.setDrawColor(...NAVY); doc.setLineWidth(0.6);
  doc.line(14, y, 90, y);
  doc.line(120, y, 196, y);
  y += 5;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(100,100,100);
  doc.text("Investigating Officer", 52, y, { align: "center" });
  doc.text("OCS / Station Commander", 158, y, { align: "center" });

  footer(doc);
  doc.save(`CourtFile_${caseRecord.ref_number}.pdf`);
}

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
