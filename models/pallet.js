const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const palletSchema = new Schema({
    sequence: {
        type: String,
        unique: true,
        // required: true,
        uppercase: true
    },
    size: {
        type: String,
        required: [true, 'Pallet size is required.']
    },
    last_moved_date: {
        type: Date
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: [true, 'Location is required.']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required.']
    },
    pallet_barcode: {
        type: Schema.Types.ObjectId,
        ref: 'PalletBarcode',
        required: [true, 'Pallet barcode is required.'],
        unique: true // A barcode can only be assigned to one pallet
    }
}, { timestamps: true });

// Pre-save hook to generate sequence and manage last_moved_date
palletSchema.pre('save', async function(next) {
    // 1. Generate the unique sequence (PL-0000001)
    if (this.isNew) {
        try {
            const lastPallet = await this.constructor.findOne({}).sort({ createdAt: -1 });

            let sequenceNumber = 1;
            if (lastPallet && lastPallet.sequence) {
                const lastSequence = parseInt(lastPallet.sequence.split('-')[1], 10);
                if (!isNaN(lastSequence)) {
                    sequenceNumber = lastSequence + 1;
                }
            }

            const formattedSequence = String(sequenceNumber).padStart(7, '0');
            this.sequence = `PL-${formattedSequence}`;

        } catch (error) {
            return next(error);
        }
    }

    // 2. Update last_moved_date on creation or location change
    if (this.isNew || this.isModified('location')) {
        this.last_moved_date = new Date();
    }

    next();
});

module.exports = mongoose.model('Pallet', palletSchema);
