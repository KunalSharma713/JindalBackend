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
                F
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

module.exports = {
    putaway
};
