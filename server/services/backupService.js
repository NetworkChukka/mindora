const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const School = require("../models/School");
const StudentRegistration = require("../models/StudentRegistration");
const Counter = require("../models/Counter");
const AuditLog = require("../models/AuditLog");
const EventSettings = require("../models/EventSettings");

const BACKUP_DIR = path.join(__dirname, "../../backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const createBackup = async (label = "manual") => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `mindora_backup_${label}_${timestamp}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  const [users, schools, registrations, counters, auditLogs, settings] = await Promise.all([
    User.find().lean(),
    School.find().lean(),
    StudentRegistration.find().lean(),
    Counter.find().lean(),
    AuditLog.find().lean(),
    EventSettings.find().lean()
  ]);

  const backupData = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    label,
    counts: {
      users: users.length,
      schools: schools.length,
      registrations: registrations.length,
      auditLogs: auditLogs.length
    },
    data: {
      users,
      schools,
      registrations,
      counters,
      auditLogs,
      settings
    }
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf8");

  const stat = fs.statSync(backupFilePath);

  return {
    filename: backupFileName,
    path: backupFilePath,
    sizeBytes: stat.size,
    counts: backupData.counts,
    createdAt: backupData.createdAt
  };
};

const listBackups = async () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));
  const backups = [];

  for (const file of files) {
    try {
      const fullPath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(fullPath);
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = JSON.parse(raw);

      backups.push({
        filename: file,
        sizeBytes: stat.size,
        createdAt: parsed.createdAt || stat.birthtime,
        counts: parsed.counts || {},
        label: parsed.label || "backup"
      });
    } catch (e) {
      // skip corrupted file
    }
  }

  backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return backups;
};

const restoreBackup = async (filename) => {
  const backupFilePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(backupFilePath)) {
    throw new Error("Backup file does not exist");
  }

  // 1. Create a safety backup first
  const safetyBackup = await createBackup("pre_restore_safety");

  // 2. Read and parse restore file
  const raw = fs.readFileSync(backupFilePath, "utf8");
  const backupData = JSON.parse(raw);

  if (!backupData.data) {
    throw new Error("Invalid backup file structure");
  }

  const { users, schools, registrations, counters, auditLogs, settings } = backupData.data;

  // 3. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    StudentRegistration.deleteMany({}),
    Counter.deleteMany({}),
    AuditLog.deleteMany({}),
    EventSettings.deleteMany({})
  ]);

  // 4. Restore collections
  if (users && users.length > 0) await User.insertMany(users);
  if (schools && schools.length > 0) await School.insertMany(schools);
  if (registrations && registrations.length > 0) await StudentRegistration.insertMany(registrations);
  if (counters && counters.length > 0) await Counter.insertMany(counters);
  if (auditLogs && auditLogs.length > 0) await AuditLog.insertMany(auditLogs);
  if (settings && settings.length > 0) await EventSettings.insertMany(settings);

  return {
    success: true,
    safetyBackup: safetyBackup.filename,
    restoredCounts: {
      users: users ? users.length : 0,
      schools: schools ? schools.length : 0,
      registrations: registrations ? registrations.length : 0
    }
  };
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup
};
