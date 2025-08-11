const express = require('express');
const router = express.Router();
const {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/WarehouseController');
const verifyToken = require('../utils/VerifyToken');

// Protect all warehouse routes
router.use(verifyToken);

router.post('/', createWarehouse);
router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

module.exports = router;
