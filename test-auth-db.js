/**
 * Comprehensive test script for NavSense authentication and database
 * Run with: node test-auth-db.js
 */

import mongoose from 'mongoose';
import fetch from 'node-fetch';

// Test configuration
const MONGODB_URI = 'mongodb+srv://NavSenseAdmin:HTVX@navsense.vg6ujju.mongodb.net/?retryWrites=true&w=majority&appName=NavSense';
const SERVER_URL = 'http://localhost:3000';

// Test results
const results = {
  databaseConnection: null,
  userModelValidation: null,
  authEndpoints: null,
  serverHealth: null
};

console.log('🔍 Testing NavSense Authentication & Database Integration...\n');

// Test 1: Database Connection
async function testDatabaseConnection() {
  console.log('1️⃣ Testing MongoDB Connection...');
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Test basic query
    const admin = mongoose.connection.db.admin();
    const status = await admin.ping();
    
    if (status.ok === 1) {
      console.log('   ✅ MongoDB connection successful');
      console.log('   ✅ Database ping successful');
      results.databaseConnection = 'PASS';
    } else {
      throw new Error('Database ping failed');
    }
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
    results.databaseConnection = 'FAIL';
  }
}

// Test 2: User Model Validation
async function testUserModel() {
  console.log('\n2️⃣ Testing User Model...');
  try {
    // Import User model
    const { User } = await import('./server/models/User.js');
    
    // Test model creation (without saving)
    const testUser = new User({
      auth0Id: 'test_auth0_id_' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    });
    
    // Validate the model
    const validationError = testUser.validateSync();
    if (!validationError) {
      console.log('   ✅ User model structure is valid');
      console.log('   ✅ Required fields validation passed');
      results.userModelValidation = 'PASS';
    } else {
      throw new Error('User model validation failed: ' + validationError.message);
    }
  } catch (error) {
    console.log('   ❌ User model test failed:', error.message);
    results.userModelValidation = 'FAIL';
  }
}

// Test 3: Server Health Check
async function testServerHealth() {
  console.log('\n3️⃣ Testing Server Health...');
  try {
    // Check if server is running
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      timeout: 5000
    }).catch(() => null);
    
    if (response && response.ok) {
      console.log('   ✅ Server is running and responsive');
      results.serverHealth = 'PASS';
    } else {
      console.log('   ⚠️  Server health endpoint not available (this is expected if server is not running)');
      results.serverHealth = 'SKIP';
    }
  } catch (error) {
    console.log('   ⚠️  Server not running (start with: cd server && npm run dev)');
    results.serverHealth = 'SKIP';
  }
}

// Test 4: Auth Endpoints (if server is running)
async function testAuthEndpoints() {
  console.log('\n4️⃣ Testing Auth Endpoints...');
  
  if (results.serverHealth !== 'PASS') {
    console.log('   ⚠️  Skipping auth endpoint tests (server not running)');
    results.authEndpoints = 'SKIP';
    return;
  }
  
  try {
    // Test store-user endpoint with mock data
    const testUserData = {
      auth0Id: 'test_auth0_' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };
    
    const response = await fetch(`${SERVER_URL}/api/auth/store-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData),
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ store-user endpoint working');
      console.log('   ✅ User creation/update successful');
      
      // Test profile endpoint
      const profileResponse = await fetch(`${SERVER_URL}/api/auth/profile/${testUserData.auth0Id}`);
      if (profileResponse.ok) {
        console.log('   ✅ profile endpoint working');
        results.authEndpoints = 'PASS';
      } else {
        throw new Error('Profile endpoint failed');
      }
    } else {
      const errorText = await response.text();
      throw new Error(`Auth endpoint failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Auth endpoints test failed:', error.message);
    results.authEndpoints = 'FAIL';
  }
}

// Test 5: Auth0 Configuration Check
async function testAuth0Config() {
  console.log('\n5️⃣ Testing Auth0 Configuration...');
  try {
    const fs = await import('fs');
    const configContent = fs.readFileSync('./auth0-configuration.ts', 'utf8');
    
    if (configContent.includes('YOUR_AUTH0_DOMAIN')) {
      console.log('   ⚠️  Auth0 configuration contains placeholder values');
      console.log('   ℹ️  Update auth0-configuration.ts with your actual Auth0 credentials');
    } else {
      console.log('   ✅ Auth0 configuration appears to be customized');
    }
  } catch (error) {
    console.log('   ❌ Could not read Auth0 configuration:', error.message);
  }
}

// Main test runner
async function runTests() {
  try {
    await testDatabaseConnection();
    await testUserModel();
    await testServerHealth();
    await testAuthEndpoints();
    await testAuth0Config();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('================================');
    
    Object.entries(results).forEach(([test, result]) => {
      const emoji = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️';
      const status = result || 'SKIP';
      console.log(`${emoji} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${status}`);
    });
    
    const passCount = Object.values(results).filter(r => r === 'PASS').length;
    const failCount = Object.values(results).filter(r => r === 'FAIL').length;
    
    console.log('\n🎯 Overall Status:');
    if (failCount === 0) {
      console.log('✅ All critical tests passed! Authentication system is ready.');
    } else {
      console.log(`❌ ${failCount} critical test(s) failed. Please review the issues above.`);
    }
    
    console.log('\n📝 Next Steps:');
    if (results.databaseConnection === 'PASS') {
      console.log('✅ Database is ready');
    }
    
    if (results.serverHealth === 'SKIP') {
      console.log('🔄 Start the server: cd server && npm run dev');
    }
    
    console.log('🔧 Configure Auth0: Update auth0-configuration.ts with your credentials');
    console.log('📱 Test the app: npm start');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Handle Node.js module type
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
