// controllers/dashboardController.js
const pool = require("../models/db");

exports.getDashboardStats = async (req, res) => {
  const userId = req.userId;

  try {
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = userResult.rows[0];

    const solvedResult = await pool.query(`
      SELECT COUNT(*) as problems_solved
      FROM user_progress
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    const timeResult = await pool.query(`
      SELECT COALESCE(SUM(time_spent), 0) as total_time
      FROM user_progress
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    const problemsSolved = parseInt(solvedResult.rows[0].problems_solved);
    const points = problemsSolved * 10;
    const totalMinutes = parseInt(timeResult.rows[0].total_time);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeSpent = `${hours} hrs ${minutes} mins`;

    const inProgressResult = await pool.query(`
      SELECT COUNT(*) as in_progress_count
      FROM user_progress
      WHERE user_id = $1 AND status = 'in_progress'
    `, [userId]);

    const weeklyResult = await pool.query(`
      SELECT COUNT(*) as weekly_solved
      FROM user_progress
      WHERE user_id = $1 
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [userId]);

    const weeklyGoal = 5;
    const weeklySolved = parseInt(weeklyResult.rows[0].weekly_solved);
    const weeklyProgress = Math.min(100, Math.round((weeklySolved / weeklyGoal) * 100));

    const recentActivity = await pool.query(`
      SELECT 
        p.id,
        p.title,
        up.completed_at,
        up.time_spent,
        g.name as group_name
      FROM user_progress up
      JOIN problems p ON up.problem_id = p.id
      JOIN group_problems gp ON p.id = gp.problem_id
      JOIN groups g ON gp.group_id = g.id
      WHERE up.user_id = $1 AND up.status = 'completed'
      ORDER BY up.completed_at DESC
      LIMIT 5
    `, [userId]);

    // Get heatmap data (last 365 days)
    const heatmapResult = await pool.query(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as count
      FROM user_progress
      WHERE user_id = $1 
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - INTERVAL '365 days'
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `, [userId]);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      },
      stats: {
        points,
        problemsSolved,
        timeSpent,
        totalMinutes,
        inProgress: parseInt(inProgressResult.rows[0].in_progress_count),
        weeklyGoal,
        weeklySolved,
        weeklyProgress
      },
      recentActivity: recentActivity.rows,
      heatmapData: heatmapResult.rows
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};