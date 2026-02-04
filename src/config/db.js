const mongoose = require('mongoose');
// 1. Import User model to check/create Admin
const User = require('../models/User'); 

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || 'LightCraft',
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then(async (mongoose) => {
      console.log(`✅ New MongoDB Connection Established to: ${opts.dbName}`);
      
      // 2. RESTORE THE SUPER ADMIN SEEDER HERE
      try {
        const adminEmail = 'lightcraft@codeenvision.com';
        // We use the model directly here. 
        // Note: Since this runs inside the connection promise, we need to be careful.
        // Mongoose is connected at this point.
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
          const superAdmin = new User({
            name: 'Super Admin',
            email: adminEmail,
            password: 'ABC@123!', // This will be hashed by User.js model pre-save hook
            role: 'Super Admin',
          });

          await superAdmin.save();
          console.log('✅ Default Super Admin Created in new DB');
        }
      } catch (seedError) {
        console.error('Seeding Error:', seedError.message);
        // Don't crash the connection if seeding fails, just log it
      }

      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;