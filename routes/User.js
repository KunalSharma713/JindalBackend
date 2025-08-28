const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserWarehouse,
  deleteUser,
  createUserWeb,
  getAllUsersWeb,
  getUserWeb,
  updateUserWeb,
  updateUserRoleWeb,
  updateUserWarehouseWeb,
  deleteUserWeb,
} = require("../controllers/UserController");
const verifyToken = require("../utils/VerifyToken");

// Protect all user routes
router.use(verifyToken);

// Web user routes
router.post("/web", createUserWeb);
router.get("/web", getAllUsersWeb);
router.get("/web/:identifier", getUserWeb);
router.put("/web/:id", updateUserWeb);
router.patch("/web/:id/role", updateUserRoleWeb);
router.patch("/web/:id/warehouse", updateUserWarehouseWeb);
router.delete("/web/:id", deleteUserWeb);

// Mobile user routes
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:identifier", getUser);
router.put("/:id", updateUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/warehouse", updateUserWarehouse);
router.delete("/:id", deleteUser);

module.exports = router;
