const Location = require('../models/location');
const Warehouse = require('../models/warehouse');

// Create a new location
const createLocation = async (req, res) => {
    const { location_name, warehouse, lat, long } = req.body;

    try {
        // Check if the parent warehouse exists
        const parentWarehouse = await Warehouse.findById(warehouse);
        if (!parentWarehouse) {
            return res.status(404).json({ message: 'Parent warehouse not found.' });
        }

        const newLocation = await Location.create({ location_name, warehouse, lat, long });
        res.status(201).json({ message: 'Location created successfully.', location: newLocation });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating location.', error: error.message });
    }
};

// Get all locations with filtering and pagination
const getAllLocations = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.warehouse) {
            filter.warehouse = req.query.warehouse; // Filter by warehouse ID
        }
        if (req.query.name) {
            filter.location_name = { $regex: req.query.name, $options: 'i' };
        }

        const locations = await Location.find(filter)
            .populate('warehouse', 'warehouse_name code') // Populate warehouse details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await Location.countDocuments(filter);

        res.json({
            message: 'Locations retrieved successfully.',
            data: locations,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching locations.', error: error.message });
    }
};

// Get a single location by ID
const getLocationById = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id).populate('warehouse', 'warehouse_name code');
        if (!location) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching location.', error: error.message });
    }
};

// Update a location
const updateLocation = async (req, res) => {
    const { location_name, lat, long } = req.body;
    try {
        const location = await Location.findByIdAndUpdate(
            req.params.id,
            { location_name, lat, long },
            { new: true, runValidators: true }
        );
        if (!location) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        res.json({ message: 'Location updated successfully.', location });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating location.', error: error.message });
    }
};

// Delete a location
const deleteLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        res.json({ message: 'Location deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting location.', error: error.message });
    }
};

// Find a single location by name, barcode, or warehouse code
const findLocation = async (req, res) => {
    const { name, barcode, warehouseCode } = req.query;
    let query = {};

    try {
        if (name) {
            query.location_name = { $regex: name, $options: 'i' }; // Exact match, case-insensitive
        } else if (barcode) {
            query.barcode_key = barcode.toUpperCase();
        } else if (warehouseCode) {
            // First, find the warehouse by its code to get its ID
            const warehouse = await Warehouse.findOne({ code: warehouseCode.toUpperCase() });
            if (!warehouse) {
                return res.status(404).json({ message: 'No warehouse found with that code.' });
            }
            // Then, use the warehouse ID to find the location
            query.warehouse = warehouse._id;
        } else {
            return res.status(400).json({ message: 'Please provide a search query (name, barcode, or warehouseCode).' });
        }

        const location = await Location.findOne(query).populate('warehouse', 'warehouse_name code');

        if (!location) {
            return res.status(404).json({ message: 'Location not found.' });
        }

        res.json(location);
    } catch (error) {
        res.status(500).json({ message: 'Server error while finding location.', error: error.message });
    }
};

// Get all barcodes for printing
const printBarcodes = async (req, res) => {
    try {
        // Find all locations and select only the barcode_key and location_name fields
        const locations = await Location.find({}).select('barcode_key location_name -_id');

        res.json({
            message: 'All barcodes retrieved successfully.',
            data: locations
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching barcodes.', error: error.message });
    }
};

module.exports = {
    createLocation,
    getAllLocations,
    getLocationById,
    findLocation,
    printBarcodes, // Export the new function
    updateLocation,
    deleteLocation
};
