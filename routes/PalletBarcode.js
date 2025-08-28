const express = require("express");
const router = express.Router();
const {
  // Mobile pallet barcode controllers
  generateBarcodes,
  getAllBarcodes,

  // Web pallet barcode controllers
  generateBarcodesWeb,
  getAllBarcodesWeb,
} = require("../controllers/PalletBarcodeController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);
// Mobile pallet barcode routes (existing)
router.post("/generate", generateBarcodes);
router.get("/", getAllBarcodes);

// Web pallet barcode routes (new)
router.post("/web/generate", generateBarcodesWeb);
router.get("/web", getAllBarcodesWeb);

module.exports = router;
