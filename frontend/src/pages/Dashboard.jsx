// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock data
  const user = {
    name: "Ayush",
    avatar: "https://i.pravatar.cc/150?u=ayush",
    points: 230,
    problemsSolved: 14,
    timeSpent: "9 hrs 15 mins",
    weeklyGoal: 100,
    weeklyProgress: 92,
  };

  return (
    <AppLayout activePage="dashboard">
      <h1 className="text-3xl sm:text-4xl font-bold mb-1">Hi {user.name}!</h1>
      <p className="text-muted mb-6 sm:mb-8">Here's your study progress so far</p>

      {/* Main stats card */}
      <div className="bg-card/80 backdrop-blur border border-border/60 rounded-2xl p-5 sm:p-7 shadow-xl">
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
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 flex-1 w-full sm:w-auto">
            <div className="text-center hover:scale-105 transition-transform">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {user.points}
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">points</div>
            </div>

            <div className="text-center hover:scale-105 transition-transform">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {user.problemsSolved}
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">solved</div>
            </div>

            <div className="text-center hover:scale-105 transition-transform">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {user.timeSpent.split(" ")[0]}
                <span className="text-lg sm:text-xl">h</span>
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">time spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* You can add more sections here later (recent activity, recommendations, etc.) */}
    </AppLayout>
  );
}