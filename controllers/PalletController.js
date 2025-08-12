const mongoose = require('mongoose');
const Pallet = require('../models/pallet');
const PalletBarcode = require('../models/palletBarcode');
const Location = require('../models/location');

// Perform a bulk putaway of pallets
const putaway = async (req, res) => {
    const { location_id, pallets } = req.body;

    // Basic validation
    if (!location_id || !pallets || !Array.isArray(pallets) || pallets.length === 0) {
        return res.status(400).json({ message: 'Invalid request body. Please provide a location_id and a non-empty array of pallets.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate the location
        const location = await Location.findById(location_id).session(session);
        if (!location) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: `Location with ID '${location_id}' not found.` });
        }

        const createdPallets = [];
        const errors = [];

        // 2. Process each pallet in the array
        for (const p of pallets) {
            const { barcodekey, size = "1X1", quantity = 1 } = p;

            // Find the barcode
            const barcode = await PalletBarcode.findOne({ barcode_key: barcodekey }).session(session);

            if (!barcode) {
                errors.push({ barcodekey, message: `Barcode '${barcodekey}' not found.` });
                continue; // Move to the next pallet
            }

            if (barcode.status !== 'new') {
                errors.push({ barcodekey, message: `Barcode '${barcodekey}' is already '${barcode.status}' and cannot be used.` });
                continue; // Move to the next pallet
            }

            // Create the new pallet
            const newPallet = new Pallet({
                size,
                quantity,
                location: location_id,
                pallet_barcode: barcode._id
            });
            const savedPallet = await newPallet.save({ session });

            // Update the barcode's status
            barcode.status = 'assigned';
            await barcode.save({ session });

            createdPallets.push(savedPallet);
        }

        // 3. Check for errors and commit or abort the transaction
        if (errors.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: 'Putaway failed. Some barcodes could not be processed.',
                errors
            });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Putaway successful. All pallets have been created and assigned.',
            data: createdPallets
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'An unexpected server error occurred during the transaction.', error: error.message });
    }
};


const getAllPallets = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.location) {
            filter.location = req.query.location;
        }
        if (req.query.size) {
            filter.size = { $regex: req.query.size, $options: 'i' };
        }
        if (req.query.sequence) {
            filter.sequence = { $regex: req.query.sequence, $options: 'i' };
        }
        // Filter by barcode key
        if (req.query.barcode) {
            const palletBarcodeDoc = await PalletBarcode.findOne({ barcode_key: req.query.barcode.toUpperCase() });
            if (palletBarcodeDoc) {
                filter.pallet_barcode = palletBarcodeDoc._id;
            } else {
                return res.json({
                    message: 'Pallets retrieved successfully.',
                    data: [],
                    pagination: { total: 0, page, limit, totalPages: 0 }
                });
            }
        }

        const sort = {};
        if (req.query.sortBy && req.query.sortOrder) {
            sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const pallets = await Pallet.find(filter)
            .populate('pallet_barcode')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Pallet.countDocuments(filter);

        res.json({
            message: 'Pallets retrieved successfully.',
            data: pallets,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pallets.', error: error.message });
    }
};





module.exports = {
    putaway,
    getAllPallets
};
