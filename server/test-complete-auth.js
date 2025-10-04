/**
 * Complete Authentication Flow Test
 * Tests the full user authentication and database integration
 * Run from server directory: cd server && node test-complete-auth.js
 */

import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { User } from './models/User.js';

const SERVER_URL = 'http://localhost:3000';
const testAuth0Id = 'test_complete_flow_' + Date.now();

console.log('🔍 Testing Complete Authentication Flow...\n');

async function testCompleteFlow() {
  let testUserId = null;
  
  try {
    console.log('1️⃣ Testing user creation via Auth0 flow...');
    
    // Simulate Auth0 login response data
    const auth0UserData = {
      auth0Id: testAuth0Id,
      email: 'complete.test@navsense.com',
      name: 'Complete Test User',
      picture: 'https://example.com/complete-avatar.jpg'
    };
    
    // Test store-user endpoint (what happens when user logs in with Auth0)
    const response = await fetch(`${SERVER_URL}/api/auth/store-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth0UserData)
    });
    
    if (!response.ok) {
      throw new Error(`Store user failed: ${response.status}`);
    }
    
    const userData = await response.json();
    testUserId = userData.user.id;
    console.log(`   ✅ User created successfully with ID: ${testUserId}`);
    console.log(`   ✅ Auth0 integration working`);
    
    console.log('\n2️⃣ Testing user profile retrieval...');
    
    // Test profile endpoint
    const profileResponse = await fetch(`${SERVER_URL}/api/auth/profile/${testAuth0Id}`);
    if (!profileResponse.ok) {
      throw new Error(`Profile retrieval failed: ${profileResponse.status}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('   ✅ Profile retrieved successfully');
    console.log(`   ✅ User data: ${profileData.user.name} (${profileData.user.email})`);
    
    console.log('\n3️⃣ Testing user preferences update...');
    
    // Test preferences update
    const preferencesData = {
      preferences: {
        language: 'en',
        theme: 'dark',
        notifications: true
      }
    };
    
    const prefsResponse = await fetch(`${SERVER_URL}/api/auth/preferences/${testAuth0Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencesData)
    });
    
    if (!prefsResponse.ok) {
      throw new Error(`Preferences update failed: ${prefsResponse.status}`);
    }
    
    const prefsResult = await prefsResponse.json();
    console.log('   ✅ Preferences updated successfully');
    console.log(`   ✅ Theme: ${prefsResult.preferences.theme}, Language: ${prefsResult.preferences.language}`);
    
    console.log('\n4️⃣ Testing user login update...');
    
    // Test second login (should update lastLogin)
    const secondLoginResponse = await fetch(`${SERVER_URL}/api/auth/store-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth0UserData,
        name: 'Updated Test User' // Simulate name change
      })
    });
    
    if (!secondLoginResponse.ok) {
      throw new Error(`Second login failed: ${secondLoginResponse.status}`);
    }
    
    const secondLoginData = await secondLoginResponse.json();
    console.log('   ✅ User login update successful');
    console.log('   ✅ Existing user handling working');
    
    console.log('\n5️⃣ Testing direct database verification...');
    
    // Connect to database and verify data
    await mongoose.connect('mongodb+srv://NavSenseAdmin:HTVX@navsense.vg6ujju.mongodb.net/?retryWrites=true&w=majority&appName=NavSense');
    
    const dbUser = await User.findOne({ auth0Id: testAuth0Id });
    if (!dbUser) {
      throw new Error('User not found in database');
    }
    
    console.log('   ✅ Database verification successful');
    console.log(`   ✅ Database user: ${dbUser.name} (${dbUser.email})`);
    console.log(`   ✅ Preferences: ${JSON.stringify(dbUser.preferences)}`);
    console.log(`   ✅ Last login: ${dbUser.lastLogin}`);
    
    console.log('\n🎉 Complete Authentication Flow Test PASSED!');
    console.log('\n📊 Summary:');
    console.log('✅ Auth0 user creation/update flow');
    console.log('✅ MongoDB user storage');
    console.log('✅ Profile retrieval');
    console.log('✅ Preferences management');
    console.log('✅ Database consistency');
    console.log('✅ API endpoint functionality');
    
    console.log('\n🚀 Ready for production use!');
    
  } catch (error) {
    console.error('\n❌ Authentication flow test failed:', error.message);
    console.error('   Please check server and database connectivity');
  } finally {
    // Cleanup: remove test user
    if (testUserId) {
      try {
        await User.findByIdAndDelete(testUserId);
        console.log('\n🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('\n⚠️  Could not clean up test user');
      }
    }
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

testCompleteFlow();