const express = require('express');
const router = express.Router();
const { generateBarcodes, getAllBarcodes } = require('../controllers/PalletBarcodeController');
const verifyToken = require('../utils/VerifyToken');

// Protect the route
router.use(verifyToken);

// Route to generate new barcodes
// e.g., POST /api/pallet-barcode/generate?count=10
router.post('/generate', generateBarcodes);

// Route to get all barcodes with filtering, sorting, and pagination
// e.g., GET /api/pallet-barcode?status=new&search=DCIV&sortBy=createdAt&sortOrder=asc
router.get('/', getAllBarcodes);

module.exports = router;
