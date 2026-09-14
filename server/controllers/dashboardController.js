const { getDashboardStats, getTwoDaySummary } = require("../services/analyticsService");

const getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getGrades = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({ success: true, data: stats.grades });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSchools = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({ success: true, data: stats.schools });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getOperators = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({ success: true, data: stats.operators });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getHourly = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({ success: true, data: stats.hourly });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getTwoDay = async (req, res) => {
  try {
    const summary = await getTwoDaySummary();
    return res.json({ success: true, data: summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Public non-sensitive aggregate for /display
const getPublicDisplayStats = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query);
    return res.json({
      success: true,
      data: {
        totalStudents: stats.totalStudents,
        olStudents: stats.olStudents,
        alStudents: stats.alStudents,
        olPercentage: stats.olPercentage,
        alPercentage: stats.alPercentage,
        activeSchoolsCount: stats.activeSchoolsCount,
        grades: stats.grades,
        settings: stats.settings,
        lastUpdated: new Date().toLocaleTimeString("en-GB", { hour12: true })
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getGrades,
  getSchools,
  getOperators,
  getHourly,
  getTwoDay,
  getPublicDisplayStats
};
