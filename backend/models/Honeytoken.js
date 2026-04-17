const mongoose = require('mongoose');

const HoneytokenSchema = new mongoose.Schema({
    tokenId: { type: String, required: true, unique: true },
    tokenType: { type: String, enum: ['AWS_KEY', 'PDF_PIXEL', 'DB_CREDS'], required: true },
    tokenData: { type: Object }, // NEW FIELD: Stores the actual fake credentials
    status: { type: String, enum: ['ACTIVE', 'TRIGGERED'], default: 'ACTIVE' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Honeytoken', HoneytokenSchema);