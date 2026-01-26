const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const { signup, login, getCurrentUser } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", auth, getCurrentUser);

module.exports = router;
