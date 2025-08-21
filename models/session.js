const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    refreshToken: { type: String, required: true, unique: true },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date, default: null },
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
