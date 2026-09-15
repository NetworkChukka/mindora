const mongoose = require("mongoose");

const teacherRegistrationSchema = new mongoose.Schema(
  {
    teacherRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },
    schoolNameSnapshot: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    visitDate: {
      type: String, // YYYY-MM-DD format for fast grouping and filtering by day
      required: true,
      index: true
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    registeredByName: {
      type: String,
      required: true
    },
    deviceIdentifier: {
      type: String,
      default: ""
    },
    remarks: {
      type: String,
      default: ""
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

teacherRegistrationSchema.index({ teacherName: "text", schoolNameSnapshot: "text" });

module.exports = mongoose.model("TeacherRegistration", teacherRegistrationSchema);
