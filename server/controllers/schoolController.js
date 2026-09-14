const School = require("../models/School");
const StudentRegistration = require("../models/StudentRegistration");
const { createOrFindSchool, normalizeSchoolName } = require("../services/schoolService");
const { broadcast } = require("../sockets/socketHandler");
const { logAudit } = require("../utils/auditLogger");
const ExcelJS = require("exceljs");
const csvParser = require("csv-parser");
const fs = require("fs");

const create = async (req, res) => {
  try {
    const { schoolName, schoolCode, city, district } = req.body;
    const result = await createOrFindSchool({
      schoolName,
      schoolCode,
      city,
      district,
      user: req.user,
      req
    });

    if (result.alreadyExists) {
      return res.status(409).json({
        success: false,
        alreadyExists: true,
        message: result.message,
        data: result.school
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.school
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      sortBy = "schoolName",
      sortOrder = "asc",
      page,
      limit
    } = req.query;

    const match = {};
    if (status && status !== "all") {
      match.status = status;
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      match.$or = [
        { schoolName: regex },
        { city: regex },
        { district: regex },
        { schoolCode: regex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    let query = School.find(match).sort(sortOptions);

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const skip = (pageNum - 1) * limitNum;
      const [total, items] = await Promise.all([
        School.countDocuments(match),
        query.skip(skip).limit(limitNum).lean()
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
    }

    // Default: return all active for operator dropdown search
    const schools = await query.lean();
    return res.json({
      success: true,
      data: schools
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    // Get registration breakdown for this school
    const [stats] = await StudentRegistration.aggregate([
      { $match: { schoolId: school._id, deleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ol: { $sum: { $cond: [{ $eq: ["$educationLevel", "O/L"] }, 1, 0] } },
          al: { $sum: { $cond: [{ $eq: ["$educationLevel", "A/L"] }, 1, 0] } }
        }
      }
    ]);

    return res.json({
      success: true,
      data: {
        school,
        stats: stats || { total: 0, ol: 0, al: 0 }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolName, schoolCode, city, district, status } = req.body;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    if (schoolName && schoolName.trim() !== school.schoolName) {
      const normalized = normalizeSchoolName(schoolName.trim());
      const existing = await School.findOne({ normalizedName: normalized, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another school with name "${schoolName}" already exists`
        });
      }
      school.schoolName = schoolName.trim();
      school.normalizedName = normalized;
    }

    if (schoolCode !== undefined) school.schoolCode = schoolCode.trim();
    if (city !== undefined) school.city = city.trim();
    if (district !== undefined) school.district = district.trim();
    if (status && ["active", "disabled"].includes(status)) school.status = status;

    await school.save();

    broadcast("school:updated", {
      id: school._id,
      _id: school._id,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      city: school.city,
      district: school.district,
      status: school.status
    });

    await logAudit({
      action: "ADMIN_EDITED_SCHOOL",
      user: req.user,
      targetId: school._id,
      targetType: "School",
      description: `Updated school "${school.schoolName}"`,
      req
    });

    return res.json({
      success: true,
      message: "School updated successfully",
      data: school
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    school.status = school.status === "active" ? "disabled" : "active";
    await school.save();

    broadcast("school:updated", {
      id: school._id,
      _id: school._id,
      schoolName: school.schoolName,
      status: school.status
    });

    await logAudit({
      action: "ADMIN_TOGGLED_SCHOOL_STATUS",
      user: req.user,
      targetId: school._id,
      targetType: "School",
      description: `Set school "${school.schoolName}" status to ${school.status}`,
      req
    });

    return res.json({
      success: true,
      message: `School marked as ${school.status}`,
      data: school
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const importSchools = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload an Excel (.xlsx) or CSV file" });
  }

  const filePath = req.file.path;
  const isExcel = req.file.originalname.endsWith(".xlsx") || req.file.mimetype.includes("spreadsheetml");

  let imported = 0;
  let skipped = 0;
  const errors = [];
  const rawRows = [];

  try {
    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("Excel sheet is empty");
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const name = row.getCell(1).text || row.getCell(1).value;
        const code = row.getCell(2).text || row.getCell(2).value || "";
        const city = row.getCell(3).text || row.getCell(3).value || "";
        const district = row.getCell(4).text || row.getCell(4).value || "";
        if (name) {
          rawRows.push({ schoolName: String(name), schoolCode: String(code), city: String(city), district: String(district) });
        }
      });
    } else {
      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (data) => {
            const keys = Object.keys(data);
            const nameKey = keys.find((k) => /name|school/i.test(k)) || keys[0];
            const codeKey = keys.find((k) => /code/i.test(k)) || keys[1];
            const cityKey = keys.find((k) => /city/i.test(k)) || keys[2];
            const districtKey = keys.find((k) => /district/i.test(k)) || keys[3];

            if (data[nameKey]) {
              rawRows.push({
                schoolName: data[nameKey],
                schoolCode: data[codeKey] || "",
                city: data[cityKey] || "",
                district: data[districtKey] || ""
              });
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });
    }

    // Process rows sequentially or batch
    for (const row of rawRows) {
      const name = String(row.schoolName || "").trim();
      if (!name) {
        errors.push("Row skipped: Empty school name");
        continue;
      }
      const normalized = normalizeSchoolName(name);
      const exists = await School.findOne({ normalizedName: normalized });
      if (exists) {
        skipped++;
        continue;
      }

      await School.create({
        schoolName: name,
        normalizedName: normalized,
        schoolCode: String(row.schoolCode || "").trim(),
        city: String(row.city || "").trim(),
        district: String(row.district || "").trim(),
        status: "active",
        createdBy: req.user._id,
        createdByName: req.user.fullName || req.user.username
      });
      imported++;
    }

    // Clean up uploaded temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await logAudit({
      action: "ADMIN_IMPORTED_SCHOOLS",
      user: req.user,
      description: `Imported schools: ${imported} added, ${skipped} skipped (duplicates), ${errors.length} errors`,
      metadata: { imported, skipped, errorsCount: errors.length },
      req
    });

    broadcast("school:created", { bulk: true, importedCount: imported });

    return res.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped, ${errors.length} errors`,
      data: { imported, skipped, errors }
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  toggleStatus,
  importSchools
};
