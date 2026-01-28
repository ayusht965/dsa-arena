// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/dashboardController");

// Get dashboard statistics
router.get("/stats", auth, getDashboardStats);

module.exports = router;