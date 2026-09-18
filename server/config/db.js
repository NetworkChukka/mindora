const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mindora";
    
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log(`[MongoDB] Connected successfully to ${mongoUri}`);
    });

    mongoose.connection.on("error", (err) => {
      isConnected = false;
      console.error("[MongoDB] Connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("[MongoDB] Disconnected from database");
    });

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    // Auto-seed default users if database is empty
    await ensureDefaultUsers();
  } catch (error) {
    isConnected = false;
    console.error("[MongoDB] Initial connection error:", error.message);
  }
};

const ensureDefaultUsers = async () => {
  try {
    const User = require("../models/User");
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("[MongoDB] Empty database detected. Seeding default accounts...");
      const adminPass = await User.hashPassword("admin123");
      const deskPass = await User.hashPassword("desk123");
      const viewPass = await User.hashPassword("view123");

      await User.create([
        { fullName: "Exhibition Administrator", username: "admin", passwordHash: adminPass, role: "admin", status: "active" },
        { fullName: "Desk 01", username: "desk01", passwordHash: deskPass, role: "operator", status: "active" },
        { fullName: "Desk 02", username: "desk02", passwordHash: deskPass, role: "operator", status: "active" },
        { fullName: "Exhibition Viewer", username: "viewer", passwordHash: viewPass, role: "viewer", status: "active" }
      ]);
      console.log("[MongoDB] Default accounts created: admin/admin123, desk01/desk123, viewer/view123");
    }
  } catch (err) {
    console.error("[MongoDB] Ensure default users error:", err.message);
  }
};

const getDBStatus = () => {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || "127.0.0.1",
    name: mongoose.connection.name || "mindora"
  };
};

module.exports = { connectDB, getDBStatus };
