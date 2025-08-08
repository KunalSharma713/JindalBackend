const express = require('express');
const { createTruckType, createShipment, getShipmentDetails,
    getAllShipments, getAllTruckTypes, assignShipmentToCompany,
    assignDockNumber, getInTruck, ShipmentNumber, changeShipmentStatus
} = require('../controllers/Shipment');


const { AddTruckDetails } = require("../controllers/TruckInfo")
const router = express.Router();

router.get('/getshipment/:id', getShipmentDetails);
router.post('/createshipment', createShipment);
router.post('/getallshipment', getAllShipments);
router.post('/assignshipment', assignShipmentToCompany);
router.post('/createshipmentnumber', ShipmentNumber);
router.post('/changeshipmentstatus', changeShipmentStatus);
router.get('/getalltrucktype', getAllTruckTypes);
router.post('/createtrucktype', createTruckType);

// truck routes 
router.post('/createtruck', AddTruckDetails);
router.post('/assigndocknumber', assignDockNumber);
router.get('/getintruck/:shipmentId/', getInTruck);

module.exports = router;
