// Core modules and third-party packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors")
require("dotenv").config();


// Importing route modules
const authRoutes = require("../routes/Auth");
const userRoutes = require("../routes/User");
const roleRoutes = require("../routes/Role");
const warehouseRoutes = require("../routes/Warehouse");
const locationRoutes = require("../routes/Location");


// Initialize the Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded payloads
app.use(bodyParser.json()); // Parse JSON payloads

// Enable CORS for all origins
app.use(cors({
    origin: "*"
}))

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;

// Set CORS headers for all responses
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// API route definitions
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/location", locationRoutes);
app.get('/', (req, res) => {
    res.send('Hello, This is main branch');
});


// Global error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.statusCode || 500).json({
        message: error.message || "An unexpected error occurred",
        data: error.data || null,
    });
});

// Database connection
mongoose
    .connect(DB_URL)
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MongoDB", err);
        process.exit(1);
    });

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Export a handler for Vercel
module.exports = app;