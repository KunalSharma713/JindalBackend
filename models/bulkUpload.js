const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bulkuploadSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
  },
  total_records: {
    type: Number,
    default: 0,
  },
  total_success: {
    type: Number,
    default: 0,
  },
  total_error: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("bulkupload", bulkuploadSchema);
