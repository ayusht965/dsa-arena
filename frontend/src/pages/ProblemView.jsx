// src/pages/ProblemView.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";

export default function ProblemView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [status, setStatus] = useState('not_started');
  const [timeSpent, setTimeSpent] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const problemRes = await API.get(`/problems/${id}`);
        setProblem(problemRes.data);

        const progressRes = await API.get(`/progress/${id}`);
        setProgress(progressRes.data);
        setStatus(progressRes.data.status || 'not_started');
        setTimeSpent(progressRes.data.time_spent || 0);
        setNotes(progressRes.data.notes || '');
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load problem");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      const res = await API.put(`/progress/${id}`, {
        status,
        time_spent: timeSpent,
        notes
      });
      setProgress(res.data);
      alert('Progress saved!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} mins`;
  };

  if (loading) return <div className="text-center py-16">Loading problem...</div>;
  if (error) return <div className="text-red-400 text-center py-16">{error}</div>;
  if (!problem) return <div className="text-center py-16">Problem not found</div>;

  return (
    <AppLayout activePage="my-problems">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-primary hover:text-primary/80 flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Header with Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{problem.title}</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              {status.replace('_', ' ').toUpperCase()}
            </span>
            {progress?.completed_at && (
              <span className="text-sm text-muted">
                Completed on {new Date(progress.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Problem Description */}
      <div className="bg-card p-6 rounded-2xl mb-6">
        <h2 className="text-2xl font-bold mb-4">Description</h2>
        <p className="text-gray-300 whitespace-pre-wrap">{problem.description}</p>
      </div>

      {problem.examples && (
        <div className="bg-card p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-4">Examples</h2>
          <pre className="whitespace-pre-wrap text-gray-300 bg-bg p-4 rounded-lg">{problem.examples}</pre>
        </div>
      )}

      {problem.constraints && (
        <div className="bg-card p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-4">Constraints</h2>
          <pre className="whitespace-pre-wrap text-gray-300 bg-bg p-4 rounded-lg">{problem.constraints}</pre>
        </div>
      )}

      {/* Progress Tracking Section */}
      <div className="bg-card p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6">Track Your Progress</h2>
        
        <div className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Status</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStatus('not_started')}
                className={`p-4 rounded-lg border-2 transition ${
                  status === 'not_started' 
                    ? 'border-gray-400 bg-gray-400/10' 
                    : 'border-border hover:border-gray-400/50'
                }`}
              >
                <div className="font-semibold">Not Started</div>
                <div className="text-xs text-muted mt-1">Haven't begun</div>
              </button>
              
              <button
                onClick={() => setStatus('in_progress')}
                className={`p-4 rounded-lg border-2 transition ${
                  status === 'in_progress' 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-border hover:border-yellow-400/50'
                }`}
              >
                <div className="font-semibold">In Progress</div>
                <div className="text-xs text-muted mt-1">Working on it</div>
              </button>
              
              <button
                onClick={() => setStatus('completed')}
                className={`p-4 rounded-lg border-2 transition ${
                  status === 'completed' 
                    ? 'border-green-400 bg-green-400/10' 
                    : 'border-border hover:border-green-400/50'
                }`}
              >
                <div className="font-semibold">Completed</div>
                <div className="text-xs text-muted mt-1">Solved it!</div>
              </button>
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Time Spent (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={timeSpent}
              onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
              className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
              placeholder="e.g., 45"
            />
            {timeSpent > 0 && (
              <p className="text-sm text-muted mt-1">
                That's {formatTime(timeSpent)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg bg-bg border border-border text-white focus:outline-none focus:border-primary"
              placeholder="Add notes about your approach, learnings, or difficulties..."
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProgress}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}