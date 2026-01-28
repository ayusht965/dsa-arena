// controllers/groupController.js
const pool = require("../models/db");

exports.createGroup = async (req, res) => {
  const { name, description } = req.body;
  const adminId = req.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({ msg: "Group name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO groups (name, description, admin_id) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), description?.trim() || null, adminId]
    );

    const group = result.rows[0];

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [group.id, adminId]
    );

    res.status(201).json({
      ...group,
      member_count: 1
    });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
};

exports.getGroups = async (req, res) => {
  const userId = req.userId;

  try {
    // Only get non-deleted groups
    const result = await pool.query(`
      SELECT 
        g.id, 
        g.name, 
        g.description, 
        g.admin_id, 
        g.created_at,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND g.deleted_at IS NULL
      ORDER BY g.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

exports.getGroupById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const membership = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ msg: "Not a member of this group" });
    }

    // Allow viewing deleted groups (for history)
    const result = await pool.query(`
      SELECT 
        g.id, g.name, g.description, g.admin_id, g.created_at, g.updated_at, g.deleted_at,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
      FROM groups g
      WHERE g.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get group by ID error:", err);
    res.status(500).json({ error: "Failed to fetch group" });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const adminCheck = await pool.query(
      'SELECT admin_id FROM groups WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const adminId = adminCheck.rows[0].admin_id;

    if (adminId !== userId) {
      return res.status(403).json({ msg: "Only group admin can delete the group" });
    }

    // Soft delete the group
    const result = await pool.query(
      'UPDATE groups SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    res.json({ msg: "Group deleted successfully", group: result.rows[0] });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: "Failed to delete group" });
  }
};