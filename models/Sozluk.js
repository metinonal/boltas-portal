const mongoose = require("mongoose")

const sozlukSchema = new mongoose.Schema({
  kelime: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  anlam: {
    type: String,
    required: true,
    trim: true,
  },
  resim: {
    type: String,
    default: null,
  },
  harf: {
    type: String,
    required: true,
    uppercase: true,
    index: true,
  },
  kategori: {
    type: String,
    default: "Genel",
    trim: true,
  },
  aktif: {
    type: Boolean,
    default: true,
  },
  olusturanKullanici: {
    type: String,
    required: true,
  },
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
})

// Kelime kaydedilmeden önce ilk harfi otomatik belirle
sozlukSchema.pre("save", function (next) {
  if (this.kelime) {
    this.harf = this.kelime.charAt(0).toUpperCase()
  }
  this.guncellemeTarihi = new Date()
  next()
})

// Text search için index
sozlukSchema.index({ kelime: "text", anlam: "text" })

module.exports = mongoose.model("Sozluk", sozlukSchema)
