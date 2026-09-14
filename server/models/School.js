const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    schoolCode: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    district: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdByName: {
      type: String,
      default: "System"
    }
  },
  { timestamps: true }
);

schoolSchema.index({ schoolName: "text", city: "text", district: "text" });

module.exports = mongoose.model("School", schoolSchema);
