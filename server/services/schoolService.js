const School = require("../models/School");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");

const normalizeSchoolName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const createOrFindSchool = async ({
  schoolName,
  schoolCode = "",
  city = "",
  district = "",
  user,
  req = null
}) => {
  if (!schoolName || schoolName.trim() === "") {
    throw new Error("School name is required");
  }

  const trimmedName = schoolName.trim();
  const normalized = normalizeSchoolName(trimmedName);

  // Check for existing school by normalized name
  const existing = await School.findOne({ normalizedName: normalized });
  if (existing) {
    return {
      alreadyExists: true,
      school: existing,
      message: `"${existing.schoolName}" already exists.`
    };
  }

  try {
    const school = await School.create({
      schoolName: trimmedName,
      normalizedName: normalized,
      schoolCode: schoolCode ? schoolCode.trim() : "",
      city: city ? city.trim() : "",
      district: district ? district.trim() : "",
      status: "active",
      createdBy: user ? user._id : null,
      createdByName: user ? user.fullName || user.username : "System"
    });

    // Real-time broadcast to all connected devices
    broadcast("school:created", {
      id: school._id,
      _id: school._id,
      schoolName: school.schoolName,
      normalizedName: school.normalizedName,
      schoolCode: school.schoolCode,
      city: school.city,
      district: school.district,
      status: school.status
    });

    if (user) {
      await logAudit({
        action: "OPERATOR_CREATED_SCHOOL",
        user,
        targetId: school._id,
        targetType: "School",
        description: `Created new school "${school.schoolName}" (${school.city || "No City"})`,
        metadata: { schoolName: school.schoolName, city: school.city, district: school.district },
        req
      });
    }

    return {
      alreadyExists: false,
      school,
      message: "School created successfully"
    };
  } catch (err) {
    // Handle concurrency race condition if two requests submitted identical school at same millisecond
    if (err.code === 11000) {
      const concurrentSchool = await School.findOne({ normalizedName: normalized });
      return {
        alreadyExists: true,
        school: concurrentSchool,
        message: `"${concurrentSchool ? concurrentSchool.schoolName : trimmedName}" already exists.`
      };
    }
    throw err;
  }
};

module.exports = {
  normalizeSchoolName,
  createOrFindSchool
};
