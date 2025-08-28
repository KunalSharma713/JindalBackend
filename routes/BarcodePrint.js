const express = require("express");
const router = express.Router();
const {
  // Mobile barcode print controllers
  getLocationBarcodes,
  getPalletBarcodes,

  // Web barcode print controllers
  getLocationBarcodesWeb,
  getPalletBarcodesWeb,
} = require("../controllers/BarcodePrintController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);
// Mobile barcode print routes (existing)
router.get("/locations", getLocationBarcodes);
router.get("/pallets", getPalletBarcodes);

// Web barcode print routes (new)
router.get("/web/locations", getLocationBarcodesWeb);
router.get("/web/pallets", getPalletBarcodesWeb);

module.exports = router;
