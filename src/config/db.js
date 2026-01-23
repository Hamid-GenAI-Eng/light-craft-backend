const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // --- AUTO-SEED SUPER ADMIN ---
    const adminEmail = 'lightcraft@codeenvision.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const superAdmin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: 'ABC@123!', // This will be hashed by the pre-save hook in User model
        role: 'Super Admin',
      });

      await superAdmin.save();
      console.log('✅ Default Super Admin Created');
    }
    // -----------------------------

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;