const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String },
    link: { type: String },
    isActive: { type: Boolean, default: true },
    isMain: { type: Boolean, default: false }, // Yeni alan eklendi
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Slider', sliderSchema);
