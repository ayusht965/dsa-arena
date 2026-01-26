// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard"); // or "/groups" if that's your post-login route
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Check your credentials.");
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
        />

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
          required
        />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition"
        >
          Login
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