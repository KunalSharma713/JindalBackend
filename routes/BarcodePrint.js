const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/BarcodePrintController');

router.get('/locations', barcodeController.getLocationBarcodes);
router.get('/pallets', barcodeController.getPalletBarcodes);

module.exports = router;