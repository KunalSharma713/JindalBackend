const express = require("express");
const router = express.Router();
const {
  // Mobile location controllers
  createLocation,
  getAllLocations,
  getLocationById,
  findLocation,
  printBarcodes,
  updateLocation,
  deleteLocation,

  // Web location controllers
  createLocationWeb,
  getAllLocationsWeb,
  getLocationByIdWeb,
  findLocationWeb,
  printBarcodesWeb,
  updateLocationWeb,
  deleteLocationWeb,
} = require("../controllers/LocationController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);

// Web location routes (must come before parameterized routes)
router.post("/web", createLocationWeb);
router.get("/web", getAllLocationsWeb);
router.get("/web/find", findLocationWeb);
router.get("/web/print-barcodes", printBarcodesWeb);
router.get("/web/:id", getLocationByIdWeb);
router.put("/web/:id", updateLocationWeb);
router.delete("/web/:id", deleteLocationWeb);

// Mobile location routes
router.post("/", createLocation);
router.get("/", getAllLocations);
router.get("/find", findLocation);
router.get("/print-barcodes", printBarcodes);
router.get("/:id", getLocationById);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

module.exports = router;
