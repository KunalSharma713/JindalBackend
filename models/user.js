const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
  },
  mobile_no: {
    type: String,
  },
  roleid: {
    type: Schema.Types.ObjectId,
    ref: "Roles",
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: "Warehouse",
    required: function () {
      return this._roleSlug !== "super_admin";
    },
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

module.exports = mongoose.model("Users", userSchema);
