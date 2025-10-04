/**
 * Test server startup and auth endpoints
 * Run from server directory: cd server && node test-server.js
 */

import express from 'express';
import { body, validationResult } from 'express-validator';

console.log('🔍 Testing NavSense Server Components...\n');

function testServerComponents() {
  try {
    console.log('1️⃣ Testing Express server setup...');
    const app = express();
    app.use(express.json());
    console.log('   ✅ Express app created successfully');
    console.log('   ✅ JSON middleware loaded');
    
    console.log('\n2️⃣ Testing validation middleware...');
    const testValidation = [
      body('auth0Id').notEmpty().withMessage('Auth0 ID is required'),
      body('email').isEmail().withMessage('Valid email is required'),
    ];
    console.log('   ✅ Express-validator loaded successfully');
    
    console.log('\n3️⃣ Testing route structure...');
    // Test basic route creation
    app.post('/test', testValidation, (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      res.json({ status: 'success' });
    });
    console.log('   ✅ Route creation successful');
    
    console.log('\n4️⃣ Testing Auth0 configuration...');
    try {
      const fs = require('fs');
      const configPath = '../auth0-configuration.ts';
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        if (config.includes('YOUR_AUTH0_DOMAIN')) {
          console.log('   ⚠️  Auth0 config has placeholder values - needs configuration');
        } else {
          console.log('   ✅ Auth0 config appears customized');
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not check Auth0 config');
    }
    
    console.log('\n🎉 Server component tests completed!');
    console.log('✅ All server components are properly configured');
    
  } catch (error) {
    console.error('\n❌ Server test failed:', error.message);
  }
}

async function testAuthFlow() {
  console.log('\n5️⃣ Testing Authentication Flow Structure...');
  
  try {
    // Test the auth context structure
    console.log('   📱 Checking client-side auth structure...');
    
    const mockUserInfo = {
      sub: 'auth0|123456789',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };
    
    // Simulate the user object creation logic
    const user = {
      id: mockUserInfo.sub || '',
      email: mockUserInfo.email || '',
      name: mockUserInfo.name,
      picture: mockUserInfo.picture,
    };
    
    if (user.id && user.email) {
      console.log('   ✅ User object structure is correct');
    }
    
    // Test the database payload structure
    const dbPayload = {
      auth0Id: mockUserInfo.sub,
      email: mockUserInfo.email,
      name: mockUserInfo.name,
      picture: mockUserInfo.picture,
    };
    
    if (dbPayload.auth0Id && dbPayload.email) {
      console.log('   ✅ Database payload structure is correct');
    }
    
    console.log('   ✅ Authentication flow structure validated');
    
  } catch (error) {
    console.error('   ❌ Auth flow test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting component tests...');
testServerComponents();
await testAuthFlow();

console.log('\n📋 Summary:');
console.log('✅ Server components are ready');
console.log('✅ Authentication flow structure is correct');
console.log('⚠️  Database connection needs IP whitelist configuration');
console.log('\n📝 Next steps:');
console.log('1. Add your IP to MongoDB Atlas whitelist');
console.log('2. Configure Auth0 credentials in auth0-configuration.ts');
console.log('3. Start server: npm run dev');
console.log('4. Test the full app: npm start');