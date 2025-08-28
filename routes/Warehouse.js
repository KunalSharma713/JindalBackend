const express = require("express");
const router = express.Router();
const {
  // Mobile warehouse controllers
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,

  // Web warehouse controllers
  createWarehouseWeb,
  getAllWarehousesWeb,
  getWarehouseByIdWeb,
  updateWarehouseWeb,
  deleteWarehouseWeb,
} = require("../controllers/WarehouseController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);

// Web warehouse routes (must come before parameterized routes)
router.post("/web", createWarehouseWeb);
router.get("/web", getAllWarehousesWeb);
router.get("/web/:id", getWarehouseByIdWeb);
router.put("/web/:id", updateWarehouseWeb);
router.delete("/web/:id", deleteWarehouseWeb);

// Mobile warehouse routes
router.post("/", createWarehouse);
router.get("/", getAllWarehouses);
router.get("/:id", getWarehouseById);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

module.exports = router;
