// controllers/memberController.js
const pool = require("../models/db");

// Get all members of a group
exports.getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  try {
    // Check if user is a member
    const membership = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ msg: "Not a member of this group" });
    }

    // Get all members with their details
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email,
        gm.joined_at,
        g.admin_id,
        CASE WHEN u.id = g.admin_id THEN true ELSE false END as is_admin
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.group_id = $1
      ORDER BY is_admin DESC, gm.joined_at ASC
    `, [groupId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get group members error:", err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

// Add member to group (invite by email)
exports.addMember = async (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body;
  const userId = req.userId;

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT 1 FROM groups WHERE id = $1 AND admin_id = $2',
      [groupId, userId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ msg: "Only group admin can add members" });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: "User not found with this email" });
    }

    const newMember = userResult.rows[0];

    // Check if already a member
    const existingMember = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, newMember.id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ msg: "User is already a member" });
    }

    // Add member
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, newMember.id]
    );

    res.status(201).json({
      msg: "Member added successfully",
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        is_admin: false
      }
    });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  const userId = req.userId;

  try {
    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT admin_id FROM groups WHERE id = $1',
      [groupId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Group not found" });
    }

    const adminId = adminCheck.rows[0].admin_id;

    if (adminId !== userId) {
      return res.status(403).json({ msg: "Only group admin can remove members" });
    }

    // Prevent removing admin
    if (parseInt(memberId) === adminId) {
      return res.status(400).json({ msg: "Cannot remove group admin" });
    }

    // Remove member
    const result = await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
      [groupId, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Member not found in group" });
    }

    res.json({ msg: "Member removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
};