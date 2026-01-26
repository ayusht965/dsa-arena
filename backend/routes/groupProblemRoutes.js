// routes/groupProblemRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createProblem, getGroupProblems } = require("../controllers/problemController");

// These routes are mounted at /api/groups
// So /:groupId/problems becomes /api/groups/:groupId/problems

// Create problem in group
router.post("/:groupId/problems", auth, createProblem);

// Get problems for group
router.get("/:groupId/problems", auth, getGroupProblems);

module.exports = router;