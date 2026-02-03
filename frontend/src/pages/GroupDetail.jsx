import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [problems, setProblems] = useState([]);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("problems");
  const [isAdmin, setIsAdmin] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  
  const [newProblem, setNewProblem] = useState({
    title: "",
  description: "",
  examples: "",
  constraints: "",
  platform_link: "",
  difficulty: "medium",
  points: 20 
  });

  useEffect(() => {
    if (!id) {
      setError("Group ID missing");
      setLoading(false);
      return;
    }
    fetchData();
  }, [id, navigate]);

  const fetchData = async () => {
    try {
      const userRes = await API.get("/auth/me");
      setCurrentUser(userRes.data);
      const groupRes = await API.get(`/groups/${id}`);
      setGroup(groupRes.data);
      const problemsRes = await API.get(`/groups/${id}/problems`);
      setProblems(problemsRes.data);
      setIsAdmin(groupRes.data.admin_id === userRes.data.id);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load data");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/groups/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get(`/progress/leaderboard/${id}`);
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "members" && members.length === 0) fetchMembers();
    if (activeTab === "leaderboard" && leaderboard.length === 0) fetchLeaderboard();
  }, [activeTab]);

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    if (!newProblem.title.trim()) {
      setCreateError("Title is required");
      setCreating(false);
      return;
    }

    if (!newProblem.description.trim()) {
      setCreateError("Description is required");
      setCreating(false);
      return;
    }

    try {
      const res = await API.post(`/groups/${id}/problems`, {
        title: newProblem.title.trim(),
        description: newProblem.description.trim(),
        examples: newProblem.examples.trim() || null,
        constraints: newProblem.constraints.trim() || null,
        platform_link: newProblem.platform_link.trim() || null,
        difficulty: newProblem.difficulty,
        points: parseInt(newProblem.points) || 20
      });

      setProblems([res.data, ...problems]);
      setShowCreateModal(false);
      setNewProblem({ title: "", description: "", examples: "", constraints: "", platform_link: "", difficulty: "medium", points: 20 });
      setCreateError("");
    } catch (err) {
      setCreateError(err.response?.data?.msg || "Failed to create problem");
    } finally {
      setCreating(false);
    }
  };

  const handleDifficultyChange = (difficulty) => {
    const defaultPoints = { easy: 10, medium: 20, hard: 30 };
    setNewProblem({ ...newProblem, difficulty, points: defaultPoints[difficulty] });
  };

  const handleDeleteProblem = async (problemId, problemTitle) => {
    if (!confirm(`Are you sure you want to delete "${problemTitle}"?`)) return;
    try {
      await API.delete(`/problems/${problemId}`);
      setProblems(problems.filter(p => p.id !== problemId));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete problem");
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return;
    try {
      await API.delete(`/groups/${id}`);
      navigate("/groups");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete group");
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError("");
    try {
      const res = await API.post(`/groups/${id}/members`, { email: inviteEmail });
      setMembers([...members, res.data.member]);
      setShowInviteModal(false);
      setInviteEmail("");
      if (group) setGroup({ ...group, member_count: (group.member_count || 0) + 1 });
    } catch (err) {
      setInviteError(err.response?.data?.msg || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await API.delete(`/groups/${id}/members/${memberId}`);
      setMembers(members.filter(m => m.id !== memberId));
      if (group) setGroup({ ...group, member_count: Math.max(0, (group.member_count || 0) - 1) });
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to remove member");
    }
  };

  const handleViewProblem = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} mins`;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  if (loading) return <div className="text-center py-16 text-muted">Loading...</div>;
  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;

  // Component continues in next message due to length...
  return (
    <AppLayout activePage="groups">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold text-2xl">
            {group?.name?.charAt(0).toUpperCase() || "G"}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{group?.name || "Unnamed"}</h1>
            <p className="text-muted">{group?.member_count || 0} Members</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-4">
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-5 py-2.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition"
            >
              Invite Members
            </button>
            <button
              onClick={handleDeleteGroup}
              className="px-5 py-2.5 bg-red-950/30 text-red-400 rounded-lg hover:bg-red-950/50 transition"
            >
              Delete Group
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-6 mb-8 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("problems")}
          className={`pb-3 px-2 font-medium border-b-2 whitespace-nowrap ${
            activeTab === "problems" ? "border-primary text-primary" : "border-transparent text-muted hover:text-white"
          }`}
        >
          Problems
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`pb-3 px-2 font-medium border-b-2 whitespace-nowrap ${
            activeTab === "leaderboard" ? "border-primary text-primary" : "border-transparent text-muted hover:text-white"
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-3 px-2 font-medium border-b-2 whitespace-nowrap ${
            activeTab === "members" ? "border-primary text-primary" : "border-transparent text-muted hover:text-white"
          }`}
        >
          Members
        </button>
      </div>

      {activeTab === "problems" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Problems</h2>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition"
              >
                + Create Problem
              </button>
            )}
          </div>

          {problems.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-2xl border border-border/50">
              <p className="text-muted text-lg mb-2">No problems yet</p>
              <p className="text-muted/70 text-sm">
                {isAdmin ? "Create your first problem to get started!" : "Ask the admin to create some problems."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-card border border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition relative group"
                >
                  {/* Delete button - only for admin */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteProblem(problem.id, problem.title)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-950/50 rounded-lg"
                      title="Delete problem"
                    >
                      <span className="text-red-400 text-xl">🗑️</span>
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-4 pr-12">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xl font-bold">{problem.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {problem.points} pts
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                        {problem.description}
                      </p>
                      {problem.platform_link && (
                        <a
                          href={problem.platform_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 View on Platform →
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted">
                      Created {new Date(problem.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleViewProblem(problem.id)}
                      className="px-6 py-2.5 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/30 transition"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted">
              No activity yet. Complete some problems to appear here!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`bg-card border border-border rounded-xl p-5 flex items-center justify-between ${
                    entry.id === currentUser?.id ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`text-2xl font-bold w-8 ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-orange-400' : 'text-muted'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {entry.name}
                        {entry.id === currentUser?.id && (
                          <span className="text-xs text-primary">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">
                        {entry.problems_solved} problems • {formatTime(entry.total_time)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {entry.total_points}
                    </div>
                    <div className="text-xs text-muted">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Members</h2>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-card border border-border rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {member.name}
                    {member.is_admin && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted">{member.email}</div>
                </div>
                
                {isAdmin && !member.is_admin && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="px-4 py-2 text-red-400 hover:bg-red-950/30 rounded-lg transition text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Problem Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <h2 className="text-2xl font-bold mb-6">Create New Problem</h2>

            <form onSubmit={handleCreateProblem} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Problem Title *
                </label>
                <input
                  type="text"
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="e.g., Two Sum"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform Link (Optional)
                </label>
                <input
                  type="url"
                  value={newProblem.platform_link}
                  onChange={(e) => setNewProblem({ ...newProblem, platform_link: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="https://leetcode.com/problems/two-sum/"
                />
                <p className="text-xs text-muted mt-1">
                  Link to LeetCode, HackerRank, or other platform
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => handleDifficultyChange(diff)}
                      className={`p-3 rounded-lg border-2 transition capitalize ${
                        newProblem.difficulty === diff
                          ? `border-${diff === 'easy' ? 'green' : diff === 'hard' ? 'red' : 'yellow'}-400 bg-${diff === 'easy' ? 'green' : diff === 'hard' ? 'red' : 'yellow'}-400/10`
                          : 'border-border hover:border-muted'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Points *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newProblem.points}
                  onChange={(e) => setNewProblem({ ...newProblem, points: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  required
                />
                <p className="text-xs text-muted mt-1">Points awarded when completed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  rows={6}
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="Describe the problem in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Examples (Optional)
                </label>
                <textarea
                  rows={4}
                  value={newProblem.examples}
                  onChange={(e) => setNewProblem({ ...newProblem, examples: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="Example 1:&#10;Input: nums = [2,7,11,15], target = 9&#10;Output: [0,1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Constraints (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newProblem.constraints}
                  onChange={(e) => setNewProblem({ ...newProblem, constraints: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="• 2 <= nums.length <= 10^4&#10;• -10^9 <= nums[i] <= 10^9"
                />
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
                    setNewProblem({ title: "", description: "", examples: "", constraints: "", platform_link: "" });
                    setCreateError("");
                  }}
                  className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-border/30 transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border">
            <h2 className="text-2xl font-bold mb-6">Invite Member</h2>

            <form onSubmit={handleInviteMember} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Member Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {inviteError && (
                <p className="text-red-400 text-sm">{inviteError}</p>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteError("");
                  }}
                  className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-border/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}