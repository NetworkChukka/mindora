const express = require("express");
const multer = require("multer");
const path = require("path");
const os = require("os");

const router = express.Router();
const upload = multer({ dest: path.join(os.tmpdir(), "mindora-uploads") });

const { authenticate, requireRole } = require("../middleware/auth");

// Controllers
const authCtrl = require("../controllers/authController");
const regCtrl = require("../controllers/registrationController");
const teacherCtrl = require("../controllers/teacherController");
const schoolCtrl = require("../controllers/schoolController");
const userCtrl = require("../controllers/userController");
const dashCtrl = require("../controllers/dashboardController");
const reportCtrl = require("../controllers/reportController");
const backupCtrl = require("../controllers/backupController");
const systemCtrl = require("../controllers/systemController");
const settingsCtrl = require("../controllers/settingsController");
const auditCtrl = require("../controllers/auditController");

// ----------------------------------------------------
// Public Routes
// ----------------------------------------------------
router.get("/health", systemCtrl.getHealth);
router.get("/system/network", systemCtrl.getNetworkInfo);
router.get("/dashboard/display", dashCtrl.getPublicDisplayStats);
router.get("/auth/setup-status", authCtrl.getSetupStatus);
router.post("/auth/setup", authCtrl.initialSetup);
router.post("/auth/login", authCtrl.login);

// ----------------------------------------------------
// Authenticated Routes (All logged in users: Admin, Operator, Viewer)
// ----------------------------------------------------
router.use(authenticate);

router.get("/auth/me", authCtrl.getMe);
router.post("/auth/logout", authCtrl.logout);
router.get("/settings", settingsCtrl.getSettings);

// Operator & Admin Accessible Routes
router.post("/registrations", requireRole("admin", "operator"), regCtrl.create);
router.get("/registrations/check-duplicate", requireRole("admin", "operator"), regCtrl.checkDuplicateStudent);
router.get("/registrations/recent", requireRole("admin", "operator"), regCtrl.getRecent);

router.post("/teachers", requireRole("admin", "operator"), teacherCtrl.create);
router.get("/teachers/check-duplicate", requireRole("admin", "operator"), teacherCtrl.checkDuplicateTeacher);

router.get("/schools", requireRole("admin", "operator", "viewer"), schoolCtrl.getAll);
router.post("/schools", requireRole("admin", "operator"), schoolCtrl.create);
router.get("/schools/:id", requireRole("admin", "operator", "viewer"), schoolCtrl.getById);

// Dashboard & Analytics
router.get("/dashboard/stats", requireRole("admin", "operator", "viewer"), dashCtrl.getStats);
router.get("/dashboard/grades", requireRole("admin", "operator", "viewer"), dashCtrl.getGrades);
router.get("/dashboard/schools", requireRole("admin", "viewer"), dashCtrl.getSchools);
router.get("/dashboard/operators", requireRole("admin", "viewer"), dashCtrl.getOperators);
router.get("/dashboard/hourly", requireRole("admin", "viewer"), dashCtrl.getHourly);
router.get("/dashboard/two-day", requireRole("admin", "viewer"), dashCtrl.getTwoDay);

// ----------------------------------------------------
// Admin-Only Routes
// ----------------------------------------------------
router.get("/registrations", requireRole("admin"), regCtrl.getAll);
router.get("/registrations/:id", requireRole("admin"), regCtrl.getById);
router.put("/registrations/:id", requireRole("admin"), regCtrl.update);
router.delete("/registrations/:id", requireRole("admin"), regCtrl.softDelete);

router.get("/teachers", requireRole("admin"), teacherCtrl.getAll);
router.get("/teachers/:id", requireRole("admin"), teacherCtrl.getById);
router.put("/teachers/:id", requireRole("admin"), teacherCtrl.update);
router.delete("/teachers/:id", requireRole("admin"), teacherCtrl.softDelete);

router.put("/schools/:id", requireRole("admin"), schoolCtrl.update);
router.patch("/schools/:id/status", requireRole("admin"), schoolCtrl.toggleStatus);
router.post("/schools/import", requireRole("admin"), upload.single("file"), schoolCtrl.importSchools);

router.get("/users", requireRole("admin"), userCtrl.getAll);
router.post("/users", requireRole("admin"), userCtrl.create);
router.put("/users/:id", requireRole("admin"), userCtrl.update);
router.patch("/users/:id/password", requireRole("admin"), userCtrl.resetPassword);

router.get("/reports/excel", requireRole("admin"), reportCtrl.exportExcel);
router.get("/reports/csv", requireRole("admin"), reportCtrl.exportCSV);
router.get("/reports/pdf", requireRole("admin"), reportCtrl.exportPDF);

router.get("/backups", requireRole("admin"), backupCtrl.getBackups);
router.post("/backups", requireRole("admin"), backupCtrl.makeBackup);
router.post("/backups/restore", requireRole("admin"), backupCtrl.restore);

router.get("/audit-logs", requireRole("admin"), auditCtrl.getLogs);

router.put("/settings", requireRole("admin"), settingsCtrl.updateSettings);
router.get("/system/status", requireRole("admin"), systemCtrl.getStatus);

module.exports = router;
