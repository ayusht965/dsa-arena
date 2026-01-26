// routes/problemRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { 
  getProblems, 
  getProblemById, 
  updateProblem, 
  deleteProblem 
} = require("../controllers/problemController");

// Global problems list (optional)
router.get("/", getProblems);

// Get specific problem by ID
router.get("/:id", auth, getProblemById);

// Update problem (admin only - checked in controller)
router.put("/:id", auth, updateProblem);

// Delete problem (admin only - checked in controller)
router.delete("/:id", auth, deleteProblem);

module.exports = router;