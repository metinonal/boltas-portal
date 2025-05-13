const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ["Yeni", "Yeni Gibi", "İyi", "Makul", "Yıpranmış"],
      required: true,
    },
    images: [
      {
        type: String, // URL to the image
      },
    ],
    seller: {
      type: String, // User's email or ID
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerTitle: {
      type: String,
      default: "",
    },
    sellerPhone: {
      type: String,
    },
    status: {
      type: String,
      enum: ["beklemede", "onaylandı", "reddedildi"],
      default: "beklemede",
    },
    location: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Product", productSchema)
