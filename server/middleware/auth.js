const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "mindora_super_secret_offline_jwt_key_2026";

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "User account is disabled" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

module.exports = { authenticate, requireRole, JWT_SECRET };
