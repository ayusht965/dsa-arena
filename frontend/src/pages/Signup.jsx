import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
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
      const res = await API.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-4"
    >
      <h2 className="text-2xl font-bold text-white text-center mb-4">
        Create Account
      </h2>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
      />

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
      />

      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        className="w-full p-3 rounded-lg bg-transparent border border-border text-white placeholder-muted focus:outline-none focus:border-primary"
      />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        className="w-full py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition cursor-pointer"
      >
        Sign Up
      </button>

      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/")}
          className="text-secondary cursor-pointer hover:underline"
        >
          Login
        </span>
      </p>
    </form>
  </div>
);

}
