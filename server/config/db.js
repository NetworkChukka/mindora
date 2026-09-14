const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
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
  } catch (error) {
    isConnected = false;
    console.error("[MongoDB] Initial connection error:", error.message);
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
