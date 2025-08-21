// Core modules and third-party packages
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectDB } = require("../config/database");
const fs = require("fs");

if (process.env.NODE_ENV === "production" && fs.existsSync(".env.production")) {
  require("dotenv").config({ path: ".env.production" });
  console.log("✅ Loaded .env.production");
} else {
  require("dotenv").config(); // fallback to default .env
  console.log("✅ Loaded .env");
}
require("dotenv").config();

// Importing route modules
const authRoutes = require("../routes/Auth");
const userRoutes = require("../routes/User");
const roleRoutes = require("../routes/Role");
const warehouseRoutes = require("../routes/Warehouse");
const locationRoutes = require("../routes/Location");
const palletBarcodeRoutes = require("../routes/PalletBarcode");
const palletRoutes = require("../routes/Pallet");
const barcodePrintRoutes = require("../routes/BarcodePrint");

// Initialize the Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded payloads
app.use(bodyParser.json()); // Parse JSON payloads

// Enable CORS for all origins
app.use(
  cors({
    origin: "*",
  })
);

const PORT = process.env.PORT || 5000;
console.log("🚀 Server running on port", PORT);

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
app.use("/api/pallet-barcode", palletBarcodeRoutes);
app.use("/api/pallet", palletRoutes);
app.use("/api/barcode-print", barcodePrintRoutes);
app.get("/", (req, res) => {
  res.send("Hello, This is main branch");
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || "An unexpected error occurred",
    data: error.data || null,
  });
});

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Initialize server
startServer();

// Export a handler for Vercel
module.exports = app;
