const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-plugin-autoinc');

const palletSchema = new Schema({
    sequenceNumber: {
        type: Number,
        unique: true
    },
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


palletSchema.plugin(autoIncrement.plugin, {
    model: 'Pallet',
    field: 'sequenceNumber',
    startAt: 1,
    incrementBy: 1
});

// Pre-save hook to generate sequence and manage last_moved_date
palletSchema.pre('save', async function (next) {
    // 1. Generate the unique sequence (PL-0000001)
    if (this.isNew && this.sequenceNumber != null) {
        this.sequence = `PL-${String(this.sequenceNumber).padStart(7, '0')}`;
    }
    // 2. Update last_moved_date on creation or location change
    if (this.isNew) {
        this.last_moved_date = new Date();
    }
    next();
});

module.exports = mongoose.model('Pallet', palletSchema);
