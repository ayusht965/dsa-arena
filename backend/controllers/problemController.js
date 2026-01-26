// controllers/problemController.js
const pool = require("../models/db");

exports.createProblem = async (req, res) => {
  const { title, description, examples, constraints } = req.body;
  const groupId = req.params.groupId;
  const creatorId = req.userId; // from JWT middleware

  // Validation
  if (!title || !description) {
    return res.status(400).json({ msg: "Title and description are required" });
  }

  if (!groupId) {
    return res.status(400).json({ msg: "Group ID is required in URL" });
  }

  try {
    // 1. Check if user is admin of this group
    const adminCheck = await pool.query(
      "SELECT admin_id FROM groups WHERE id = $1",
      [groupId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const groupAdminId = adminCheck.rows[0].admin_id;

    if (groupAdminId !== creatorId) {
      return res.status(403).json({ msg: "Only group admin can create problems" });
    }

    // 2. Create the problem
    const problemResult = await pool.query(
      `INSERT INTO problems (title, description, examples, constraints, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        examples?.trim() || null,
        constraints?.trim() || null,
        creatorId
      ]
    );

    const problem = problemResult.rows[0];

    // 3. Assign problem to the group
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
    const result = await pool.query("SELECT * FROM problems ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupProblems = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  try {
    // Check membership
    const membership = await pool.query(
      "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ msg: "You are not a member of this group" });
    }

    // Get problems
    const result = await pool.query(`
      SELECT p.*
      FROM problems p
      JOIN group_problems gp ON p.id = gp.problem_id
      WHERE gp.group_id = $1
      ORDER BY p.created_at DESC
    `, [groupId]);

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
    // Get problem
    const problemResult = await pool.query(
      "SELECT * FROM problems WHERE id = $1",
      [id]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    const problem = problemResult.rows[0];

    // Check if user has access to this problem (is member of a group that has this problem)
    const accessCheck = await pool.query(`
      SELECT 1 
      FROM group_problems gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.problem_id = $1 AND gm.user_id = $2
      LIMIT 1
    `, [id, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ msg: "You don't have access to this problem" });
    }

    res.json(problem);
  } catch (err) {
    console.error("Get problem error:", err);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
};

exports.updateProblem = async (req, res) => {
  const { id } = req.params;
  const { title, description, examples, constraints } = req.body;
  const userId = req.userId;

  try {
    // Check if user is admin of any group that has this problem
    const adminCheck = await pool.query(`
      SELECT g.admin_id
      FROM groups g
      JOIN group_problems gp ON g.id = gp.group_id
      WHERE gp.problem_id = $1 AND g.admin_id = $2
      LIMIT 1
    `, [id, userId]);

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ msg: "Only the group admin can update this problem" });
    }

    const result = await pool.query(`
      UPDATE problems
      SET title = $1, description = $2, examples = $3, constraints = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [title, description, examples, constraints, id]);

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
    // Check if user is admin of any group that has this problem
    const adminCheck = await pool.query(`
      SELECT g.admin_id
      FROM groups g
      JOIN group_problems gp ON g.id = gp.group_id
      WHERE gp.problem_id = $1 AND g.admin_id = $2
      LIMIT 1
    `, [id, userId]);

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ msg: "Only the group admin can delete this problem" });
    }

    const result = await pool.query(
      "DELETE FROM problems WHERE id = $1 RETURNING *",
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