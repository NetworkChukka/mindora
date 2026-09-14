const os = require("os");
const qrcode = require("qrcode");
const { getDBStatus } = require("../config/db");
const { listBackups } = require("../services/backupService");

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          netmask: net.netmask,
          mac: net.mac
        });
      }
    }
  }

  // Find most likely primary LAN or hotspot IP (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  let primaryIP = "127.0.0.1";
  const preferred = addresses.find((a) => a.ip.startsWith("192.168.") || a.ip.startsWith("10.") || a.ip.startsWith("172."));
  if (preferred) {
    primaryIP = preferred.ip;
  } else if (addresses.length > 0) {
    primaryIP = addresses[0].ip;
  }

  return { primaryIP, addresses };
};

const getNetworkInfo = async (req, res) => {
  try {
    const port = process.env.PORT || 3000;
    const { primaryIP, addresses } = getLocalIPs();
    const primaryUrl = `http://${primaryIP}:${port}`;
    const registerUrl = `${primaryUrl}/register`;
    const connectUrl = `${primaryUrl}/connect`;

    // Generate local QR Code as base64 data URL
    const qrDataUrl = await qrcode.toDataURL(registerUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#1E224F",
        light: "#FFFFFF"
      }
    });

    return res.json({
      success: true,
      data: {
        primaryIP,
        port,
        primaryUrl,
        registerUrl,
        connectUrl,
        qrCode: qrDataUrl,
        interfaces: addresses
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getHealth = (req, res) => {
  const db = getDBStatus();
  return res.json({
    status: db.connected ? "healthy" : "degraded",
    application: "online",
    database: db.connected ? "connected" : "disconnected",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
};

const getStatus = async (req, res) => {
  try {
    const db = getDBStatus();
    const { primaryIP, addresses } = getLocalIPs();
    const backups = await listBackups();
    const lastBackup = backups.length > 0 ? backups[0].createdAt : null;

    return res.json({
      success: true,
      data: {
        application: {
          status: "online",
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMB: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1)
        },
        database: {
          status: db.connected ? "connected" : "disconnected",
          readyState: db.readyState,
          host: db.host,
          name: db.name
        },
        network: {
          primaryIP,
          port: process.env.PORT || 3000,
          lanAddresses: addresses
        },
        backup: {
          totalBackups: backups.length,
          lastBackup
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHealth,
  getNetworkInfo,
  getStatus,
  getLocalIPs
};
