const mongoose = require("mongoose");

const eventSettingsSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      default: "MINDORA"
    },
    subtitle: {
      type: String,
      default: "MICROBIOLOGY EXHIBITION"
    },
    eventDay1Date: {
      type: String,
      default: "2026-09-14"
    },
    eventDay2Date: {
      type: String,
      default: "2026-09-15"
    },
    activeEventDate: {
      type: String,
      default: "2026-09-14"
    },
    venue: {
      type: String,
      default: "Faculty of Science, University"
    },
    registrationPrefix: {
      type: String,
      default: "MIN"
    },
    allowedGrades: {
      type: [Number],
      default: [6, 7, 8, 9, 10, 11, 12, 13]
    },
    duplicateDetection: {
      type: Boolean,
      default: true
    },
    eventDayMode: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventSettings", eventSettingsSchema);
