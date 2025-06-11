const mongoose = require("mongoose")

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Boolean,
    required: true,
    default: true,
  },
  description: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Settings", settingsSchema)
