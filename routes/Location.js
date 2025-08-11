const express = require('express');
const router = express.Router();
const {
    createLocation,
    getAllLocations,
    getLocationById,
    findLocation,
    printBarcodes, // Import the new function
    updateLocation,
    deleteLocation
} = require('../controllers/LocationController');
const verifyToken = require('../utils/VerifyToken');

// Protect all location routes
router.use(verifyToken);

router.post('/', createLocation);
router.get('/', getAllLocations);
router.get('/find', findLocation);
router.get('/print-barcodes', printBarcodes); // Add the new print barcodes route
router.get('/:id', getLocationById);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

module.exports = router;
