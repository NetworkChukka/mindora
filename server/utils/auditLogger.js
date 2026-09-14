const AuditLog = require("../models/AuditLog");

const logAudit = async ({
  action,
  user,
  targetId = "",
  targetType = "",
  description,
  metadata = {},
  req = null
}) => {
  try {
    const ipAddress = req
      ? req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""
      : "";

    await AuditLog.create({
      action,
      userId: user ? user._id : null,
      userName: user ? user.fullName || user.username : "System",
      userRole: user ? user.role : "system",
      targetId: String(targetId),
      targetType,
      description,
      metadata,
      ipAddress
    });
  } catch (err) {
    console.error("[AuditLog] Failed to record log:", err.message);
  }
};

module.exports = { logAudit };
