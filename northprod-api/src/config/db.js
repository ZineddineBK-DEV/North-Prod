const mongoose = require('mongoose');
// const seeder = require("../utils/seeder")
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    // await seeder
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    throw err;
  }
};

module.exports = { connectDB };
