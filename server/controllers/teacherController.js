const TeacherRegistration = require("../models/TeacherRegistration");
const School = require("../models/School");
const { registerTeacher, checkDuplicate, validatePhoneNumber } = require("../services/teacherService");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");

const create = async (req, res) => {
  try {
    const {
      teacherName,
      schoolId,
      phoneNumber,
      visitDate,
      deviceIdentifier,
      remarks,
      bypassDuplicate
    } = req.body;

    const result = await registerTeacher({
      teacherName,
      schoolId,
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
        message: "Possible duplicate teacher detected",
        data: result.existingTeacher
      });
    }

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      data: result.data
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const checkDuplicateTeacher = async (req, res) => {
  try {
    const { teacherName, schoolId } = req.query;
    const result = await checkDuplicate({ teacherName, schoolId });
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
        { teacherRegistrationNumber: regex },
        { teacherName: regex },
        { schoolNameSnapshot: regex },
        { phoneNumber: regex }
      ];
    }

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
      TeacherRegistration.countDocuments(match),
      TeacherRegistration.find(match)
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
    const registration = await TeacherRegistration.findById(req.params.id)
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
    const { teacherName, schoolId, phoneNumber, visitDate, remarks } = req.body;

    const registration = await TeacherRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration record not found" });
    }

    const previousData = {
      teacherName: registration.teacherName,
      schoolName: registration.schoolNameSnapshot
    };

    if (teacherName) registration.teacherName = teacherName.trim();

    if (schoolId && String(schoolId) !== String(registration.schoolId)) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(400).json({ success: false, message: "School not found" });
      }
      registration.schoolId = school._id;
      registration.schoolNameSnapshot = school.schoolName;
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

    broadcast("teacher:updated", {
      id: registration._id,
      teacherRegistrationNumber: registration.teacherRegistrationNumber,
      teacherName: registration.teacherName,
      schoolName: registration.schoolNameSnapshot,
      visitDate: registration.visitDate
    });

    await logAudit({
      action: "ADMIN_EDITED_TEACHER_REGISTRATION",
      user: req.user,
      targetId: registration._id,
      targetType: "TeacherRegistration",
      description: `Edited teacher registration ${registration.teacherRegistrationNumber} (${registration.teacherName})`,
      metadata: { previous: previousData, updated: { schoolName: registration.schoolNameSnapshot } },
      req
    });

    return res.json({
      success: true,
      message: "Teacher registration updated successfully",
      data: registration
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await TeacherRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration record not found" });
    }

    registration.deleted = true;
    registration.deletedAt = new Date();
    registration.deletedBy = req.user._id;
    await registration.save();

    broadcast("teacher:deleted", {
      id: registration._id,
      teacherRegistrationNumber: registration.teacherRegistrationNumber
    });

    await logAudit({
      action: "ADMIN_DELETED_TEACHER_REGISTRATION",
      user: req.user,
      targetId: registration._id,
      targetType: "TeacherRegistration",
      description: `Soft-deleted teacher registration ${registration.teacherRegistrationNumber} for ${registration.teacherName}`,
      metadata: { teacherRegistrationNumber: registration.teacherRegistrationNumber },
      req
    });

    return res.json({
      success: true,
      message: `Teacher ${registration.teacherRegistrationNumber} deleted successfully`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  create,
  checkDuplicateTeacher,
  getAll,
  getById,
  update,
  softDelete
};
