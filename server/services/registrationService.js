const StudentRegistration = require("../models/StudentRegistration");
const Counter = require("../models/Counter");
const School = require("../models/School");
const EventSettings = require("../models/EventSettings");
const { calculateEducationLevel } = require("../config/constants");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");

const formatRegistrationNumber = (prefix, seq) => {
  const padded = String(seq).padStart(6, "0");
  return `${prefix}-${padded}`;
};

const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === "") return { valid: true, sanitized: "" };
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  // Sri Lanka phone regex: e.g. 07XXXXXXXX or +947XXXXXXXX or 947XXXXXXXX
  const slRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;
  if (slRegex.test(cleaned)) {
    return { valid: true, sanitized: cleaned };
  }
  // If numeric and 9-12 digits, accept as valid phone
  if (/^\+?[0-9]{9,12}$/.test(cleaned)) {
    return { valid: true, sanitized: cleaned };
  }
  return { valid: false, message: "Invalid Sri Lankan phone number format" };
};

const checkDuplicate = async ({ studentName, schoolId, grade }) => {
  if (!studentName || !schoolId) return { isDuplicate: false };

  const regex = new RegExp(`^${studentName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i");
  
  const existing = await StudentRegistration.findOne({
    studentName: regex,
    schoolId: schoolId,
    deleted: false
  }).populate("schoolId", "schoolName");

  if (existing) {
    return {
      isDuplicate: true,
      existingStudent: {
        id: existing._id,
        registrationNumber: existing.registrationNumber,
        studentName: existing.studentName,
        schoolName: existing.schoolNameSnapshot,
        grade: existing.grade,
        educationLevel: existing.educationLevel,
        visitDate: existing.visitDate,
        createdAt: existing.createdAt
      }
    };
  }

  return { isDuplicate: false };
};

const registerStudent = async ({
  studentName,
  schoolId,
  grade,
  phoneNumber,
  visitDate,
  user,
  deviceIdentifier,
  remarks,
  bypassDuplicate = false,
  req = null
}) => {
  if (!studentName || studentName.trim() === "") {
    throw new Error("Student name is required");
  }

  if (!schoolId) {
    throw new Error("School is required");
  }

  const numGrade = parseInt(grade, 10);
  if (isNaN(numGrade) || numGrade < 6 || numGrade > 13) {
    throw new Error("Grade must be between 6 and 13");
  }

  const educationLevel = calculateEducationLevel(numGrade);
  if (!educationLevel) {
    throw new Error("Invalid grade for education level calculation");
  }

  const school = await School.findById(schoolId);
  if (!school) {
    throw new Error("Selected school does not exist");
  }

  const phoneCheck = validatePhoneNumber(phoneNumber);
  if (!phoneCheck.valid) {
    throw new Error(phoneCheck.message);
  }

  // Duplicate check
  if (!bypassDuplicate) {
    const dupResult = await checkDuplicate({ studentName, schoolId, grade: numGrade });
    if (dupResult.isDuplicate) {
      return {
        isDuplicate: true,
        existingStudent: dupResult.existingStudent,
        message: "Possible duplicate student found"
      };
    }
  }

  // Settings for prefix
  const settings = (await EventSettings.findOne()) || {};
  const prefix = settings.registrationPrefix || "MIN";

  // Atomic sequence counter
  const seq = await Counter.getNextSequence("student_registration");
  const registrationNumber = formatRegistrationNumber(prefix, seq);

  const finalVisitDate = visitDate || settings.activeEventDate || new Date().toISOString().split("T")[0];

  const registration = await StudentRegistration.create({
    registrationNumber,
    studentName: studentName.trim(),
    schoolId: school._id,
    schoolNameSnapshot: school.schoolName,
    grade: numGrade,
    educationLevel,
    phoneNumber: phoneCheck.sanitized,
    visitDate: finalVisitDate,
    registeredBy: user._id,
    registeredByName: user.fullName || user.username,
    deviceIdentifier: deviceIdentifier || "",
    remarks: remarks || "",
    deleted: false
  });

  // Real-time broadcast
  broadcast("student:registered", {
    registrationNumber: registration.registrationNumber,
    studentName: registration.studentName,
    schoolName: registration.schoolNameSnapshot,
    grade: registration.grade,
    educationLevel: registration.educationLevel,
    visitDate: registration.visitDate,
    registeredByName: registration.registeredByName,
    createdAt: registration.createdAt
  });

  // Audit log
  await logAudit({
    action: "OPERATOR_REGISTERED_STUDENT",
    user,
    targetId: registration._id,
    targetType: "StudentRegistration",
    description: `Registered student ${registration.studentName} (${registration.registrationNumber}) from ${registration.schoolNameSnapshot}`,
    metadata: {
      registrationNumber: registration.registrationNumber,
      grade: registration.grade,
      educationLevel: registration.educationLevel
    },
    req
  });

  return {
    success: true,
    data: registration
  };
};

module.exports = {
  registerStudent,
  checkDuplicate,
  formatRegistrationNumber,
  validatePhoneNumber
};
