const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
    docName: { type: String, required: true },
    docLink: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    count: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doc', docSchema);
