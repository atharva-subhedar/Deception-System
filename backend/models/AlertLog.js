const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  trapId: String,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  // 👇 ADD THIS NEW SECTION 👇
  location: {
    city: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    isp: { type: String, default: "Unknown" },
    lat: { type: Number },
    lon: { type: Number }
  }
});

module.exports = mongoose.model('AlertLog', alertLogSchema);