const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return null;
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
};

const setupIndexes = async () => {};
const enableDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
  }
};

module.exports = {
  connectDB,
  closeDB,
  setupIndexes,
  enableDebug
};