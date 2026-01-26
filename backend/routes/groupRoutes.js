// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createGroup,
  getGroups,
  getGroupById,   // ← new
} = require("../controllers/groupController");

router.get("/", auth, getGroups);
router.post("/", auth, createGroup);
router.get("/:id", auth, getGroupById);   // ← NEW: get single group by ID

module.exports = router;