// routes/memberRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getGroupMembers,
  addMember,
  removeMember
} = require("../controllers/memberController");

// Get all members of a group
router.get("/:groupId/members", auth, getGroupMembers);

// Add member to group
router.post("/:groupId/members", auth, addMember);

// Remove member from group
router.delete("/:groupId/members/:memberId", auth, removeMember);

module.exports = router;