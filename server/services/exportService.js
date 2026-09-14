const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const StudentRegistration = require("../models/StudentRegistration");
const School = require("../models/School");
const { getDashboardStats } = require("./analyticsService");

const generateExcel = async (filterQuery = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MINDORA Microbiology Exhibition";
  workbook.lastModifiedBy = "MINDORA System";
  workbook.created = new Date();

  // Fetch data
  const stats = await getDashboardStats(filterQuery);
  const match = { deleted: false };
  if (filterQuery.schoolId) match.schoolId = filterQuery.schoolId;
  if (filterQuery.grade) match.grade = parseInt(filterQuery.grade, 10);
  if (filterQuery.educationLevel) match.educationLevel = filterQuery.educationLevel;
  if (filterQuery.registeredBy) match.registeredBy = filterQuery.registeredBy;
  if (filterQuery.dateFilter === "today") {
    match.visitDate = new Date().toISOString().split("T")[0];
  } else if (filterQuery.dateFilter === "day1") {
    match.visitDate = stats.settings.eventDay1Date;
  } else if (filterQuery.dateFilter === "day2") {
    match.visitDate = stats.settings.eventDay2Date;
  } else if (filterQuery.customDate) {
    match.visitDate = filterQuery.customDate;
  }

  const registrations = await StudentRegistration.find(match)
    .sort({ createdAt: -1 })
    .lean();

  const brandNavy = "FF1E224F";
  const brandGreen = "FF7CB342";
  const headerFont = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };

  // ----------------------------------------------------
  // Sheet 1: Registrations
  // ----------------------------------------------------
  const regSheet = workbook.addWorksheet("Registrations", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  regSheet.columns = [
    { header: "Registration ID", key: "registrationNumber", width: 18 },
    { header: "Student Name", key: "studentName", width: 28 },
    { header: "School", key: "schoolNameSnapshot", width: 32 },
    { header: "Grade", key: "grade", width: 10 },
    { header: "Level", key: "educationLevel", width: 10 },
    { header: "Phone Number", key: "phoneNumber", width: 16 },
    { header: "Visit Date", key: "visitDate", width: 14 },
    { header: "Registered By", key: "registeredByName", width: 18 },
    { header: "Registration Time", key: "time", width: 22 }
  ];

  regSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandNavy } };
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  registrations.forEach((reg) => {
    const regDate = new Date(reg.createdAt);
    regSheet.addRow({
      registrationNumber: reg.registrationNumber,
      studentName: reg.studentName,
      schoolNameSnapshot: reg.schoolNameSnapshot,
      grade: reg.grade,
      educationLevel: reg.educationLevel,
      phoneNumber: reg.phoneNumber || "N/A",
      visitDate: reg.visitDate,
      registeredByName: reg.registeredByName,
      time: regDate.toLocaleTimeString("en-GB", { hour12: true })
    });
  });

  // ----------------------------------------------------
  // Sheet 2: Summary
  // ----------------------------------------------------
  const sumSheet = workbook.addWorksheet("Summary");
  sumSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 25 }
  ];
  sumSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandNavy } };
    cell.font = headerFont;
  });

  sumSheet.addRows([
    { metric: "Event Name", value: stats.settings.eventName },
    { metric: "Event Subtitle", value: stats.settings.subtitle },
    { metric: "Total Registered Students", value: stats.totalStudents },
    { metric: "O/L Students (Grades 6–11)", value: `${stats.olStudents} (${stats.olPercentage}%)` },
    { metric: "A/L Students (Grades 12–13)", value: `${stats.alStudents} (${stats.alPercentage}%)` },
    { metric: "Total Visiting Schools", value: stats.activeSchoolsCount },
    { metric: "Peak Hour", value: stats.peakHour || "N/A" },
    { metric: "Day 1 Date", value: stats.settings.eventDay1Date },
    { metric: "Day 2 Date", value: stats.settings.eventDay2Date },
    { metric: "Report Generated At", value: new Date().toLocaleString() }
  ]);

  // ----------------------------------------------------
  // Sheet 3: School Statistics
  // ----------------------------------------------------
  const schSheet = workbook.addWorksheet("School Statistics", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  schSheet.columns = [
    { header: "School Name", key: "schoolName", width: 35 },
    { header: "Total Students", key: "total", width: 16 },
    { header: "O/L Students", key: "ol", width: 16 },
    { header: "A/L Students", key: "al", width: 16 }
  ];
  schSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandNavy } };
    cell.font = headerFont;
  });
  stats.schools.forEach((s) => {
    schSheet.addRow({
      schoolName: s.schoolName,
      total: s.total,
      ol: s.ol,
      al: s.al
    });
  });

  // ----------------------------------------------------
  // Sheet 4: Grade Statistics
  // ----------------------------------------------------
  const grdSheet = workbook.addWorksheet("Grade Statistics", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  grdSheet.columns = [
    { header: "Grade", key: "grade", width: 15 },
    { header: "Education Level", key: "level", width: 20 },
    { header: "Total Registered", key: "count", width: 20 }
  ];
  grdSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandNavy } };
    cell.font = headerFont;
  });
  stats.grades.forEach((g) => {
    grdSheet.addRow({
      grade: `Grade ${g.grade}`,
      level: g.educationLevel,
      count: g.count
    });
  });

  // ----------------------------------------------------
  // Sheet 5: Operator Statistics
  // ----------------------------------------------------
  const opSheet = workbook.addWorksheet("Operator Statistics", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  opSheet.columns = [
    { header: "Registration Desk / Operator", key: "operatorName", width: 30 },
    { header: "Total Registrations", key: "total", width: 20 },
    { header: "O/L Registrations", key: "ol", width: 20 },
    { header: "A/L Registrations", key: "al", width: 20 }
  ];
  opSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandNavy } };
    cell.font = headerFont;
  });
  stats.operators.forEach((op) => {
    opSheet.addRow({
      operatorName: op.operatorName,
      total: op.total,
      ol: op.ol,
      al: op.al
    });
  });

  return workbook;
};

