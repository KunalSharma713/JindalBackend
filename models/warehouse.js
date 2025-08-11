const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const warehouseSchema = new Schema({
    warehouse_name: {
        type: String,
        required: [true, 'Warehouse name is required.'],
        trim: true,
        minlength: [4, 'Warehouse name must be at least 4 characters long.'],
        validate: {
            validator: function(v) {
                // Allows letters, numbers, spaces, and dashes
                return /^[a-zA-Z0-9\s-]+$/.test(v);
            },
            message: props => `${props.value} is not a valid warehouse name!`
        }
    },
    code: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    lat: {
        type: Number,
        default: null
    },
    long: {
        type: Number,
        default: null
    }
}, { timestamps: true });

// Pre-save hook to generate the warehouse code
warehouseSchema.pre('save', async function(next) {
    if (this.isModified('warehouse_name') || this.isNew) {
        const words = this.warehouse_name.trim().split(/\s+/);
        let baseCode = '';

        if (words.length >= 4) {
            baseCode = words.slice(0, 4).map(w => w[0]).join('');
        } else if (words.length === 3) {
            baseCode = `${words[0].substring(0, 2)}${words[1][0]}${words[2][0]}`;
        } else if (words.length === 2) {
            baseCode = `${words[0].substring(0, 3)}${words[1][0]}`;
        } else if (words.length === 1) {
            baseCode = words[0].substring(0, 4);
        }

        baseCode = baseCode.toUpperCase();

        let finalCode = baseCode;
        let counter = 1;
        const Warehouse = this.constructor;

        // Ensure code uniqueness
        while (await Warehouse.findOne({ code: finalCode })) {
            finalCode = `${baseCode}${counter}`;
            counter++;
        }
        this.code = finalCode;
    }
    next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
