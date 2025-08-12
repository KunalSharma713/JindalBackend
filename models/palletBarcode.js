const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const palletBarcodeSchema = new Schema({
    barcode_key: {
        type: String,
        // required: true,
        unique: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['new', 'assigned', 'used'],
        default: 'new'
    }
}, { timestamps: true });

// Pre-save hook to generate the barcode_key (DCIV0000001)
palletBarcodeSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const lastBarcode = await this.constructor.findOne({}).sort({ createdAt: -1 });

            let sequenceNumber = 1;
            if (lastBarcode && lastBarcode.barcode_key) {
                const lastSequence = parseInt(lastBarcode.barcode_key.replace('DCIV', ''), 10);
                if (!isNaN(lastSequence)) {
                    sequenceNumber = lastSequence + 1;
                }
            }

            const formattedSequence = String(sequenceNumber).padStart(7, '0');
            this.barcode_key = `DCIV${formattedSequence}`;

        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('PalletBarcode', palletBarcodeSchema);
