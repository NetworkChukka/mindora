const { generateExcel, generateCSV, generatePDF } = require("../services/exportService");
const { logAudit } = require("../utils/auditLogger");

const exportExcel = async (req, res) => {
  try {
    const workbook = await generateExcel(req.query);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `MINDORA_Report_${req.query.dateFilter || "all"}_${dateStr}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    if (req.user) {
      await logAudit({
        action: "ADMIN_EXPORTED_REPORT",
        user: req.user,
        description: `Exported Excel report (${filename}) with filters: ${JSON.stringify(req.query)}`,
        metadata: { format: "Excel", filter: req.query },
        req
      });
    }
  } catch (err) {
    console.error("[Export Excel] Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate Excel report" });
  }
};

const exportCSV = async (req, res) => {
  try {
    const csvData = await generateCSV(req.query);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `MINDORA_Registrations_${req.query.dateFilter || "all"}_${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.send(csvData);

    if (req.user) {
      await logAudit({
        action: "ADMIN_EXPORTED_REPORT",
        user: req.user,
        description: `Exported CSV report (${filename})`,
        metadata: { format: "CSV", filter: req.query },
        req
      });
    }
  } catch (err) {
    console.error("[Export CSV] Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate CSV report" });
  }
};

const exportPDF = async (req, res) => {
  try {
    const doc = await generatePDF(req.query);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `MINDORA_Official_Report_${req.query.dateFilter || "all"}_${dateStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    doc.pipe(res);
    doc.end();

    if (req.user) {
      await logAudit({
        action: "ADMIN_EXPORTED_REPORT",
        user: req.user,
        description: `Exported PDF official report (${filename})`,
        metadata: { format: "PDF", filter: req.query },
        req
      });
    }
  } catch (err) {
    console.error("[Export PDF] Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate PDF report" });
  }
};

module.exports = {
  exportExcel,
  exportCSV,
  exportPDF
};
