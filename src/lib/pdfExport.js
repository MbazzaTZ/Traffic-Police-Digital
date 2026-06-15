// ============================================================
// TPDOP PDF Export — citations, reports, official documents
// ============================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY = [8, 42, 99];
const GOLD = [217, 119, 6];

function header(doc, title, subtitle) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("JAMHURI YA MUUNGANO WA TANZANIA", 105, 13, { align: "center" });
  doc.setFontSize(11);
  doc.text("JESHI LA POLISI TANZANIA · TANZANIA POLICE FORCE", 105, 20, { align: "center" });
  doc.setFontSize(13);
  doc.setTextColor(...[252, 211, 77]);
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
    doc.text(`TPDOP · Generated ${new Date().toLocaleString("en-GB")}`, 14, 290);
    doc.text(`Page ${i} of ${pages}`, 196, 290, { align: "right" });
    doc.text("OFFICIAL DOCUMENT · HATI RASMI", 105, 290, { align: "center" });
  }
}

// ── Single citation PDF ──
export function exportCitation(c, officerName) {
  const doc = new jsPDF();
  header(doc, "TRAFFIC CITATION · FAINI YA BARABARA", c.ref_number);

  doc.setFontSize(10);
  let y = 50;
  const row = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "—"), 80, y);
    y += 8;
  };

  doc.setFillColor(245, 247, 250);
  doc.rect(10, 44, 190, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DRIVER INFORMATION · TAARIFA YA DEREVA", 14, y); y += 9;
  doc.setFontSize(10);
  row("Driver Name:", c.driver_name);
  row("License No:", c.driver_license);
  row("NIDA:", c.driver_nida);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VEHICLE · GARI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Plate Number:", c.vehicle_plate);
  row("Type / Make:", `${c.vehicle_type || ""} ${c.vehicle_make || ""}`);
  row("Color:", c.vehicle_color);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OFFENSE & FINE · KOSA NA FAINI", 14, y); y += 9;
  doc.setFontSize(10);
  row("Offense:", c.offense_type);
  row("Location:", c.location_text);
  row("Date Issued:", new Date(c.created_at).toLocaleString("en-GB"));
  row("Issued By:", officerName);
  row("Status:", (c.status || "unpaid").toUpperCase());

  // Fine amount box
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

// ── Generic table report PDF ──
export function exportReport(title, columns, rows, subtitle) {
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