const generateCSV = async (filterQuery = {}) => {
  const match = { deleted: false };
  if (filterQuery.schoolId) match.schoolId = filterQuery.schoolId;
  if (filterQuery.grade) match.grade = parseInt(filterQuery.grade, 10);
  if (filterQuery.educationLevel) match.educationLevel = filterQuery.educationLevel;
  if (filterQuery.registeredBy) match.registeredBy = filterQuery.registeredBy;
  if (filterQuery.visitDate) match.visitDate = filterQuery.visitDate;

  const registrations = await StudentRegistration.find(match)
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    "Registration ID",
    "Student Name",
    "School",
    "Grade",
    "Education Level",
    "Phone Number",
    "Visit Date",
    "Registered By",
    "Created Date",
    "Created Time"
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = headers.join(",") + "\r\n";

  registrations.forEach((r) => {
    const d = new Date(r.createdAt);
    const row = [
      escapeCSV(r.registrationNumber),
      escapeCSV(r.studentName),
      escapeCSV(r.schoolNameSnapshot),
      r.grade,
      escapeCSV(r.educationLevel),
      escapeCSV(r.phoneNumber || ""),
      escapeCSV(r.visitDate),
      escapeCSV(r.registeredByName),
      escapeCSV(d.toISOString().split("T")[0]),
      escapeCSV(d.toLocaleTimeString("en-GB", { hour12: true }))
    ];
    csvContent += row.join(",") + "\r\n";
  });

  return csvContent;
};

