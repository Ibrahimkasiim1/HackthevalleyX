import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://NavSenseAdmin:HTVX@navsense.vg6ujju.mongodb.net/?retryWrites=true&w=majority&appName=NavSense';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);

    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

export default connectDB;