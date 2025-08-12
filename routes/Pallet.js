const express = require('express');
const router = express.Router();
const { putaway } = require('../controllers/PalletController');
const verifyToken = require('../utils/VerifyToken');

// Protect the route
router.use(verifyToken);

// Route for bulk pallet creation
router.post('/putaway', putaway);

module.exports = router;
