const express = require("express");
const router = express.Router();
const {
  // Mobile role controllers
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,

  // Web role controllers
  createRoleWeb,
  getAllRolesWeb,
  getRoleByIdWeb,
  updateRoleWeb,
  deleteRoleWeb,
} = require("../controllers/RoleController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);

// Web role routes (new)
router.post("/web", createRoleWeb);
router.get("/web", getAllRolesWeb);
router.get("/web/:id", getRoleByIdWeb);
router.put("/web/:id", updateRoleWeb);
router.delete("/web/:id", deleteRoleWeb);

// Mobile role routes (existing)
router.post("/", createRole);
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

module.exports = router;
