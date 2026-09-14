const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");

const getSetupStatus = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    return res.json({
      success: true,
      data: {
        isSetupCompleted: adminCount > 0,
        adminCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const initialSetup = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Initial setup has already been completed"
      });
    }

    const { fullName, username, password, confirmPassword } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, username, and password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const passwordHash = await User.hashPassword(password);
    const adminUser = await User.create({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash,
      role: "admin",
      status: "active"
    });

    await logAudit({
      action: "ADMIN_CREATED_ADMIN",
      user: adminUser,
      targetId: adminUser._id,
      targetType: "User",
      description: `Initial administrator account created (${adminUser.username})`,
      req
    });

    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role, username: adminUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Administrator account created successfully",
      data: {
        token,
        user: {
          id: adminUser._id,
          fullName: adminUser.fullName,
          username: adminUser.username,
          role: adminUser.role
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is disabled. Please contact an administrator."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      id: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }
  });
};

const logout = async (req, res) => {
  return res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  getSetupStatus,
  initialSetup,
  login,
  getMe,
  logout
};
