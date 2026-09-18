require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const { connectDB, getDBStatus } = require("./config/db");
const { initSocket } = require("./sockets/socketHandler");
const errorHandler = require("./middleware/errorHandler");
const apiRoutes = require("./routes/api");
const { getLocalIPs } = require("./controllers/systemController");

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = "0.0.0.0"; // Listen on all network interfaces for LAN connectivity

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow local fonts, inline SVGs, and images
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." }
});
app.use("/api/auth/login", authLimiter);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
initSocket(io);

// Static assets
app.use("/assets", express.static(path.join(__dirname, "../client/public/assets")));
app.use("/public", express.static(path.join(__dirname, "../client/public")));

// API Routes
app.use("/api", apiRoutes);

// Serve React production build if dist folder exists
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  // If React client is running via Vite dev server or not yet built
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MINDORA Server Online</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1E293B; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 500px; border: 1px solid #334155; }
            h1 { color: #84CC16; margin-top: 0; }
            p { color: #94A3B8; line-height: 1.6; }
            .badge { display: inline-block; background: #16A34A; color: white; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; margin-bottom: 1rem; }
            .btn { display: inline-block; background: #1A56DB; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● SERVER ACTIVE</span>
            <h1>MINDORA MICROBIOLOGY EXHIBITION</h1>
            <p>The MINDORA offline central server is running on port ${PORT}.</p>
            <p>To run the frontend in development mode, run <code>npm run dev</code> or build the client with <code>npm run build</code>.</p>
            <a href="/api/health" class="btn">View API Health Status</a>
          </div>
        </body>
      </html>
    `);
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, HOST, () => {
    const { primaryIP, addresses } = getLocalIPs();
    const dbStatus = getDBStatus();

    console.log("\n============================================================");
    console.log("   MINDORA — MICROBIOLOGY EXHIBITION SERVER");
    console.log("============================================================");
    console.log(`   Status:       ONLINE`);
    console.log(`   Database:     ${dbStatus.connected ? "CONNECTED (MongoDB)" : "DISCONNECTED"}`);
    console.log(`   Local URL:    http://localhost:${PORT}`);
    console.log(`   Primary LAN:  http://${primaryIP}:${PORT}`);
    console.log(`   Connect/QR:   http://${primaryIP}:${PORT}/connect`);
    console.log(`   Registration: http://${primaryIP}:${PORT}/register`);
    console.log(`   Live Display: http://${primaryIP}:${PORT}/display`);
    if (addresses.length > 1) {
      console.log("   Other Adapters:");
      addresses.forEach((a) => {
        if (a.ip !== primaryIP) {
          console.log(`     - [${a.interface}] http://${a.ip}:${PORT}`);
        }
      });
    }
    console.log("============================================================\n");
  });
};

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
module.exports.startServer = startServer;
