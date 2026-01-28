// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import API from "../api/api";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subYears, format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const TOOLTIP_WIDTH = 260;
  const TOOLTIP_HEIGHT = 180;
  const OFFSET = 12;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get("/dashboard/stats");
      setDashboardData(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load dashboard");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} mins`;
  };

  if (loading) {
    return (
      <AppLayout activePage="dashboard">
        <div className="text-center py-16 text-muted">Loading dashboard...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout activePage="dashboard">
        <div className="text-center py-16 text-red-400">{error}</div>
      </AppLayout>
    );
  }

  const { user, stats, recentActivity, heatmapData } = dashboardData || {};

  const heatmapValues =
    heatmapData?.map(item => ({
      date: item.date,
      count: item.count || 0,
      problems: item.problems || []
    })) || [];

    const getTooltipStyle = () => {
    const { innerWidth, innerHeight } = window;

    let left = hoverPosition.x + OFFSET;
    let top = hoverPosition.y + OFFSET;

    // If tooltip goes beyond right edge → show on left
    if (left + TOOLTIP_WIDTH > innerWidth) {
      left = hoverPosition.x - TOOLTIP_WIDTH - OFFSET;
    }

    // If tooltip goes beyond bottom edge → show above
    if (top + TOOLTIP_HEIGHT > innerHeight) {
      top = hoverPosition.y - TOOLTIP_HEIGHT - OFFSET;
    }

    return { left, top };
  };

  return (
    <AppLayout activePage="dashboard">
      <h1 className="text-3xl sm:text-4xl font-bold mb-1">Hi {user.name}!</h1>
      <p className="text-muted mb-6 sm:mb-8">Here's your study progress so far</p>

      {/* Main stats card */}
      <div className="bg-card/80 backdrop-blur border border-border/60 rounded-2xl p-5 sm:p-7 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/40 object-cover flex-shrink-0"
            />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 flex-1 w-full sm:w-auto">
            <div className="text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {stats.points}
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">points</div>
            </div>

            <div className="text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {stats.problemsSolved}
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">solved</div>
            </div>

            <div className="text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {Math.floor(stats.totalMinutes / 60)}
                <span className="text-lg sm:text-xl">h</span>
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">time spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* In Progress */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">In Progress</h3>
            <span className="text-2xl">🔄</span>
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {stats.inProgress}
          </div>
          <p className="text-sm text-muted">problems being worked on</p>
        </div>

        {/* Weekly Goal */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Weekly Goal</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-3xl font-bold text-primary mb-2">
            {stats.weeklySolved}/{stats.weeklyGoal}
          </div>
          <div className="w-full bg-border/40 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.weeklyProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted">{stats.weeklyProgress}% complete</p>
        </div>

        {/* Total Time */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Time</h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {stats.timeSpent}
          </div>
          <p className="text-sm text-muted">spent practicing</p>
        </div>
      </div>

      {/* Heatmap Section - NEW */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">Activity Heatmap</h2>
        <p className="text-muted mb-4">Your problem-solving activity over the last year</p>

        <div
          className="relative"
          onMouseLeave={() => setHoveredDay(null)}
        >
          <CalendarHeatmap
            startDate={subYears(new Date(), 1)}
            endDate={new Date()}
            values={heatmapValues}
            showWeekdayLabels
            classForValue={(value) => {
              if (!value || value.count === 0) return "color-empty";
              if (value.count <= 2) return "color-scale-1";
              if (value.count <= 5) return "color-scale-2";
              if (value.count <= 10) return "color-scale-3";
              return "color-scale-4";
            }}
            tooltipDataAttrs={null}
            transformDayElement={(element, value) => {
              if (!value) return element;

              return (
                <g
                  onMouseEnter={(e) => {
                    setHoveredDay(value);
                    setHoverPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setHoverPosition({ x: e.clientX, y: e.clientY });
                  }}
                >
                  {element}
                </g>
              );
            }}
          />

          {/* Hover Tooltip */}
          {hoveredDay && (
            <div
              className="fixed z-50 bg-card border border-border rounded-xl p-4 shadow-xl w-64 pointer-events-none"
              style={getTooltipStyle()}
            >
              <p className="font-semibold mb-1">
                {format(new Date(hoveredDay.date), "MMM d, yyyy")}
              </p>

              <p className="text-sm text-muted mb-2">
                {hoveredDay.count} problem{hoveredDay.count !== 1 && "s"} solved
              </p>

              {hoveredDay.problems.length > 0 && (
                <ul className="text-sm space-y-1 max-h-32 overflow-auto">
                  {hoveredDay.problems.map((p) => (
                    <li key={p.id} className="truncate">
                      • {p.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>


        <div className="flex justify-end mt-4 text-sm text-muted">
          <span className="mr-2">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-800"></div>
            <div className="w-4 h-4 bg-blue-900"></div>
            <div className="w-4 h-4 bg-blue-700"></div>
            <div className="w-4 h-4 bg-blue-500"></div>
            <div className="w-4 h-4 bg-blue-300"></div>
          </div>
          <span className="ml-2">More</span>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between p-4 bg-bg/50 rounded-xl hover:bg-bg/70 transition cursor-pointer"
                onClick={() => navigate(`/problems/${activity.id}`)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{activity.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span>📁 {activity.group_name}</span>
                    <span>⏱️ {formatTime(activity.time_spent)}</span>
                    <span>
                      ✅ {new Date(activity.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-green-400 text-2xl">✓</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/my-problems")}
            className="w-full mt-6 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-medium"
          >
            View All Problems →
          </button>
        </div>
      )}

      {/* Empty state for no activity */}
      {recentActivity.length === 0 && stats.problemsSolved === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold mb-2">Ready to start?</h3>
          <p className="text-muted mb-6">
            Join a group and start solving problems to see your progress here!
          </p>
          <button
            onClick={() => navigate("/groups")}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition"
          >
            Explore Groups
          </button>
        </div>
      )}
    </AppLayout>
  );
}