// controllers/userController.js
const pool = require("../models/db");

// Get user profile
exports.getUserProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT id, name, email, bio, avatar_url, weekly_goal, github_username, linkedin_url, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const userId = req.userId;
  const { name, bio, avatar_url, weekly_goal, github_username, linkedin_url } = req.body;

  try {
    // Validate weekly goal
    if (weekly_goal !== undefined && (weekly_goal < 0 || weekly_goal > 100)) {
      return res.status(400).json({ msg: "Weekly goal must be between 0 and 100" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           weekly_goal = COALESCE($4, weekly_goal),
           github_username = COALESCE($5, github_username),
           linkedin_url = COALESCE($6, linkedin_url)
       WHERE id = $7
       RETURNING id, name, email, bio, avatar_url, weekly_goal, github_username, linkedin_url`,
      [name, bio, avatar_url, weekly_goal, github_username, linkedin_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};