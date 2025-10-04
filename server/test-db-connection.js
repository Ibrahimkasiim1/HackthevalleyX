/**
 * Simple database connection test for NavSense
 * Run from server directory: cd server && node test-db-connection.js
 */

import mongoose from 'mongoose';
import { User } from './models/User.js';

const MONGODB_URI = 'mongodb+srv://NavSenseAdmin:HTVX@navsense.vg6ujju.mongodb.net/?retryWrites=true&w=majority&appName=NavSense';

console.log('🔍 Testing NavSense Database Connection...\n');

async function testDatabase() {
  try {
    console.log('1️⃣ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   ✅ Connected to MongoDB successfully');
    
    console.log('\n2️⃣ Testing database ping...');
    const admin = mongoose.connection.db.admin();
    const pingResult = await admin.ping();
    if (pingResult.ok === 1) {
      console.log('   ✅ Database ping successful');
    }
    
    console.log('\n3️⃣ Testing User model...');
    const testUser = new User({
      auth0Id: 'test_' + Date.now(),
      email: 'test@example.com',
      name: 'Test User'
    });
    
    const validationError = testUser.validateSync();
    if (!validationError) {
      console.log('   ✅ User model validation passed');
    } else {
      throw new Error('User model validation failed: ' + validationError.message);
    }
    
    console.log('\n4️⃣ Testing database operations...');
    
    // Test creating a user (dry run - validation only)
    const testUserData = {
      auth0Id: 'test_connection_' + Date.now(),
      email: 'testconnection@example.com',
      name: 'Connection Test User'
    };
    
    // Save and immediately remove to test CRUD operations
    const savedUser = await User.create(testUserData);
    console.log('   ✅ User creation successful');
    
    const foundUser = await User.findById(savedUser._id);
    if (foundUser) {
      console.log('   ✅ User retrieval successful');
    }
    
    await User.findByIdAndDelete(savedUser._id);
    console.log('   ✅ User deletion successful');
    
    console.log('\n🎉 All database tests passed!');
    console.log('✅ MongoDB connection is working properly');
    console.log('✅ User model is functioning correctly');
    console.log('✅ CRUD operations are working');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('   Check your MongoDB connection string and network access');
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testDatabase();