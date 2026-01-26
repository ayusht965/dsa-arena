// routes/progressRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getProblemProgress,
  updateProgress,
  getUserProblems,
  getGroupLeaderboard
} = require("../controllers/progressController");

// Get user's all problems with progress
router.get("/my-problems", auth, getUserProblems);

// Get progress for specific problem
router.get("/:problemId", auth, getProblemProgress);

// Update progress for specific problem
router.put("/:problemId", auth, updateProgress);

// Get group leaderboard
router.get("/leaderboard/:groupId", auth, getGroupLeaderboard);

module.exports = router;