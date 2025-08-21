const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
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
        type: String
    },
    mobile_no: {
        type: String
    },
    roleid: {
        type: Schema.Types.ObjectId,
        ref: "Roles",
        required: true,
    },
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: "Warehouse",   // <-- Relation to Warehouse
        required: false     // make true if every user must belong to a warehouse
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
