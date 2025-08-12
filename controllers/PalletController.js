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

const movePallets = async (req, res) => {
    const { old_location, new_location, pallets } = req.body;

    // Validation checks (These are good, so we'll keep them)
    if (!old_location || !new_location || !pallets || !Array.isArray(pallets) || pallets.length === 0) {
        return res.status(400).json({ message: 'Invalid request body. Please provide old_location, new_location, and a non-empty array of pallet barcode IDs.' });
    }

    if (old_location === new_location) {
        return res.status(400).json({ message: 'Old location and new location cannot be the same.' });
    }

    // Start a Mongoose session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify locations exist within the transaction
        const [oldLocation, newLocation] = await Promise.all([
            Location.findById(old_location).session(session),
            Location.findById(new_location).session(session)
        ]);

        if (!oldLocation || !newLocation) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'One or both locations not found.' });
        }

        const uniquePallets = [...new Set(pallets)];

        // Use a simple for...of loop for sequential processing.
        // This is not the most performant, but it's what your original code used and it ensures
        // the session context is maintained correctly for each step.
        for (const barcodeId of uniquePallets) {
            const palletBarcode = await PalletBarcode.findOne({ barcode_key: barcodeId }).session(session);

            if (!palletBarcode) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Pallet barcode with ID '${barcodeId}' not found.` });
            }

            // Find the pallet and ensure it's in the correct old location
            const pallet = await Pallet.findOne({ pallet_barcode: palletBarcode._id, location: old_location }).session(session);

            if (!pallet) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Pallet with barcode '${barcodeId}' not found in the old location.` });
            }

            // Update the pallet's location and save it within the session
            pallet.location = new_location;
            pallet.last_moved_date = new Date()
            await pallet.save({ session });
        }

        // All operations succeeded, commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Pallets moved successfully.' });

    } catch (error) {
        // Abort the transaction on any error
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Server error during pallet move.', error: error.message });
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
            .populate('pallet_barcode', "barcode_key _id status")
            .populate('location', "location_name barcode_key _id")
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


const getPickUpPallets = async (req, res) => {
    try {
        const palletsByLocation = await Pallet.aggregate([
            {
                // Join with the palletbarcodes collection to get barcode details
                $lookup: {
                    from: 'palletbarcodes',
                    localField: 'pallet_barcode',
                    foreignField: '_id',
                    as: 'palletBarcodeDetails'
                }
            },
            {
                // Unwind the array created by $lookup
                $unwind: '$palletBarcodeDetails'
            },
            {
                // Group pallets by location
                $group: {
                    _id: '$location',
                    totalQuantity: { $sum: '$quantity' },
                    pallets: {
                        $push: {
                            _id: '$_id',
                            sequence: '$sequence',
                            size: '$size',
                            pallet_barcode: '$palletBarcodeDetails.barcode_key', // Get the barcode key
                            quantity: '$quantity',
                        }
                    }
                }
            },
            {
                // Join with the locations collection to get location details
                $lookup: {
                    from: 'locations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'locationDetails'
                }
            },
            {
                // Unwind the location details array
                $unwind: '$locationDetails'
            },
            {
                // Shape the final output
                $project: {
                    _id: '$locationDetails._id',
                    location_name: '$locationDetails.location_name',
                    totalQuantity: 1,
                    pallets: 1
                }
            }
        ]);
        
        res.json({
            message: 'All pallets retrieved successfully.',
            data: palletsByLocation,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pallets.', error: error.message });
    }
};


const findPallet = async (req, res) => {
    try {
        const { barcode, sequence, id } = req.query;

        let filter = null;

        if (id) {
            filter = { _id: id };
        } else if (barcode) {
            // Find the barcode document first
            const palletBarcodeDoc = await PalletBarcode.findOne({ barcode_key: barcode });
            if (!palletBarcodeDoc) {
                return res.status(404).json({ message: 'No pallet found with the given barcode.' });
            }
            filter = { pallet_barcode: palletBarcodeDoc._id };
        } else if (sequence) {
            filter = { sequence: sequence };
        } else {
            return res.status(400).json({ message: 'Please provide barcode, sequence, or id as query parameter.' });
        }

        const pallet = await Pallet.findOne(filter)
            .populate('pallet_barcode', "barcode_key _id status")
            .populate('location', "location_name barcode_key _id");

        if (!pallet) {
            return res.status(404).json({ message: 'Pallet not found.' });
        }

        res.json({
            message: 'Pallet retrieved successfully.',
            data: pallet
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pallet.', error: error.message });
    }
};



module.exports = {
    putaway,
    getAllPallets,
    movePallets,
    getPickUpPallets,
    findPallet
};
