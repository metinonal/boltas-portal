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
    phoneNumber: {
      type: String,
      default: "", // Kullanıcının girdiği telefon numarası
    },
    status: {
      type: String,
      enum: ["beklemede", "onaylandı", "reddedildi"],
      default: "beklemede",
    },
    rejectionReason: {
      type: String,
      default: "", // Red nedeni
    },
    location: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSold: {
      type: Boolean,
      default: false, // Satıldı durumu
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: () => {
        // 15 gün sonra expire olacak
        return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
    },
    favoritedBy: [
      {
        type: String, // User email'leri
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model("Product", productSchema)
