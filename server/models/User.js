const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String, // sementara plaintext
  role: String // opsional: admin, sales, gudang
});

module.exports = mongoose.model('User', userSchema);