const generatePDF = async (filterQuery = {}) => {
  const stats = await getDashboardStats(filterQuery);
  const match = { deleted: false };
  if (filterQuery.schoolId) match.schoolId = filterQuery.schoolId;
  if (filterQuery.grade) match.grade = parseInt(filterQuery.grade, 10);
  if (filterQuery.educationLevel) match.educationLevel = filterQuery.educationLevel;
  if (filterQuery.registeredBy) match.registeredBy = filterQuery.registeredBy;
  if (filterQuery.dateFilter === "today") {
    match.visitDate = new Date().toISOString().split("T")[0];
  } else if (filterQuery.dateFilter === "day1") {
    match.visitDate = stats.settings.eventDay1Date;
  } else if (filterQuery.dateFilter === "day2") {
    match.visitDate = stats.settings.eventDay2Date;
  } else if (filterQuery.customDate) {
    match.visitDate = filterQuery.customDate;
  }

  const registrations = await StudentRegistration.find(match)
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const logoPath = path.join(__dirname, "../../client/public/assets/mindora-logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 35, { width: 110 });
    } catch (e) {
      // fallback if image reading issue
    }
  }

  // Header Title
  doc
    .fontSize(18)
    .fillColor("#1E224F")
    .text("MINDORA", 160, 40, { bold: true })
    .fontSize(10)
    .fillColor("#7CB342")
    .text("MICROBIOLOGY EXHIBITION", 160, 60, { bold: true })
    .fontSize(12)
    .fillColor("#333333")
    .text("OFFICIAL REGISTRATION & EVENT REPORT", 160, 75);

  doc
    .fontSize(8)
    .fillColor("#666666")
    .text(`Generated: ${new Date().toLocaleString()}`, 400, 45, { align: "right" })
    .text(`Filter: ${filterQuery.dateFilter || "All Days"}`, 400, 58, { align: "right" });

  doc.moveDown(3);
  doc.strokeColor("#1E224F").lineWidth(1.5).moveTo(40, 105).lineTo(555, 105).stroke();

  // Summary KPI Boxes
  const topY = 120;
  doc.rect(40, topY, 115, 55).fillAndStroke("#F1F5F9", "#CBD5E1");
  doc.fillColor("#1E224F").fontSize(9).text("TOTAL STUDENTS", 45, topY + 8);
  doc.fontSize(18).fillColor("#1E224F").text(String(stats.totalStudents), 45, topY + 24, { bold: true });

  doc.rect(170, topY, 115, 55).fillAndStroke("#F0FDF4", "#86EFAC");
  doc.fillColor("#15803D").fontSize(9).text("O/L STUDENTS", 175, topY + 8);
  doc.fontSize(18).fillColor("#15803D").text(`${stats.olStudents} (${stats.olPercentage}%)`, 175, topY + 24, { bold: true });

  doc.rect(300, topY, 115, 55).fillAndStroke("#EFF6FF", "#93C5FD");
  doc.fillColor("#1D4ED8").fontSize(9).text("A/L STUDENTS", 305, topY + 8);
  doc.fontSize(18).fillColor("#1D4ED8").text(`${stats.alStudents} (${stats.alPercentage}%)`, 305, topY + 24, { bold: true });

  doc.rect(430, topY, 125, 55).fillAndStroke("#F8FAFC", "#E2E8F0");
  doc.fillColor("#334155").fontSize(9).text("VISITING SCHOOLS", 435, topY + 8);
  doc.fontSize(18).fillColor("#334155").text(String(stats.activeSchoolsCount), 435, topY + 24, { bold: true });

  // Grade Breakdown Table
  let currentY = 195;
  doc.fillColor("#1E224F").fontSize(11).text("GRADE BREAKDOWN", 40, currentY, { bold: true });
  currentY += 16;

  doc.rect(40, currentY, 515, 20).fill("#1E224F");
  doc.fillColor("#FFFFFF").fontSize(9).text("Grade", 50, currentY + 5);
  doc.text("Level", 150, currentY + 5);
  doc.text("Registered Students", 300, currentY + 5);
  currentY += 20;

  stats.grades.forEach((g, idx) => {
    const bg = idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
    doc.rect(40, currentY, 515, 16).fill(bg);
    doc.fillColor("#1E293B").fontSize(8.5).text(`Grade ${g.grade}`, 50, currentY + 4);
    doc.text(g.educationLevel, 150, currentY + 4);
    doc.text(String(g.count), 300, currentY + 4);
    currentY += 16;
  });

  // Top Schools Section
  currentY += 15;
  doc.fillColor("#1E224F").fontSize(11).text("TOP VISITING SCHOOLS", 40, currentY, { bold: true });
  currentY += 16;

  doc.rect(40, currentY, 515, 20).fill("#1E224F");
  doc.fillColor("#FFFFFF").fontSize(9).text("School Name", 50, currentY + 5);
  doc.text("Total", 320, currentY + 5);
  doc.text("O/L", 390, currentY + 5);
  doc.text("A/L", 460, currentY + 5);
  currentY += 20;

  stats.schools.slice(0, 10).forEach((s, idx) => {
    const bg = idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
    doc.rect(40, currentY, 515, 16).fill(bg);
    doc.fillColor("#1E293B").fontSize(8.5).text(s.schoolName, 50, currentY + 4, { width: 250, ellipsis: true });
    doc.text(String(s.total), 320, currentY + 4);
    doc.text(String(s.ol), 390, currentY + 4);
    doc.text(String(s.al), 460, currentY + 4);
    currentY += 16;
  });

  // Footer note
  doc
    .fontSize(8)
    .fillColor("#94A3B8")
    .text("MINDORA Microbiology Exhibition System • Central Offline Server Record", 40, 780, { align: "center" });

  return doc;
};

module.exports = {
  generateExcel,
  generateCSV,
  generatePDF
};
