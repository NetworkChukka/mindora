const TeacherRegistration = require("../models/TeacherRegistration");
const Counter = require("../models/Counter");
const School = require("../models/School");
const EventSettings = require("../models/EventSettings");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");

const formatRegistrationNumber = (prefix, seq) => {
  const padded = String(seq).padStart(6, "0");
  return `${prefix}-${padded}`;
};

const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === "") return { valid: true, sanitized: "" };
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  const slRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;
  if (slRegex.test(cleaned)) {
    return { valid: true, sanitized: cleaned };
  }
  if (/^\+?[0-9]{9,12}$/.test(cleaned)) {
    return { valid: true, sanitized: cleaned };
  }
  return { valid: false, message: "Invalid Sri Lankan phone number format" };
};

const checkDuplicate = async ({ teacherName, schoolId }) => {
  if (!teacherName || !schoolId) return { isDuplicate: false };

  const regex = new RegExp(`^${teacherName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i");
  
  const existing = await TeacherRegistration.findOne({
    teacherName: regex,
    schoolId: schoolId,
    deleted: false
  }).populate("schoolId", "schoolName");

  if (existing) {
    return {
      isDuplicate: true,
      existingTeacher: {
        id: existing._id,
        teacherRegistrationNumber: existing.teacherRegistrationNumber,
        teacherName: existing.teacherName,
        schoolName: existing.schoolNameSnapshot,
        visitDate: existing.visitDate,
        createdAt: existing.createdAt
      }
    };
  }

  return { isDuplicate: false };
};

const registerTeacher = async ({
  teacherName,
  schoolId,
  phoneNumber,
  visitDate,
  user,
  deviceIdentifier,
  remarks,
  bypassDuplicate = false,
  req = null
}) => {
  if (!teacherName || teacherName.trim() === "") {
    throw new Error("Teacher name is required");
  }

  if (!schoolId) {
    throw new Error("School is required");
  }

  const school = await School.findById(schoolId);
  if (!school) {
    throw new Error("Selected school does not exist");
  }

  const phoneCheck = validatePhoneNumber(phoneNumber);
  if (!phoneCheck.valid) {
    throw new Error(phoneCheck.message);
  }

  if (!bypassDuplicate) {
    const dupResult = await checkDuplicate({ teacherName, schoolId });
    if (dupResult.isDuplicate) {
      return {
        isDuplicate: true,
        existingTeacher: dupResult.existingTeacher,
        message: "Possible duplicate teacher found"
      };
    }
  }

  const settings = (await EventSettings.findOne()) || {};
  
  // Teachers get a TCH prefix
  const seq = await Counter.getNextSequence("teacher_registration");
  const teacherRegistrationNumber = formatRegistrationNumber("TCH", seq);

  const finalVisitDate = visitDate || settings.activeEventDate || new Date().toISOString().split("T")[0];

  const registration = await TeacherRegistration.create({
    teacherRegistrationNumber,
    teacherName: teacherName.trim(),
    schoolId: school._id,
    schoolNameSnapshot: school.schoolName,
    phoneNumber: phoneCheck.sanitized,
    visitDate: finalVisitDate,
    registeredBy: user._id,
    registeredByName: user.fullName || user.username,
    deviceIdentifier: deviceIdentifier || "",
    remarks: remarks || "",
    deleted: false
  });

  broadcast("teacher:registered", {
    teacherRegistrationNumber: registration.teacherRegistrationNumber,
    teacherName: registration.teacherName,
    schoolName: registration.schoolNameSnapshot,
    visitDate: registration.visitDate,
    registeredByName: registration.registeredByName,
    createdAt: registration.createdAt
  });

  await logAudit({
    action: "TEACHER_REGISTERED",
    user,
    targetId: registration._id,
    targetType: "TeacherRegistration",
    description: `Registered teacher ${registration.teacherName} (${registration.teacherRegistrationNumber}) from ${registration.schoolNameSnapshot}`,
    metadata: { teacherRegistrationNumber: registration.teacherRegistrationNumber, schoolId: school._id },
    req
  });

  return {
    isDuplicate: false,
    data: registration
  };
};

module.exports = {
  checkDuplicate,
  registerTeacher,
  validatePhoneNumber
};
