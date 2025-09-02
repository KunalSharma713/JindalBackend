const express = require("express");
const router = express.Router();
const {
  // Mobile auth controllers
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updatePassword,
  forgotPassword,
  resetPassword,

  // Web auth controllers
  registerUserWeb,
  loginUserWeb,
  refreshAccessTokenWeb,
  logoutUserWeb,
  updatePasswordWeb,
} = require("../controllers/AuthController");

const verifyToken = require("../utils/VerifyToken");

// Mobile authentication routes (existing)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.put("/update-password", verifyToken, updatePassword);

// Web authentication routes (new)
router.post("/web/register", registerUserWeb);
router.post("/web/login", loginUserWeb);
router.post("/web/refresh", refreshAccessTokenWeb);
router.post("/web/logout", logoutUserWeb);
router.put("/web/update-password", verifyToken, updatePasswordWeb);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
