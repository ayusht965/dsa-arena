// src/pages/Groups.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    fetchGroups();
  }, [navigate]);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups");
      console.log("Fetched groups:", res.data);
      setGroups(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch groups");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    if (!newGroup.name.trim()) {
      setCreateError("Group name is required");
      setCreating(false);
      return;
    }

    try {
      const res = await API.post("/groups", {
        name: newGroup.name.trim(),
        description: newGroup.description.trim() || null
      });

      setGroups([res.data, ...groups]);
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "" });
      setCreateError("");
    } catch (err) {
      setCreateError(err.response?.data?.msg || err.response?.data?.error || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName, e) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${groupName}"? This will delete all problems in this group and cannot be undone.`)) {
      return;
    }

    try {
      await API.delete(`/groups/${groupId}`);
      setGroups(groups.filter(g => g.id !== groupId));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete group");
    }
  };

  const handleOpenGroup = (groupId) => {
    if (!groupId) {
      console.error("No group ID provided");
      return;
    }
    console.log("Navigating to group:", groupId);
    navigate(`/groups/${groupId}`);
  };

  const groupCount = groups.length;

  return (
    <AppLayout activePage="groups">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Your Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition whitespace-nowrap"
        >
          + Create Group
        </button>
      </div>

      <p className="text-muted mb-8">
        You are part of {groupCount} group{groupCount !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <div className="text-center py-8 text-muted">
          Loading your groups...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
          <div className="mb-4 text-6xl">👥</div>
          <p className="text-xl font-semibold mb-2">No groups yet</p>
          <p className="text-muted mb-6">Create your first group to start collaborating!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] cursor-pointer relative group"
              onClick={() => handleOpenGroup(group.id)}
            >
              {/* Delete button - only for admin (creator) */}
              <button
                onClick={(e) => handleDeleteGroup(group.id, group.name, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-950/50 rounded-lg"
                title="Delete group"
              >
                <span className="text-red-400 text-xl">🗑️</span>
              </button>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-1 truncate">{group.name}</h2>
                  <p className="text-sm text-muted">
                    {group.member_count || 1} member{(group.member_count || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {group.description && (
                <p className="text-muted text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}

              <div className="h-1.5 bg-border/40 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                  style={{ width: `${group.progress || 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </span>
                <span className="text-primary font-medium">Open →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border">
            <h2 className="text-2xl font-bold mb-6">Create New Group</h2>

            <form onSubmit={handleCreateGroup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="e.g., Code Masters"
                  maxLength={100}
                  autoFocus
                  required
                />
                <p className="text-xs text-muted mt-1">
                  {newGroup.name.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="What's this group about?"
                  maxLength={500}
                />
                <p className="text-xs text-muted mt-1">
                  {newGroup.description.length}/500 characters
                </p>
              </div>

              {createError && (
                <div className="bg-red-950/30 border border-red-400/50 rounded-lg p-3 text-red-400 text-sm">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroup({ name: "", description: "" });
                    setCreateError("");
                  }}
                  className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-border/30 transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating || !newGroup.name.trim()}
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}