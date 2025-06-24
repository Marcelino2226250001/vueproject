// resetAllPasswords.js - Script untuk reset password berbagai role
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Model User (sesuaikan dengan struktur Anda)
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

// Konfigurasi default users berdasarkan role
const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'sales',
    password: 'sales123', 
    role: 'sales'
  },
  {
    username: 'keuangan',
    password: 'keuangan123',
    role: 'keuangan'
  },
  {
    username: 'penerimabarang',
    password: 'terima123',
    role: 'penerimaan'
  },
  {
    username: 'orderpack',
    password: 'order123',
    role: 'order'
  },
  {
    username: 'gudang',
    password: 'gudang123',
    role: 'gudang'
  }
];

async function resetPasswordForUser(username, newPassword) {
  try {
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ User '${username}' tidak ditemukan`);
      return false;
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await User.updateOne(
      { username },
      { password: hashedPassword }
    );

    // Verifikasi
    const updatedUser = await User.findOne({ username });
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);
    
    if (isValid) {
      console.log(`✅ Password berhasil direset untuk user: ${username}`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Role: ${user.role}`);
      return true;
    } else {
      console.log(`❌ Verifikasi password gagal untuk user: ${username}`);
      return false;
    }

  } catch (error) {
    console.error(`Error reset password untuk ${username}:`, error);
    return false;
  }
}

async function createUserIfNotExists(userData) {
  try {
    const existingUser = await User.findOne({ username: userData.username });
    
    if (existingUser) {
      console.log(`User '${userData.username}' sudah ada, skip create`);
      return false;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Buat user baru
    const newUser = new User({
      username: userData.username,
      password: hashedPassword,
      role: userData.role
    });
    
    await newUser.save();
    
    console.log(`✅ User baru berhasil dibuat: ${userData.username}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Role: ${userData.role}`);
    
    return true;

  } catch (error) {
    console.error(`Error membuat user ${userData.username}:`, error);
    return false;
  }
}

async function resetAllPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');
    console.log('');

    // Reset password untuk semua default users
    console.log('🔄 Memulai reset password untuk semua role...');
    console.log('');

    let successCount = 0;
    let createdCount = 0;

    for (const userData of defaultUsers) {
      console.log(`📝 Processing user: ${userData.username} (${userData.role})`);
      
      // Coba reset password dulu
      const resetSuccess = await resetPasswordForUser(userData.username, userData.password);
      
      if (resetSuccess) {
        successCount++;
      } else {
        // Jika user tidak ada, coba buat user baru
        const createSuccess = await createUserIfNotExists(userData);
        if (createSuccess) {
          createdCount++;
        }
      }
      
      console.log(''); // Blank line for readability
    }

    console.log('📊 RINGKASAN:');
    console.log(`✅ Password berhasil direset: ${successCount} user`);
    console.log(`🆕 User baru berhasil dibuat: ${createdCount} user`);
    console.log('');

    // Tampilkan daftar semua user yang ada
    console.log('👥 DAFTAR SEMUA USER:');
    const allUsers = await User.find({}).select('username role');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
    });

    console.log('');
    console.log('🎉 Proses selesai! Semua user dapat login dengan password default.');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function resetPasswordByRole(targetRole, newPassword = null) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Cari semua user dengan role tertentu
    const users = await User.find({ role: targetRole });
    
    if (users.length === 0) {
      console.log(`❌ Tidak ada user dengan role: ${targetRole}`);
      return;
    }

    console.log(`🔍 Ditemukan ${users.length} user dengan role '${targetRole}'`);
    console.log('');

    let successCount = 0;

    for (const user of users) {
      // Gunakan password default berdasarkan role jika tidak ada password yang diberikan
      const passwordToUse = newPassword || `${targetRole}123`;
      
      console.log(`📝 Reset password untuk: ${user.username}`);
      
      const hashedPassword = await bcrypt.hash(passwordToUse, 12);
      
      await User.updateOne(
        { _id: user._id },
        { password: hashedPassword }
      );

      // Verifikasi
      const updatedUser = await User.findById(user._id);
      const isValid = await bcrypt.compare(passwordToUse, updatedUser.password);
      
      if (isValid) {
        console.log(`✅ Berhasil - Username: ${user.username}, Password: ${passwordToUse}`);
        successCount++;
      } else {
        console.log(`❌ Gagal verifikasi - Username: ${user.username}`);
      }
    }

    console.log('');
    console.log(`📊 ${successCount}/${users.length} password berhasil direset untuk role '${targetRole}'`);

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// PILIHAN EKSEKUSI SCRIPT
async function main() {
  // Uncomment salah satu opsi di bawah ini:

  // OPSI 1: Reset password semua default users
  await resetAllPasswords();

  // OPSI 2: Reset password untuk role tertentu dengan password default
  // await resetPasswordByRole('admin');
  // await resetPasswordByRole('sales');
  // await resetPasswordByRole('warehouse');

  // OPSI 3: Reset password untuk role tertentu dengan password custom
  // await resetPasswordByRole('admin', 'newadminpass123');
  // await resetPasswordByRole('sales', 'newsalespass123');

  // OPSI 4: Reset password untuk user tertentu
  // await resetPasswordForUser('admin', 'newpassword123');
}

// Jalankan script
main();