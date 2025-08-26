const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema(
  {
    location_name: {
      type: String,
      required: [true, "Location name is required."],
      trim: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse is required."],
    },
    barcode_key: {
      type: String,
      unique: true,
      uppercase: true,
    },
    lat: {
      type: Number,
      default: null,
    },
    long: {
      type: Number,
      default: null,
    },
    bulkuploadid: {
      type: Schema.Types.ObjectId,
      ref: "bulkupload",
    },
    isbulkupload: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate the barcode_key
locationSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // 1. Get the parent warehouse document
      const parentWarehouse = await mongoose
        .model("Warehouse")
        .findById(this.warehouse);
      if (!parentWarehouse) {
        throw new Error("Parent warehouse not found.");
      }
      const warehouseCode = parentWarehouse.code;

      // 2. Find the last location for this warehouse to determine the next sequence number
      const lastLocation = await this.constructor
        .findOne({ warehouse: this.warehouse })
        .sort({ createdAt: -1 });

      let sequenceNumber = 1;
      if (lastLocation && lastLocation.barcode_key) {
        // Extract the numeric part of the last barcode_key and increment it
        const lastSequence = parseInt(
          lastLocation.barcode_key.replace(warehouseCode, ""),
          10
        );
        if (!isNaN(lastSequence)) {
          sequenceNumber = lastSequence + 1;
        }
      }

      // 3. Format the number with leading zeros (to make it 7 digits)
      const formattedSequence = String(sequenceNumber).padStart(7, "0");

      // 4. Combine and set the barcode_key
      this.barcode_key = `${warehouseCode}${formattedSequence}`;
    } catch (error) {
      return next(error); // Pass error to the next middleware
    }
  }
  next();
});

module.exports = mongoose.model("Location", locationSchema);
