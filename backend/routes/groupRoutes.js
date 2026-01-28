// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createGroup,
  getGroups,
  getGroupById,
  deleteGroup
} = require("../controllers/groupController");

router.get("/", auth, getGroups);
router.post("/", auth, createGroup);
router.get("/:id", auth, getGroupById);
router.delete("/:id", auth, deleteGroup);

module.exports = router;