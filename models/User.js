const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  roles: [{ type: String }], // Örnek: ['admin', 'editor']
  marketplaceTermsAccepted: { type: Boolean, default: false }, // Pazaryeri şartlarını kabul etme durumu
  displayName: { type: String },
  Adi: { type: String },
  Soyadi: { type: String },
  Organizasyon: { type: String },
  Departman: { type: String },
  Unvan: { type: String },
  RaporlandigiYonetici: { type: String },
  RaporlandigiYoneticiEMail: { type: String },
  UstOrganizasyon: { type: String },
  OgrenimSeviyesi: { type: String },
  PersonelinKullandigiDil: { type: String },
  CepTelefonu: { type: String },
  DahiliNumarasi: { type: String },
  lastLoginDate: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)

module.exports = User
