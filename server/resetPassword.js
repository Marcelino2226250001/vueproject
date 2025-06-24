// resetPassword.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Sesuaikan dengan schema User Anda
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Reset password untuk user sales
    const newPassword = 'sales123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await User.updateOne(
      { username: 'sales' },
      { password: hashedPassword }
    );

    console.log('Update result:', result);
    
    // Verifikasi
    const user = await User.findOne({ username: 'sales' });
    const isValid = await bcrypt.compare(newPassword, user.password);
    
    console.log('Password verification:', isValid ? '✅ Success' : '❌ Failed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();