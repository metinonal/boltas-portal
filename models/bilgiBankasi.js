const mongoose = require('mongoose');

const bilgiBankasiSchema = new mongoose.Schema({
    header: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, required: true },
    img: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('bilgiBankasi', bilgiBankasiSchema);
