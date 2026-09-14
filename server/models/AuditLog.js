const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    userName: {
      type: String,
      default: "System"
    },
    userRole: {
      type: String,
      default: ""
    },
    targetId: {
      type: String,
      default: ""
    },
    targetType: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
