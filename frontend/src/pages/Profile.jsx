import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    avatar_url: "",
    weekly_goal: 5,
    github_username: "",
    linkedin_url: "",
    created_at: ""
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile");
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load profile");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await API.put("/user/profile", {
        name: profile.name,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        weekly_goal: parseInt(profile.weekly_goal),
        github_username: profile.github_username || null,
        linkedin_url: profile.linkedin_url || null
      });

      setProfile(res.data);
      setSuccessMessage("Profile updated successfully!");
      setEditMode(false);
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfile();
    setEditMode(false);
    setError("");
  };

  if (loading) {
    return (
      <AppLayout activePage="profile">
        <div className="text-center py-16 text-muted">Loading profile...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePage="profile">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-5 py-2.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-950/30 border border-green-400/50 rounded-lg p-4 mb-6 text-green-400">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-400/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=random`}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-2 border-primary/40 object-cover"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={profile.avatar_url || ""}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={!editMode}
                />
                <p className="text-xs text-muted mt-1">
                  Leave blank to use default avatar
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  required
                  disabled={!editMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-muted cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  rows={4}
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary disabled:opacity-50 resize-none"
                  placeholder="Tell us about yourself..."
                  disabled={!editMode}
                  maxLength={500}
                />
                <p className="text-xs text-muted mt-1">
                  {(profile.bio || "").length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Weekly Goal</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                Problems per week: {profile.weekly_goal}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={profile.weekly_goal}
                onChange={(e) => setProfile({ ...profile, weekly_goal: e.target.value })}
                className="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>0</span>
                <span>25</span>
                <span>50</span>
              </div>
              <p className="text-sm text-muted mt-3">
                Set your weekly goal for problem solving. This helps track your progress on the dashboard.
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>GitHub Username</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={profile.github_username || ""}
                  onChange={(e) => setProfile({ ...profile, github_username: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="yourusername"
                  disabled={!editMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>LinkedIn URL</span>
                  </span>
                </label>
                <input
                  type="url"
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="https://linkedin.com/in/yourusername"
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Account Information</h2>
            <div className="text-sm text-muted">
              <p>Member since: {new Date(profile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {editMode && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-border/30 transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}