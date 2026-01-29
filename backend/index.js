const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      "https://dsa-arena-beta.vercel.app",
      "http://localhost:5173",
      "http://localhost:5000"
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // For development - change to false in production
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes       = require("./routes/authRoutes");
const groupRoutes      = require("./routes/groupRoutes");
const problemRoutes    = require("./routes/problemRoutes");
const groupProblemRoutes = require("./routes/groupProblemRoutes");
const memberRoutes     = require("./routes/memberRoutes");
const progressRoutes   = require("./routes/progressRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups", groupProblemRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/groups", memberRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "DSA Arena API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});