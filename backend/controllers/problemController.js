// controllers/problemController.js
const pool = require("../models/db");

exports.createProblem = async (req, res) => {
  const { title, description, examples, constraints, platform_link, points, difficulty } = req.body;
  const groupId = req.params.groupId;
  const creatorId = req.userId;

  if (!title || !description) {
    return res.status(400).json({ msg: "Title and description are required" });
  }

  if (!groupId) {
    return res.status(400).json({ msg: "Group ID is required in URL" });
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard'];
  const problemDifficulty = difficulty && validDifficulties.includes(difficulty) ? difficulty : 'medium';

  // Validate points (default based on difficulty if not provided)
  let problemPoints = points;
  if (!problemPoints || problemPoints < 0) {
    // Default points based on difficulty
    problemPoints = problemDifficulty === 'easy' ? 10 : 
                    problemDifficulty === 'medium' ? 20 : 30;
  }

  try {
    const adminCheck = await pool.query(
      "SELECT admin_id FROM groups WHERE id = $1 AND deleted_at IS NULL",
      [groupId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const groupAdminId = adminCheck.rows[0].admin_id;

    if (groupAdminId !== creatorId) {
      return res.status(403).json({ msg: "Only group admin can create problems" });
    }

    const problemResult = await pool.query(
      `INSERT INTO problems (title, description, examples, constraints, platform_link, points, difficulty, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        examples?.trim() || null,
        constraints?.trim() || null,
        platform_link?.trim() || null,
        problemPoints,
        problemDifficulty,
        creatorId
      ]
    );

    const problem = problemResult.rows[0];

    await pool.query(
      "INSERT INTO group_problems (group_id, problem_id) VALUES ($1, $2)",
      [groupId, problem.id]
    );

    res.status(201).json(problem);
  } catch (err) {
    console.error("Create problem error:", err);
    res.status(500).json({ error: "Failed to create problem" });
  }
};

exports.getProblems = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM problems WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupProblems = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  try {
    const membership = await pool.query(
      'SELECT joined_at FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ msg: "You are not a member of this group" });
    }

    const joinedAt = membership.rows[0].joined_at;

    const result = await pool.query(`
      SELECT 
        p.*,
        g.admin_id,
        CASE WHEN g.admin_id = $2 THEN true ELSE false END as is_admin
      FROM problems p
      JOIN group_problems gp ON p.id = gp.problem_id
      JOIN groups g ON gp.group_id = g.id
      WHERE gp.group_id = $1 
        AND p.deleted_at IS NULL
        AND (
          p.created_at >= $3
          OR g.admin_id = $2
        )
      ORDER BY p.created_at DESC
    `, [groupId, userId, joinedAt]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get group problems error:", err.message);
    res.status(500).json({ error: "Failed to fetch group problems" });
  }
};

exports.getProblemById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const problemResult = await pool.query(
      "SELECT * FROM problems WHERE id = $1",
      [id]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    const problem = problemResult.rows[0];

    const accessCheck = await pool.query(`
      SELECT 
        gm.joined_at,
        g.admin_id,
        CASE WHEN g.admin_id = $2 THEN true ELSE false END as is_admin
      FROM group_problems gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      JOIN groups g ON gp.group_id = g.id
      WHERE gp.problem_id = $1 AND gm.user_id = $2
      LIMIT 1
    `, [id, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ msg: "You don't have access to this problem" });
    }

    const { joined_at, is_admin } = accessCheck.rows[0];

    if (!is_admin && new Date(problem.created_at) < new Date(joined_at)) {
      return res.status(403).json({ msg: "This problem was created before you joined the group" });
    }

    res.json(problem);
  } catch (err) {
    console.error("Get problem error:", err);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
};

exports.updateProblem = async (req, res) => {
  const { id } = req.params;
  const { title, description, examples, constraints, platform_link, points, difficulty } = req.body;
  const userId = req.userId;

  try {
    const adminCheck = await pool.query(`
      SELECT g.admin_id
      FROM groups g
      JOIN group_problems gp ON g.id = gp.group_id
      WHERE gp.problem_id = $1 AND g.admin_id = $2 AND g.deleted_at IS NULL
      LIMIT 1
    `, [id, userId]);

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ msg: "Only the group admin can update this problem" });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    const problemDifficulty = difficulty && validDifficulties.includes(difficulty) ? difficulty : 'medium';

    const result = await pool.query(`
      UPDATE problems
      SET title = $1, description = $2, examples = $3, constraints = $4, 
          platform_link = $5, points = $6, difficulty = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND deleted_at IS NULL
      RETURNING *
    `, [title, description, examples, constraints, platform_link, points, problemDifficulty, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update problem error:", err);
    res.status(500).json({ error: "Failed to update problem" });
  }
};

exports.deleteProblem = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const adminCheck = await pool.query(`
      SELECT g.admin_id
      FROM groups g
      JOIN group_problems gp ON g.id = gp.group_id
      WHERE gp.problem_id = $1 AND g.admin_id = $2 AND g.deleted_at IS NULL
      LIMIT 1
    `, [id, userId]);

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ msg: "Only the group admin can delete this problem" });
    }

    const result = await pool.query(
      "UPDATE problems SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    res.json({ msg: "Problem deleted successfully" });
  } catch (err) {
    console.error("Delete problem error:", err);
    res.status(500).json({ error: "Failed to delete problem" });
  }
};