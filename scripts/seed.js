require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../server/models/User");
const School = require("../server/models/School");
const StudentRegistration = require("../server/models/StudentRegistration");
const Counter = require("../server/models/Counter");
const EventSettings = require("../server/models/EventSettings");
const AuditLog = require("../server/models/AuditLog");
const { normalizeSchoolName } = require("../server/services/schoolService");
const { calculateEducationLevel } = require("../server/config/constants");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mindora";
    console.log(`[Seed] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log("[Seed] Clearing old database records...");
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
      StudentRegistration.deleteMany({}),
      Counter.deleteMany({}),
      EventSettings.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log("[Seed] Creating Event Settings...");
    const settings = await EventSettings.create({
      eventName: "MINDORA",
      subtitle: "MICROBIOLOGY EXHIBITION",
      eventDay1Date: "2026-09-14",
      eventDay2Date: "2026-09-15",
      activeEventDate: "2026-09-14",
      venue: "Main Science Complex, University",
      registrationPrefix: "MIN",
      allowedGrades: [6, 7, 8, 9, 10, 11, 12, 13],
      duplicateDetection: true,
      eventDayMode: false
    });

    console.log("[Seed] Creating Users...");
    const adminPass = await User.hashPassword("admin123");
    const deskPass = await User.hashPassword("desk123");
    const viewPass = await User.hashPassword("view123");

    const admin = await User.create({
      fullName: "Exhibition Administrator",
      username: "admin",
      passwordHash: adminPass,
      role: "admin",
      status: "active"
    });

    const desk01 = await User.create({
      fullName: "Desk 01",
      username: "desk01",
      passwordHash: deskPass,
      role: "operator",
      status: "active"
    });

    const desk02 = await User.create({
      fullName: "Desk 02",
      username: "desk02",
      passwordHash: deskPass,
      role: "operator",
      status: "active"
    });

    const desk03 = await User.create({
      fullName: "Desk 03",
      username: "desk03",
      passwordHash: deskPass,
      role: "operator",
      status: "active"
    });

    const viewer = await User.create({
      fullName: "Exhibition Viewer",
      username: "viewer",
      passwordHash: viewPass,
      role: "viewer",
      status: "active"
    });

    console.log("[Seed] Creating initial Schools...");
    const initialSchools = [
      { name: "Royal College", city: "Colombo 07", district: "Colombo", code: "RC-01" },
      { name: "Ananda College", city: "Colombo 10", district: "Colombo", code: "AC-01" },
      { name: "Nalanda College", city: "Colombo 10", district: "Colombo", code: "NC-01" },
      { name: "Visakha Vidyalaya", city: "Colombo 04", district: "Colombo", code: "VV-01" },
      { name: "Devi Balika Vidyalaya", city: "Colombo 08", district: "Colombo", code: "DBV-01" },
      { name: "D.S. Senanayake College", city: "Colombo 07", district: "Colombo", code: "DSS-01" },
      { name: "Mahanama College", city: "Colombo 03", district: "Colombo", code: "MC-01" },
      { name: "St. Joseph's College", city: "Colombo 10", district: "Colombo", code: "SJC-01" },
      { name: "Sirimavo Bandaranaike Vidyalaya", city: "Colombo 07", district: "Colombo", code: "SBV-01" },
      { name: "Anula Vidyalaya", city: "Nugegoda", district: "Colombo", code: "AV-01" },
      { name: "Dharmaraja College", city: "Kandy", district: "Kandy", code: "DC-01" },
      { name: "Kingswood College", city: "Kandy", district: "Kandy", code: "KC-01" },
      { name: "Mahinda College", city: "Galle", district: "Galle", code: "MC-02" },
      { name: "Richmond College", city: "Galle", district: "Galle", code: "RC-02" },
      { name: "Maliyadeva College", city: "Kurunegala", district: "Kurunegala", code: "MC-03" }
    ];

    const createdSchools = [];
    for (const s of initialSchools) {
      const sch = await School.create({
        schoolName: s.name,
        normalizedName: normalizeSchoolName(s.name),
        schoolCode: s.code,
        city: s.city,
        district: s.district,
        status: "active",
        createdBy: admin._id,
        createdByName: admin.fullName
      });
      createdSchools.push(sch);
    }

    console.log("[Seed] Creating sample Student Registrations for Day 1 and Day 2...");
    const operators = [desk01, desk02, desk03];
    const sampleFirstNames = ["Kasun", "Nimal", "Sanduni", "Chamari", "Nuwan", "Ishara", "Tharindu", "Dinuka", "Sachini", "Dilshan", "Hiruni", "Kavindu", "Rashmi", "Lahiru", "Chathura", "Anuki", "Malith", "Janith", "Pubudu", "Sithum"];
    const sampleLastNames = ["Perera", "Silva", "Fernando", "Jayasinghe", "Bandara", "Wickramasinghe", "Gunasekara", "Dissanayake", "Herath", "Karunaratne", "Senanayake", "Rajapaksha", "Mendis", "Alwis", "Abeyrathna"];

    let regSeq = 0;
    const registrations = [];

    // Create 35 sample registrations for Day 1
    for (let i = 0; i < 35; i++) {
      regSeq++;
      const op = operators[i % operators.length];
      const sch = createdSchools[i % createdSchools.length];
      const fn = sampleFirstNames[i % sampleFirstNames.length];
      const ln = sampleLastNames[(i * 3) % sampleLastNames.length];
      const grade = 6 + (i % 8); // grades 6 to 13
      const educationLevel = calculateEducationLevel(grade);
      const regNo = `MIN-${String(regSeq).padStart(6, "0")}`;

      registrations.push({
        registrationNumber: regNo,
        studentName: `${fn} ${ln}`,
        schoolId: sch._id,
        schoolNameSnapshot: sch.schoolName,
        grade,
        educationLevel,
        phoneNumber: i % 3 === 0 ? `077${Math.floor(1000000 + Math.random() * 9000000)}` : "",
        visitDate: "2026-09-14", // Day 1
        registeredBy: op._id,
        registeredByName: op.fullName,
        deviceIdentifier: `Device-${op.username}`,
        deleted: false,
        createdAt: new Date(new Date("2026-09-14T08:30:00+05:30").getTime() + i * 12 * 60000)
      });
    }

    // Create 20 sample registrations for Day 2
    for (let i = 0; i < 20; i++) {
      regSeq++;
      const op = operators[(i + 1) % operators.length];
      const sch = createdSchools[(i + 4) % createdSchools.length];
      const fn = sampleFirstNames[(i + 5) % sampleFirstNames.length];
      const ln = sampleLastNames[(i + 7) % sampleLastNames.length];
      const grade = 6 + ((i + 2) % 8);
      const educationLevel = calculateEducationLevel(grade);
      const regNo = `MIN-${String(regSeq).padStart(6, "0")}`;

      registrations.push({
        registrationNumber: regNo,
        studentName: `${fn} ${ln}`,
        schoolId: sch._id,
        schoolNameSnapshot: sch.schoolName,
        grade,
        educationLevel,
        phoneNumber: i % 2 === 0 ? `071${Math.floor(1000000 + Math.random() * 9000000)}` : "",
        visitDate: "2026-09-15", // Day 2
        registeredBy: op._id,
        registeredByName: op.fullName,
        deviceIdentifier: `Device-${op.username}`,
        deleted: false,
        createdAt: new Date(new Date("2026-09-15T09:00:00+05:30").getTime() + i * 15 * 60000)
      });
    }

    await StudentRegistration.insertMany(registrations);

    // Initialize sequence counter
    await Counter.create({
      _id: "student_registration",
      seq: regSeq
    });

    console.log("\n============================================================");
    console.log("   MINDORA SEED COMPLETED SUCCESSFULLY");
    console.log("============================================================");
    console.log(`   Admin User:     admin / admin123`);
    console.log(`   Operator 1:     desk01 / desk123`);
    console.log(`   Operator 2:     desk02 / desk123`);
    console.log(`   Operator 3:     desk03 / desk123`);
    console.log(`   Viewer:         viewer / view123`);
    console.log(`   Schools Seeded: ${createdSchools.length}`);
    console.log(`   Registrations:  ${registrations.length} (Day 1: 35, Day 2: 20)`);
    console.log("============================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]:", error);
    process.exit(1);
  }
};

seedDatabase();
