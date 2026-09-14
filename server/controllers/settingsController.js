const EventSettings = require("../models/EventSettings");
const { logAudit } = require("../utils/auditLogger");

const getSettings = async (req, res) => {
  try {
    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = await EventSettings.create({
        eventName: "MINDORA",
        subtitle: "MICROBIOLOGY EXHIBITION",
        eventDay1Date: "2026-09-14",
        eventDay2Date: "2026-09-15",
        activeEventDate: "2026-09-14",
        venue: "Faculty of Science, University",
        registrationPrefix: "MIN",
        allowedGrades: [6, 7, 8, 9, 10, 11, 12, 13],
        duplicateDetection: true,
        eventDayMode: false
      });
    }

    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const {
      eventName,
      subtitle,
      eventDay1Date,
      eventDay2Date,
      activeEventDate,
      venue,
      registrationPrefix,
      allowedGrades,
      duplicateDetection,
      eventDayMode
    } = req.body;

    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = new EventSettings({});
    }

    if (eventName) settings.eventName = eventName.trim();
    if (subtitle) settings.subtitle = subtitle.trim();
    if (eventDay1Date) settings.eventDay1Date = eventDay1Date;
    if (eventDay2Date) settings.eventDay2Date = eventDay2Date;
    if (activeEventDate) settings.activeEventDate = activeEventDate;
    if (venue) settings.venue = venue.trim();
    if (registrationPrefix) settings.registrationPrefix = registrationPrefix.trim().toUpperCase();
    if (Array.isArray(allowedGrades)) settings.allowedGrades = allowedGrades;
    if (duplicateDetection !== undefined) settings.duplicateDetection = Boolean(duplicateDetection);
    if (eventDayMode !== undefined) settings.eventDayMode = Boolean(eventDayMode);

    await settings.save();

    await logAudit({
      action: "ADMIN_UPDATED_SETTINGS",
      user: req.user,
      description: "Updated system & event settings",
      metadata: req.body,
      req
    });

    return res.json({
      success: true,
      message: "Event settings updated successfully",
      data: settings
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
