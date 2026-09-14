const StudentRegistration = require("../models/StudentRegistration");
const School = require("../models/School");
const { registerStudent, checkDuplicate, validatePhoneNumber } = require("../services/registrationService");
const { calculateEducationLevel } = require("../config/constants");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");

const create = async (req, res) => {
  try {
    const {
      studentName,
      schoolId,
      grade,
      phoneNumber,
      visitDate,
      deviceIdentifier,
      remarks,
      bypassDuplicate
    } = req.body;

    const result = await registerStudent({
      studentName,
      schoolId,
      grade,
      phoneNumber,
      visitDate,
      user: req.user,
      deviceIdentifier,
      remarks,
      bypassDuplicate: Boolean(bypassDuplicate),
      req
    });

    if (result.isDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: "Possible duplicate student detected",
        data: result.existingStudent
      });
    }

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: result.data
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const checkDuplicateStudent = async (req, res) => {
  try {
    const { studentName, schoolId, grade } = req.query;
    const result = await checkDuplicate({ studentName, schoolId, grade });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      grade,
      educationLevel,
      schoolId,
      registeredBy,
      dateFilter,
      customDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = "false"
    } = req.query;

    const match = {
      deleted: includeDeleted === "true" ? { $in: [true, false] } : false
    };

    if (search && search.trim() !== "") {
      const q = search.trim();
      const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      match.$or = [
        { registrationNumber: regex },
        { studentName: regex },
        { schoolNameSnapshot: regex },
        { phoneNumber: regex }
      ];
    }

    if (grade) match.grade = parseInt(grade, 10);
    if (educationLevel) match.educationLevel = educationLevel;
    if (schoolId) match.schoolId = schoolId;
    if (registeredBy) match.registeredBy = registeredBy;

    if (dateFilter === "today") {
      match.visitDate = new Date().toISOString().split("T")[0];
    } else if (customDate) {
      match.visitDate = customDate;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [total, items] = await Promise.all([
      StudentRegistration.countDocuments(match),
      StudentRegistration.find(match)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate("schoolId", "schoolName city district")
        .populate("registeredBy", "fullName username role")
        .lean()
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const registration = await StudentRegistration.findById(req.params.id)
      .populate("schoolId")
      .populate("registeredBy", "fullName username");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration record not found" });
    }

    return res.json({ success: true, data: registration });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, schoolId, grade, phoneNumber, visitDate, remarks } = req.body;

    const registration = await StudentRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration record not found" });
    }

    const previousData = {
      studentName: registration.studentName,
      grade: registration.grade,
      educationLevel: registration.educationLevel,
      schoolName: registration.schoolNameSnapshot
    };

    if (studentName) registration.studentName = studentName.trim();

    if (schoolId && String(schoolId) !== String(registration.schoolId)) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(400).json({ success: false, message: "School not found" });
      }
      registration.schoolId = school._id;
      registration.schoolNameSnapshot = school.schoolName;
    }

    if (grade !== undefined) {
      const numGrade = parseInt(grade, 10);
      if (isNaN(numGrade) || numGrade < 6 || numGrade > 13) {
        return res.status(400).json({ success: false, message: "Grade must be between 6 and 13" });
      }
      registration.grade = numGrade;
      // Recalculate Education Level
      registration.educationLevel = calculateEducationLevel(numGrade);
    }

    if (phoneNumber !== undefined) {
      const phoneCheck = validatePhoneNumber(phoneNumber);
      if (!phoneCheck.valid) {
        return res.status(400).json({ success: false, message: phoneCheck.message });
      }
      registration.phoneNumber = phoneCheck.sanitized;
    }

    if (visitDate) registration.visitDate = visitDate;
    if (remarks !== undefined) registration.remarks = remarks;

    await registration.save();

    broadcast("student:updated", {
      id: registration._id,
      registrationNumber: registration.registrationNumber,
      studentName: registration.studentName,
      schoolName: registration.schoolNameSnapshot,
      grade: registration.grade,
      educationLevel: registration.educationLevel,
      visitDate: registration.visitDate
    });

    await logAudit({
      action: "ADMIN_EDITED_REGISTRATION",
      user: req.user,
      targetId: registration._id,
      targetType: "StudentRegistration",
      description: `Edited registration ${registration.registrationNumber} (${registration.studentName}): Grade ${previousData.grade} (${previousData.educationLevel}) -> Grade ${registration.grade} (${registration.educationLevel})`,
      metadata: { previous: previousData, updated: { grade: registration.grade, educationLevel: registration.educationLevel } },
      req
    });

    return res.json({
      success: true,
      message: "Registration updated successfully",
      data: registration
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await StudentRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration record not found" });
    }

    registration.deleted = true;
    registration.deletedAt = new Date();
    registration.deletedBy = req.user._id;
    await registration.save();

    broadcast("student:deleted", {
      id: registration._id,
      registrationNumber: registration.registrationNumber
    });

    await logAudit({
      action: "ADMIN_DELETED_REGISTRATION",
      user: req.user,
      targetId: registration._id,
      targetType: "StudentRegistration",
      description: `Soft-deleted registration ${registration.registrationNumber} for ${registration.studentName}`,
      metadata: { registrationNumber: registration.registrationNumber },
      req
    });

    return res.json({
      success: true,
      message: `Registration ${registration.registrationNumber} deleted successfully`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRecent = async (req, res) => {
  try {
    const EventSettings = require("../models/EventSettings");
    const settings = (await EventSettings.findOne()) || {};
    const todayStr = new Date().toISOString().split("T")[0];
    const activeDate = settings.activeEventDate || todayStr;
    const dateMatch = { $in: [todayStr, activeDate] };

    const isOperator = req.user.role === "operator";

    const query = { deleted: false };
    if (isOperator) {
      query.registeredBy = req.user._id;
    }

    const [recentList, todayCount, todayOlCount, todayAlCount, myTodayCount] = await Promise.all([
      StudentRegistration.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      StudentRegistration.countDocuments({ deleted: false, visitDate: dateMatch }),
      StudentRegistration.countDocuments({ deleted: false, visitDate: dateMatch, educationLevel: "O/L" }),
      StudentRegistration.countDocuments({ deleted: false, visitDate: dateMatch, educationLevel: "A/L" }),
      StudentRegistration.countDocuments({
        deleted: false,
        visitDate: dateMatch,
        registeredBy: req.user._id
      })
    ]);

    return res.json({
      success: true,
      data: {
        recent: recentList,
        todayCount,
        todayOlCount,
        todayAlCount,
        myTodayCount,
        activeEventDate: activeDate
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  create,
  checkDuplicateStudent,
  getAll,
  getById,
  update,
  softDelete,
  getRecent
};
