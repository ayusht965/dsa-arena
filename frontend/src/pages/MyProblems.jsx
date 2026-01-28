// src/pages/MyProblems.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";

export default function MyProblems() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await API.get('/progress/my-problems');
      setProblems(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusInfo = (status) => {
    switch(status) {
      case 'completed':
        return { icon: '✓', color: 'text-green-400', label: 'Completed' };
      case 'in_progress':
        return { icon: '⟳', color: 'text-yellow-400', label: 'In Progress' };
      default:
        return { icon: '○', color: 'text-gray-400', label: 'Not Started' };
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} mins`;
  };

  const stats = {
    total: problems.length,
    completed: problems.filter(p => p.status === 'completed').length,
    in_progress: problems.filter(p => p.status === 'in_progress').length,
    not_started: problems.filter(p => p.status === 'not_started').length,
  };

  if (loading) {
    return (
      <AppLayout activePage="my-problems">
        <div className="text-center py-16 text-muted">Loading your problems...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout activePage="my-problems">
        <div className="text-center py-16 text-red-400">{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePage="my-problems">
      <h1 className="text-3xl font-bold mb-2">My Problems</h1>
      <p className="text-muted mb-8">
        All problems assigned to you across your groups (including historical records)
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted">Total</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-sm text-muted">Completed</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.in_progress}</div>
          <div className="text-sm text-muted">In Progress</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-400">{stats.not_started}</div>
          <div className="text-sm text-muted">Not Started</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
            filter === 'all' 
              ? 'bg-primary/20 text-primary' 
              : 'bg-card border border-border hover:bg-card/80'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
            filter === 'in_progress' 
              ? 'bg-yellow-400/20 text-yellow-400' 
              : 'bg-card border border-border hover:bg-card/80'
          }`}
        >
          In Progress ({stats.in_progress})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
            filter === 'completed' 
              ? 'bg-green-400/20 text-green-400' 
              : 'bg-card border border-border hover:bg-card/80'
          }`}
        >
          Completed ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('not_started')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
            filter === 'not_started' 
              ? 'bg-gray-400/20 text-gray-400' 
              : 'bg-card border border-border hover:bg-card/80'
          }`}
        >
          Not Started ({stats.not_started})
        </button>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12 text-muted">
            {filter === 'all' 
              ? "No problems assigned yet. Join a group to get started!" 
              : `No ${filter.replace('_', ' ')} problems.`
            }
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const statusInfo = getStatusInfo(problem.status);
            const isProblemDeleted = problem.deleted_at !== null;
            const isGroupDeleted = problem.group_deleted_at !== null;
            
            return (
              <div
                key={problem.id}
                className={`bg-card border border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition ${
                  isProblemDeleted || isGroupDeleted ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-xl font-bold">{problem.title}</h3>
                      {isProblemDeleted && (
                        <span className="text-xs bg-red-950/50 text-red-400 px-2 py-1 rounded">
                          Problem Deleted
                        </span>
                      )}
                      {isGroupDeleted && (
                        <span className="text-xs bg-orange-950/50 text-orange-400 px-2 py-1 rounded">
                          Group Deleted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1">
                      From: {problem.group_name}
                      {isGroupDeleted && " (Deleted)"}
                    </p>
                  </div>
                  <span className={`font-medium ${statusInfo.color} flex items-center gap-1`}>
                    <span>{statusInfo.icon}</span> {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-muted">Time Spent</div>
                    <div className="font-medium">{formatTime(problem.time_spent)}</div>
                  </div>
                  {problem.completed_at && (
                    <div>
                      <div className="text-muted">Completed</div>
                      <div className="font-medium">
                        {new Date(problem.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {isProblemDeleted && (
                    <div>
                      <div className="text-muted">Deleted</div>
                      <div className="font-medium text-red-400">
                        {new Date(problem.deleted_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {problem.notes && (
                  <div className="bg-bg/50 rounded-lg p-3 mb-4 text-sm text-gray-300">
                    <div className="text-muted text-xs mb-1">Notes:</div>
                    {problem.notes}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/problems/${problem.id}`)}
                  className="w-full sm:w-auto px-6 py-3 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/30 transition"
                >
                  {problem.status === 'not_started' ? 'Start Problem' : 'View Details'} →
                </button>
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}