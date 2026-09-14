const AuditLog = require("../models/AuditLog");

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action = "all", search = "" } = req.query;

    const match = {};
    if (action && action !== "all") {
      match.action = action;
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      match.$or = [
        { userName: regex },
        { description: regex },
        { action: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      AuditLog.countDocuments(match),
      AuditLog.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "fullName username role")
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

module.exports = {
  getLogs
};
