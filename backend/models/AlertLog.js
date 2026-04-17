const mongoose = require('mongoose');

const AlertLogSchema = new mongoose.Schema({
    tokenId: { type: String, required: true },
    attackerIp: { type: String, required: true },
    userAgent: { type: String, required: true },
    triggerTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlertLog', AlertLogSchema);