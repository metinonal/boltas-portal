const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
    docName: { type: String, required: true },
    docFile: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doc', docSchema);
