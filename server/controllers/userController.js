const User = require("../models/User");
const StudentRegistration = require("../models/StudentRegistration");
const { logAudit } = require("../utils/auditLogger");

const create = async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, message: "Full name, username, and password are required" });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ success: false, message: `Username "${cleanUsername}" is already taken` });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      passwordHash,
      role: role || "operator",
      status: "active"
    });

    await logAudit({
      action: "ADMIN_CREATED_USER",
      user: req.user,
      targetId: user._id,
      targetType: "User",
      description: `Created new ${user.role} user: ${user.fullName} (@${user.username})`,
      metadata: { role: user.role, username: user.username },
      req
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();

    // Get registration counts per user
    const regCounts = await StudentRegistration.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: "$registeredBy", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    regCounts.forEach((rc) => {
      countMap[String(rc._id)] = rc.count;
    });

    const enriched = users.map((u) => ({
      ...u,
      registrationCount: countMap[String(u._id)] || 0
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (fullName) user.fullName = fullName.trim();
    if (role && ["admin", "operator", "viewer"].includes(role)) user.role = role;
    if (status && ["active", "disabled"].includes(status)) user.status = status;

    await user.save();

    await logAudit({
      action: "ADMIN_EDITED_USER",
      user: req.user,
      targetId: user._id,
      targetType: "User",
      description: `Updated user profile for ${user.username} (Role: ${user.role}, Status: ${user.status})`,
      req
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await logAudit({
      action: "ADMIN_RESET_PASSWORD",
      user: req.user,
      targetId: user._id,
      targetType: "User",
      description: `Reset password for user @${user.username}`,
      req
    });

    return res.json({
      success: true,
      message: `Password reset successfully for @${user.username}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  create,
  getAll,
  update,
  resetPassword
};
