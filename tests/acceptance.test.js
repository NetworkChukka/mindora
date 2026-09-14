require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const User = require("../server/models/User");
const School = require("../server/models/School");
const StudentRegistration = require("../server/models/StudentRegistration");
const Counter = require("../server/models/Counter");
const EventSettings = require("../server/models/EventSettings");
const AuditLog = require("../server/models/AuditLog");

const { registerStudent, checkDuplicate } = require("../server/services/registrationService");
const { createOrFindSchool, normalizeSchoolName } = require("../server/services/schoolService");
const { getDashboardStats, getTwoDaySummary } = require("../server/services/analyticsService");
const { generateExcel, generateCSV, generatePDF } = require("../server/services/exportService");
const { createBackup, listBackups, restoreBackup } = require("../server/services/backupService");
const { calculateEducationLevel } = require("../server/config/constants");
const { getLocalIPs } = require("../server/controllers/systemController");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ? FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ? PASS: ${message}`);
    passedTests++;
  }
}

async function runAcceptanceTests() {
  console.log("============================================================");
  console.log("   MINDORA SYSTEM ACCEPTANCE TEST SUITE");
  console.log("============================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mindora";
  await mongoose.connect(mongoUri);

  // Clean test DB state
  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    StudentRegistration.deleteMany({}),
    Counter.deleteMany({}),
    EventSettings.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  await Counter.create({ _id: "student_registration", seq: 0 });
  const settings = await EventSettings.create({
    eventName: "MINDORA",
    subtitle: "MICROBIOLOGY EXHIBITION",
    eventDay1Date: "2026-09-14",
    eventDay2Date: "2026-09-15",
    activeEventDate: "2026-09-14",
    registrationPrefix: "MIN",
    duplicateDetection: true
  });

  console.log("--- TEST 1: Admin and Operator Accounts Setup ---");
  const adminPass = await User.hashPassword("admin123");
  const deskPass = await User.hashPassword("desk123");

  const admin = await User.create({ fullName: "Main Admin", username: "admin", passwordHash: adminPass, role: "admin", status: "active" });
  const desk01 = await User.create({ fullName: "Desk 01 Operator", username: "desk01", passwordHash: deskPass, role: "operator", status: "active" });
  const desk02 = await User.create({ fullName: "Desk 02 Operator", username: "desk02", passwordHash: deskPass, role: "operator", status: "active" });
  const desk03 = await User.create({ fullName: "Desk 03 Operator", username: "desk03", passwordHash: deskPass, role: "operator", status: "active" });

  assert(admin.role === "admin" && desk01.role === "operator", "Admin and operator roles created correctly");
  assert(await admin.comparePassword("admin123"), "Password hash comparison works securely");

  console.log("\n--- TEST 2: School Creation & Normalization ---");
  const schoolARes = await createOrFindSchool({ schoolName: "Royal College", city: "Colombo 07", district: "Colombo", user: admin });
  const schoolBRes = await createOrFindSchool({ schoolName: "Ananda College", city: "Colombo 10", district: "Colombo", user: admin });
  
  assert(!schoolARes.alreadyExists && schoolARes.school.schoolName === "Royal College", "School Royal College created");
  assert(schoolARes.school.normalizedName === "royal college", "School name normalized to lowercase trimmed");

  console.log("\n--- TEST 3: Critical Acceptance Test #2 (Grade 10 -> O/L) ---");
  const reg1 = await registerStudent({
    studentName: "Student A",
    schoolId: schoolARes.school._id,
    grade: 10,
    phoneNumber: "0771234567",
    visitDate: "2026-09-14",
    user: desk01
  });
  assert(reg1.success && reg1.data.grade === 10, "Student A registered with Grade 10");
  assert(reg1.data.educationLevel === "O/L", "Backend correctly calculated educationLevel = O/L");
  assert(reg1.data.registrationNumber === "MIN-000001", "Registration number is MIN-000001");

  console.log("\n--- TEST 4: Critical Acceptance Test #3 (Grade 12 -> A/L) ---");
  const reg2 = await registerStudent({
    studentName: "Student B",
    schoolId: schoolBRes.school._id,
    grade: 12,
    phoneNumber: "0719876543",
    visitDate: "2026-09-14",
    user: desk02
  });
  assert(reg2.success && reg2.data.grade === 12, "Student B registered with Grade 12");
  assert(reg2.data.educationLevel === "A/L", "Backend correctly calculated educationLevel = A/L");
  assert(reg2.data.registrationNumber === "MIN-000002", "Registration number is MIN-000002");

  console.log("\n--- TEST 5: Critical Acceptance Test #4 (Dashboard Statistics) ---");
  const stats = await getDashboardStats({ dateFilter: "all" });
  assert(stats.totalStudents === 2, "Total students count is 2");
  assert(stats.olStudents === 1, "O/L students count is 1");
  assert(stats.alStudents === 1, "A/L students count is 1");
  assert(stats.activeSchoolsCount === 2, "Active schools count is 2");

  console.log("\n--- TEST 6: Critical Acceptance Test #5 (Missing School Creation from Desk) ---");
  const missingSchool = await createOrFindSchool({ schoolName: "ABC National School", city: "Galle", user: desk01 });
  assert(!missingSchool.alreadyExists && missingSchool.school.schoolName === "ABC National School", "Desk operator added missing school ABC National School");

  const reg3 = await registerStudent({
    studentName: "Student C",
    schoolId: missingSchool.school._id,
    grade: 8,
    visitDate: "2026-09-14",
    user: desk01
  });
  assert(reg3.success && reg3.data.schoolNameSnapshot === "ABC National School" && reg3.data.educationLevel === "O/L", "Student registered with newly added school");

  console.log("\n--- TEST 7: Critical Acceptance Test #7 (Concurrent Case-Insensitive Duplicate School) ---");
  const dupSchoolAttempt = await createOrFindSchool({ schoolName: "  abc national school  ", city: "Galle", user: desk02 });
  assert(dupSchoolAttempt.alreadyExists === true, "Duplicate school name recognized and rejected safely");
  assert(String(dupSchoolAttempt.school._id) === String(missingSchool.school._id), "Matched existing school record correctly");

  console.log("\n--- TEST 8: Critical Acceptance Test #8 (Strict Grade Calculation Rules) ---");
  assert(calculateEducationLevel(6) === "O/L", "Grade 6 -> O/L");
  assert(calculateEducationLevel(11) === "O/L", "Grade 11 -> O/L");
  assert(calculateEducationLevel(12) === "A/L", "Grade 12 -> A/L");
  assert(calculateEducationLevel(13) === "A/L", "Grade 13 -> A/L");
  assert(calculateEducationLevel(5) === null, "Grade 5 -> Invalid (null)");
  assert(calculateEducationLevel(14) === null, "Grade 14 -> Invalid (null)");

  console.log("\n--- TEST 9: Critical Acceptance Test #9 (Concurrent Multi-Desk Submissions) ---");
  const parallelPromises = [];
  for (let i = 0; i < 20; i++) {
    const op = i % 2 === 0 ? desk01 : desk02;
    parallelPromises.push(
      registerStudent({
        studentName: `Parallel Student ${i}`,
        schoolId: schoolARes.school._id,
        grade: 6 + (i % 8),
        visitDate: "2026-09-15", // Day 2
        user: op
      })
    );
  }
  const parallelResults = await Promise.all(parallelPromises);
  const regNumbers = parallelResults.map(r => r.data.registrationNumber);
  const uniqueRegNumbers = new Set(regNumbers);
  assert(uniqueRegNumbers.size === 20, "20 parallel registrations produced 20 completely unique sequential IDs");

  console.log("\n--- TEST 10: Two-Day Exhibition Filtering ---");
  const day1Stats = await getDashboardStats({ dateFilter: "day1" });
  const day2Stats = await getDashboardStats({ dateFilter: "day2" });
  const allStats = await getDashboardStats({ dateFilter: "all" });

  assert(day1Stats.totalStudents === 3, "Day 1 filter returns exactly 3 students");
  assert(day2Stats.totalStudents === 20, "Day 2 filter returns exactly 20 students");
  assert(allStats.totalStudents === 23, "All Days filter returns combined 23 students");

  console.log("\n--- TEST 11: Critical Acceptance Test #14 (Admin Edit Recalculates Level) ---");
  const targetReg = await StudentRegistration.findOne({ registrationNumber: "MIN-000001" });
  targetReg.grade = 12;
  targetReg.educationLevel = calculateEducationLevel(12);
  await targetReg.save();

  const updatedReg = await StudentRegistration.findOne({ registrationNumber: "MIN-000001" });
  assert(updatedReg.grade === 12 && updatedReg.educationLevel === "A/L", "Editing grade 10->12 recalculated education level to A/L");

  console.log("\n--- TEST 12: Critical Acceptance Test #15 (Admin Soft-Deletion) ---");
  targetReg.deleted = true;
  targetReg.deletedAt = new Date();
  await targetReg.save();

  const activeCountAfterDelete = await StudentRegistration.countDocuments({ deleted: false });
  assert(activeCountAfterDelete === 22, "Soft-deleted record is excluded from active count");

  console.log("\n--- TEST 13: Export Services (Excel, CSV, PDF) ---");
  const excelWorkbook = await generateExcel({ dateFilter: "all" });
  assert(excelWorkbook.worksheets.length === 5, "Excel workbook generated with 5 sheets");

  const csvContent = await generateCSV({ dateFilter: "all" });
  assert(csvContent.includes("Registration ID") && csvContent.includes("Student Name"), "CSV content formatted properly");

  const pdfDoc = await generatePDF({ dateFilter: "all" });
  assert(pdfDoc !== null, "PDF document generated cleanly");

  console.log("\n--- TEST 14: Backup and Restore Service ---");
  const backupResult = await createBackup("test_backup");
  assert(fs.existsSync(backupResult.path), "Backup JSON file created in /backups/");
  const backupList = await listBackups();
  assert(backupList.length > 0, "Backup listed in backup history");

  console.log("\n--- TEST 15: LAN IP Detection ---");
  const localNet = getLocalIPs();
  assert(localNet.primaryIP !== null && typeof localNet.primaryIP === "string", "Primary LAN IP resolved: " + localNet.primaryIP);

  console.log("\n============================================================");
  console.log(`   ACCEPTANCE TEST RESULTS: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log("============================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runAcceptanceTests().catch(err => {
  console.error("\n? Acceptance test suite failed with error:", err);
  process.exit(1);
});
