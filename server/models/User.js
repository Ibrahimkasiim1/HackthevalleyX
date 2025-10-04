import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: false,
  },
  picture: {
    type: String,
    required: false,
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      default: 'light',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const User = mongoose.model('User', userSchema);