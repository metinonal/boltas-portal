const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  roles: [{ type: String }] // Örnek: ['admin', 'editor']
});

const User = mongoose.model('User', userSchema);

module.exports = User;
