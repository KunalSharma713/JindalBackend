const express = require('express');
const router = express.Router();
const { putaway, getAllPallets, movePallets,getPickUpPallets,findPallet,pickupPallets } = require('../controllers/PalletController');
const verifyToken = require('../utils/VerifyToken');

// Protect the route
router.use(verifyToken);

// Route for bulk pallet creation
router.post('/putaway', putaway);
router.get('/', getAllPallets);
router.post('/move', movePallets)
router.get('/pickup', getPickUpPallets);
router.post('/pickup', pickupPallets);
router.get('/find', findPallet);


module.exports = router;
