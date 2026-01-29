import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", { email: form.email }); // Debug log
      const res = await API.post("/auth/login", form);
      console.log("Login successful:", res.data); // Debug log
      
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err); // Debug log
      const errorMsg = err.response?.data?.msg || 
                       err.response?.data?.error || 
                       err.message ||
                       "Login failed. Please check your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-4"
      >
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Login
        </h2>

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
          required
          disabled={loading}
        />

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
          required
          disabled={loading}
        />

        {error && (
          <div className="bg-red-950/30 border border-red-400/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-muted text-center">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-secondary cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}