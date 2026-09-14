const { createBackup, listBackups, restoreBackup } = require("../services/backupService");
const { logAudit } = require("../utils/auditLogger");

const getBackups = async (req, res) => {
  try {
    const backups = await listBackups();
    return res.json({ success: true, data: backups });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const makeBackup = async (req, res) => {
  try {
    const { label } = req.body;
    const backup = await createBackup(label || "manual");

    await logAudit({
      action: "ADMIN_CREATED_BACKUP",
      user: req.user,
      description: `Created database backup: ${backup.filename} (${(backup.sizeBytes / 1024).toFixed(1)} KB)`,
      metadata: { filename: backup.filename, size: backup.sizeBytes, counts: backup.counts },
      req
    });

    return res.status(201).json({
      success: true,
      message: "Database backup created successfully",
      data: backup
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const restore = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: "Backup filename is required" });
    }

    const result = await restoreBackup(filename);

    await logAudit({
      action: "ADMIN_RESTORED_BACKUP",
      user: req.user,
      description: `Restored database from ${filename}. Safety backup created: ${result.safetyBackup}`,
      metadata: { restoredFile: filename, safetyBackup: result.safetyBackup, restoredCounts: result.restoredCounts },
      req
    });

    return res.json({
      success: true,
      message: "Database restored successfully",
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBackups,
  makeBackup,
  restore
};
