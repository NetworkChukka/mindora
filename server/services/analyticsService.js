const mongoose = require("mongoose");
const StudentRegistration = require("../models/StudentRegistration");
const School = require("../models/School");
const EventSettings = require("../models/EventSettings");

const buildDateFilter = (filter, customDate, customFrom, customTo, settings) => {
  const match = { deleted: false };
  const todayStr = new Date().toISOString().split("T")[0];

  const day1Date = (settings && settings.eventDay1Date) || "2026-09-14";
  const day2Date = (settings && settings.eventDay2Date) || "2026-09-15";

  if (!filter || filter === "all") {
    // all records
    return match;
  }

  if (filter === "today") {
    const activeDate = (settings && settings.activeEventDate) || todayStr;
    match.visitDate = { $in: [todayStr, activeDate] };
  } else if (filter === "day1") {
    match.visitDate = day1Date;
  } else if (filter === "day2") {
    match.visitDate = day2Date;
  } else if (filter === "custom" && customDate) {
    match.visitDate = customDate;
  } else if (filter === "range" && (customFrom || customTo)) {
    match.visitDate = {};
    if (customFrom) match.visitDate.$gte = customFrom;
    if (customTo) match.visitDate.$lte = customTo;
  }

  return match;
};

const getDashboardStats = async (filterQuery = {}) => {
  const settings = (await EventSettings.findOne()) || {};
  const baseMatch = buildDateFilter(
    filterQuery.dateFilter,
    filterQuery.customDate,
    filterQuery.customFrom,
    filterQuery.customTo,
    settings
  );

  const todayStr = new Date().toISOString().split("T")[0];

  // Parallel aggregations for speed
  const [
    countsSummary,
    gradeBreakdown,
    topSchools,
    operatorStats,
    hourlyStats,
    todayCount,
    totalSchoolsCount
  ] = await Promise.all([
    // 1. Overall totals matching current filter
    StudentRegistration.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          olStudents: {
            $sum: { $cond: [{ $eq: ["$educationLevel", "O/L"] }, 1, 0] }
          },
          alStudents: {
            $sum: { $cond: [{ $eq: ["$educationLevel", "A/L"] }, 1, 0] }
          },
          uniqueSchools: { $addToSet: "$schoolId" }
        }
      }
    ]),

    // 2. Breakdown by Grade (6-13)
    StudentRegistration.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // 3. Breakdown by School (with O/L and A/L counts)
    StudentRegistration.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$schoolId",
          schoolName: { $first: "$schoolNameSnapshot" },
          total: { $sum: 1 },
          ol: { $sum: { $cond: [{ $eq: ["$educationLevel", "O/L"] }, 1, 0] } },
          al: { $sum: { $cond: [{ $eq: ["$educationLevel", "A/L"] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 50 }
    ]),

    // 4. Operator Desk counts
    StudentRegistration.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$registeredBy",
          operatorName: { $first: "$registeredByName" },
          total: { $sum: 1 },
          ol: { $sum: { $cond: [{ $eq: ["$educationLevel", "O/L"] }, 1, 0] } },
          al: { $sum: { $cond: [{ $eq: ["$educationLevel", "A/L"] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]),

    // 5. Hourly registrations
    StudentRegistration.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%H:00", date: "$createdAt", timezone: "+05:30" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // 6. Today's registration count
    StudentRegistration.countDocuments({
      deleted: false,
      visitDate: { $in: [todayStr, (settings && settings.activeEventDate) || todayStr] }
    }),

    // 7. Total active schools registered in system
    School.countDocuments({ status: "active" })
  ]);

  const summary = countsSummary[0] || {
    totalStudents: 0,
    olStudents: 0,
    alStudents: 0,
    uniqueSchools: []
  };

  // Build grade map 6..13
  const grades = [6, 7, 8, 9, 10, 11, 12, 13].map((g) => {
    const found = gradeBreakdown.find((item) => item._id === g);
    return {
      grade: g,
      count: found ? found.count : 0,
      educationLevel: g <= 11 ? "O/L" : "A/L"
    };
  });

  // Calculate peak registration hour
  let peakHour = "N/A";
  let peakCount = 0;
  hourlyStats.forEach((h) => {
    if (h.count > peakCount) {
      peakCount = h.count;
      peakHour = h._id;
    }
  });

  return {
    totalStudents: summary.totalStudents,
    olStudents: summary.olStudents,
    alStudents: summary.alStudents,
    olPercentage: summary.totalStudents > 0 ? ((summary.olStudents / summary.totalStudents) * 100).toFixed(1) : "0.0",
    alPercentage: summary.totalStudents > 0 ? ((summary.alStudents / summary.totalStudents) * 100).toFixed(1) : "0.0",
    activeSchoolsCount: summary.uniqueSchools.length,
    totalSchoolsCount,
    todayRegistrations: todayCount,
    grades,
    schools: topSchools,
    operators: operatorStats,
    hourly: hourlyStats,
    peakHour,
    peakCount,
    settings: {
      eventName: settings.eventName || "MINDORA",
      subtitle: settings.subtitle || "MICROBIOLOGY EXHIBITION",
      eventDay1Date: settings.eventDay1Date || "2026-09-14",
      eventDay2Date: settings.eventDay2Date || "2026-09-15",
      activeEventDate: settings.activeEventDate || "2026-09-14"
    }
  };
};

const getTwoDaySummary = async () => {
  const settings = (await EventSettings.findOne()) || {};
  const day1Date = settings.eventDay1Date || "2026-09-14";
  const day2Date = settings.eventDay2Date || "2026-09-15";

  const [day1Stats, day2Stats, overallStats] = await Promise.all([
    getDashboardStats({ dateFilter: "day1" }),
    getDashboardStats({ dateFilter: "day2" }),
    getDashboardStats({ dateFilter: "all" })
  ]);

  return {
    day1: {
      date: day1Date,
      totalStudents: day1Stats.totalStudents,
      olStudents: day1Stats.olStudents,
      alStudents: day1Stats.alStudents,
      schoolsCount: day1Stats.activeSchoolsCount
    },
    day2: {
      date: day2Date,
      totalStudents: day2Stats.totalStudents,
      olStudents: day2Stats.olStudents,
      alStudents: day2Stats.alStudents,
      schoolsCount: day2Stats.activeSchoolsCount
    },
    combined: {
      totalStudents: overallStats.totalStudents,
      olStudents: overallStats.olStudents,
      alStudents: overallStats.alStudents,
      schoolsCount: overallStats.activeSchoolsCount
    }
  };
};

module.exports = {
  getDashboardStats,
  getTwoDaySummary,
  buildDateFilter
};
