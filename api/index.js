const app = require("../server/server");
const { connectDB } = require("../server/config/db");

module.exports = async (req, res) => {
  // Preserve original request path if Vercel rewritten URL to /api/index.js
  const originalUrl = req.headers["x-forwarded-url"] || req.headers["x-matched-path"] || req.url;
  if (originalUrl && !originalUrl.startsWith("/api/index.js")) {
    req.url = originalUrl;
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("[Vercel] DB connection error:", err.message);
  }

  return app(req, res);
};
