// src/components/layout/AppLayout.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function AppLayout({ children, activePage = "dashboard" }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        !event.target.closest("aside") &&
        !event.target.closest(".menu-toggle-btn")
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-bg text-white">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold text-xl">
              D
            </div>
            <h1 className="text-xl font-bold">DSA Arena</h1>
          </div>
          <button
            className="lg:hidden text-2xl text-muted hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activePage === "dashboard"
                ? "bg-primary/15 text-primary font-medium"
                : "hover:bg-white/5 text-muted hover:text-white"
            }`}
          >
            <span className="text-xl">🏠</span> Dashboard
          </button>

          <button
            onClick={() => navigate("/groups")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activePage === "groups"
                ? "bg-primary/15 text-primary font-medium"
                : "hover:bg-white/5 text-muted hover:text-white"
            }`}
          >
            <span className="text-xl">👥</span> Groups
          </button>

          <button
            onClick={() => navigate("/my-problems")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activePage === "my-problems"
                ? "bg-primary/15 text-primary font-medium"
                : "hover:bg-white/5 text-muted hover:text-white"
            }`}
          >
            <span className="text-xl">📝</span> My Problems
          </button>

          <button
            onClick={() => navigate("/profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activePage === "profile"
                ? "bg-primary/15 text-primary font-medium"
                : "hover:bg-white/5 text-muted hover:text-white"
            }`}
          >
            <span className="text-xl">👤</span> Profile
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-950/30 text-red-400 hover:text-red-300 mt-10 transition"
          >
            <span className="text-xl">🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <button className="menu-toggle-btn text-2xl" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold">
              D
            </div>
            <h1 className="text-lg font-bold">DSA Arena</h1>
          </div>

          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 pt-20 lg:pt-0 px-5 sm:px-6 md:px-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
  activePage: PropTypes.oneOf(["dashboard", "groups", "my-problems", "profile", "other"]),
};