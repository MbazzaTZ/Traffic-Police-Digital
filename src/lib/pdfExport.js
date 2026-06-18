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

// ── Wanted Person Poster PDF ──
// Generates a single-page "WANTED" poster suitable for printing and
// posting at police stations, checkpoints, and public notice boards.
// Designed to be visually striking — red header, large name, photo
// placeholder, danger-level badge, and key identifying details.
export async function exportWantedPoster(w, officerName, stationName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();

  const DANGER_COLORS = {
    low:      [100, 116, 139],   // slate
    medium:   [217, 119, 6],     // amber
    high:     [220, 38, 38],     // red
    armed:    [124, 58, 237],    // purple
    critical: [220, 38, 38],     // red
  };
  const dc = DANGER_COLORS[w.danger_level] || DANGER_COLORS.medium;
  const isArmed = w.danger_level === "armed";

  // ── Top red banner ──
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("WANTED", 105, 22, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("MTUHUMIWA ANAYETAFUTWA · Tanzania Police Force", 105, 30, { align: "center" });

  // ── Ref number ──
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Ref: ${w.ref_number || "WRT-" + (w.id || "").slice(0, 8)}`, 14, 45);
  doc.text(`Issued: ${new Date(w.created_at || Date.now()).toLocaleDateString("en-GB")}`, 196, 45, { align: "right" });

  // ── Photo placeholder (left side) ──
  const photoX = 14, photoY = 52, photoW = 70, photoH = 90;
  doc.setDrawColor(...dc);
  doc.setLineWidth(1.5);
  doc.rect(photoX, photoY, photoW, photoH);

  if (w.photo_url) {
    try {
      // Try to embed the photo (jsPDF supports JPEG/PNG via addImage)
      doc.addImage(w.photo_url, "JPEG", photoX + 2, photoY + 2, photoW - 4, photoH - 4);
    } catch {
      // If image fails to load, show placeholder
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }
  } else {
    // No photo — show silhouette placeholder
    doc.setFontSize(48);
    doc.setTextColor(220, 220, 220);
    doc.text("\u25A0", photoX + photoW / 2, photoY + photoH / 2 + 10, { align: "center" }); // square as silhouette stand-in
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("NO PHOTO AVAILABLE", photoX + photoW / 2, photoY + photoH / 2 + 25, { align: "center" });
  }

  // ── Name + danger badge (right side) ──
  const detailsX = 92;
  let y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  const nameLines = doc.splitTextToSize(w.full_name || "UNKNOWN", 110);
  doc.text(nameLines, detailsX, y);
  y += nameLines.length * 9 + 4;

  if (w.alias) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`a.k.a. "${w.alias}"`, detailsX, y);
    y += 8;
  }

  // Danger level badge
  doc.setFillColor(...dc);
  doc.roundedRect(detailsX, y, 75, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const dangerLabel = isArmed ? "⚠ ARMED & DANGEROUS" : `DANGER LEVEL: ${w.danger_level?.toUpperCase()}`;
  doc.text(dangerLabel, detailsX + 37.5, y + 9.5, { align: "center" });
  y += 22;

  // Key details table
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const detailRow = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, detailsX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    const wrapped = doc.splitTextToSize(String(value || "—"), 70);
    doc.text(wrapped, detailsX + 35, y);
    y += Math.max(6, wrapped.length * 5 + 2);
  };

  detailRow("NIDA:",     w.nida);
  detailRow("Gender:",   w.gender);
  detailRow("DOB:",      w.dob ? new Date(w.dob).toLocaleDateString("en-GB") : "—");
  detailRow("Last Seen:", w.last_seen);
  detailRow("Region:",   w.region);

  // ── Offenses section (full width) ──
  y = Math.max(y, 150);
  doc.setDrawColor(...dc);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dc);
  doc.text("WANTED FOR · ANATAFUTWA KWA:", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const offenseLines = doc.splitTextToSize(w.offenses || w.crime || "Criminal offenses — contact police for details.", 180);
  doc.text(offenseLines, 14, y);
  y += offenseLines.length * 6 + 4;

  // Description
  if (w.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("DESCRIPTION · MAELEZO:", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const descLines = doc.splitTextToSize(w.description, 180);
    doc.text(descLines, 14, y);
    y += descLines.length * 5 + 4;
  }

  // ── Reward section (if any) ──
  if (w.reward && w.reward > 0) {
    doc.setFillColor(...GOLD);
    doc.rect(14, y, 182, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`REWARD · TSHABA: TZS ${(w.reward || 0).toLocaleString()}`, 105, y + 11, { align: "center" });
    y += 22;
  }

  // ── Footer with contact info ──
  y = Math.max(y, 260);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.line(14, y, 196, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("IF SEEN, CONTACT NEAREST POLICE STATION", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Or call: 112 (Emergency) · 022-211-0000 (TPDOP HQ)`, 14, y);
  y += 5;
  doc.text(`Issued by: ${officerName || "—"} · ${stationName || "Tanzania Police"}`, 14, y);
  y += 5;
  doc.text(`Do not approach if armed. Exercise extreme caution.`, 14, y);

  // ── Stamp/seal placeholder (bottom right) ──
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.circle(180, 280, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text("TPF", 180, 282, { align: "center" });
  doc.setFontSize(5);
  doc.text("OFFICIAL", 180, 285, { align: "center" });

  // Footer with date + page
  footer(doc);

  doc.save(`Wanted_${(w.full_name || "Unknown").replace(/[^a-z0-9]/gi, "_")}_${w.ref_number || (w.id || "").slice(0, 8)}.pdf`);
}

// ── Warrant PDF ──
// Generates an official court warrant document for arrest, search, or seizure.
// Designed to be printable and presentable to the subject upon execution.
export async function exportWarrant(w, officerName, stationName) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();

  const TYPE_LABELS = {
    arrest: "WARRANT OF ARREST",
    search: "SEARCH WARRANT",
    seizure: "WARRANT OF SEIZURE",
    bench: "BENCH WARRANT",
    production: "WARRANT OF PRODUCTION",
    other: "WARRANT",
  };
  const title = TYPE_LABELS[w.type] || "WARRANT";

  // ── Court header (centered, formal) ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNITED REPUBLIC OF TANZANIA", 105, 12, { align: "center" });
  doc.setFontSize(11);
  doc.text("JUDICIARY · MAHAKAMA", 105, 19, { align: "center" });
  doc.setFontSize(16);
  doc.setTextColor(252, 211, 77);
  doc.text(title, 105, 30, { align: "center" });

  // ── Court info ──
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("IN THE DISTRICT COURT OF TANZANIA", 105, 50, { align: "center" });
  doc.text(`AT ${String(w.court || "—").toUpperCase()}`, 105, 57, { align: "center" });

  // ── Warrant number + dates (right-aligned box) ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const refNo = w.ref_number || w.warrant_no || "—";
  doc.text(`Warrant No: ${refNo}`, 196, 50, { align: "right" });
  doc.text(`Issued: ${w.issued_at ? new Date(w.issued_at).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")}`, 196, 55, { align: "right" });
  if (w.expires_at) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Expires: ${new Date(w.expires_at).toLocaleDateString("en-GB")}`, 196, 60, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  // ── Divider ──
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.line(14, 65, 196, 65);

  // ── TO: Subject ──
  let y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TO: The Officer in Charge, Tanzania Police Force", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Whereas information has been laid before this Court that the person named below", 14, y);
  y += 6;
  doc.text("has committed an offense(s) and is required to be apprehended/brought before this Court:", 14, y);
  y += 10;

  // ── Subject details box ──
  doc.setFillColor(245, 247, 252);
  doc.rect(14, y - 4, 182, 32, "F");
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.rect(14, y - 4, 182, 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SUBJECT · MTUHUMIWA", 18, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const row = (label, value, x) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "—"), x + 35, y + 10);
  };
  row("Name:", w.person_name, 18);
  row("NIDA:", w.person_nida, 110);
  row("Court:", w.court, 18);
  row("Judge:", w.judge, 110);
  y += 36;

  // ── Warrant body (grounds) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("GROUNDS FOR WARRANT · SABABU", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const descLines = doc.splitTextToSize(w.description || "The above-named person is suspected of committing a criminal offense and is required to be apprehended and brought before this Court to answer to the charges.", 182);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 8;

  // ── Directive ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("DIRECTIVE · MAELEKEZO", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const directive = `You are hereby directed to ${w.type === "arrest" ? "arrest and bring before this Court" : w.type === "search" ? "search the premises of" : "seize the property of"} the above-named person${w.location ? ` at ${w.location}` : ""}. This warrant shall be executed within the period specified above, or it shall be returned to this Court with a report of execution.`;
  const directiveLines = doc.splitTextToSize(directive, 182);
  doc.text(directiveLines, 14, y);
  y += directiveLines.length * 5 + 12;

  // ── Urgent flag ──
  if (w.urgent) {
    doc.setFillColor(220, 38, 38);
    doc.rect(14, y, 182, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("⚠ THIS WARRANT IS URGENT · HATARI — EXECUTE IMMEDIATELY", 105, y + 9, { align: "center" });
    y += 20;
    doc.setTextColor(0, 0, 0);
  }

  // ── Execution status ──
  if (w.status === "executed" && w.executed_at) {
    doc.setFillColor(22, 163, 74);
    doc.rect(14, y, 182, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`✓ EXECUTED on ${new Date(w.executed_at).toLocaleDateString("en-GB")}`, 105, y + 9, { align: "center" });
    y += 20;
    doc.setTextColor(0, 0, 0);
  } else if (w.status === "cancelled") {
    doc.setFillColor(100, 116, 139);
    doc.rect(14, y, 182, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CANCELLED · IMEFUTWA", 105, y + 9, { align: "center" });
    y += 20;
    doc.setTextColor(0, 0, 0);
  }

  // ── Signature lines ──
  y = Math.max(y, 240);
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Judge / Magistrate Signature", 55, y, { align: "center" });
  doc.text("Executing Officer Signature", 155, y, { align: "center" });
  y += 8;
  doc.text(`Issued by: ${officerName || "—"}`, 14, y);
  y += 5;
  doc.text(`Station: ${stationName || "—"}`, 14, y);

  // ── Footer ──
  footer(doc);
  doc.save(`Warrant_${refNo}.pdf`);
}
