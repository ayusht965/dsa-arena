// controllers/progressController.js
const pool = require("../models/db");

// Get user's progress on a specific problem
exports.getProblemProgress = async (req, res) => {
  const { problemId } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(`
      SELECT * FROM user_progress 
      WHERE user_id = $1 AND problem_id = $2
    `, [userId, problemId]);

    if (result.rows.length === 0) {
      return res.json({
        status: 'not_started',
        time_spent: 0,
        notes: null,
        completed_at: null
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
};

// Update user's progress on a problem
exports.updateProgress = async (req, res) => {
  const { problemId } = req.params;
  const userId = req.userId;
  const { status, time_spent, notes } = req.body;

  if (!status) {
    return res.status(400).json({ msg: "Status is required" });
  }

  const validStatuses = ['not_started', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }

  try {
    // Check if progress record exists
    const existing = await pool.query(
      'SELECT id FROM user_progress WHERE user_id = $1 AND problem_id = $2',
      [userId, problemId]
    );

    let result;

    if (existing.rows.length === 0) {
      // Create new progress record
      result = await pool.query(`
        INSERT INTO user_progress (user_id, problem_id, status, time_spent, notes, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        userId, 
        problemId, 
        status, 
        time_spent || 0, 
        notes || null,
        status === 'completed' ? new Date() : null
      ]);
    } else {
      // Update existing progress
      result = await pool.query(`
        UPDATE user_progress 
        SET status = $1, 
            time_spent = $2, 
            notes = $3,
            completed_at = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 AND problem_id = $6
        RETURNING *
      `, [
        status, 
        time_spent || 0, 
        notes || null,
        status === 'completed' ? new Date() : null,
        userId, 
        problemId
      ]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
};

// Get all user's problems with their progress (for My Problems page)
exports.getUserProblems = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        g.name as group_name,
        g.id as group_id,
        COALESCE(up.status, 'not_started') as status,
        COALESCE(up.time_spent, 0) as time_spent,
        up.completed_at,
        up.notes
      FROM problems p
      JOIN group_problems gp ON p.id = gp.problem_id
      JOIN groups g ON gp.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN user_progress up ON p.id = up.problem_id AND up.user_id = $1
      WHERE gm.user_id = $1
      ORDER BY 
        CASE 
          WHEN up.status = 'in_progress' THEN 1
          WHEN up.status = 'not_started' THEN 2
          WHEN up.status = 'completed' THEN 3
          ELSE 4
        END,
        p.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get user problems error:", err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};

// Get group leaderboard
exports.getGroupLeaderboard = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  try {
    // Check membership
    const membership = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ msg: "Not a member of this group" });
    }

    // Get leaderboard
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as problems_solved,
        COALESCE(SUM(CASE WHEN up.status = 'completed' THEN up.time_spent ELSE 0 END), 0) as total_time,
        COALESCE(AVG(CASE WHEN up.status = 'completed' THEN up.time_spent END), 0) as avg_time
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN group_problems gp ON up.problem_id = gp.problem_id AND gp.group_id = $1
      WHERE gm.group_id = $1
      GROUP BY u.id, u.name
      ORDER BY problems_solved DESC, total_time ASC
    `, [groupId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};