#!/usr/bin/env node

/**
 * Auth0 Setup Helper for NavSense
 * Run with: node setup-auth0.js
 */

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Auth0 Setup Helper for NavSense\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupAuth0() {
  console.log('📋 Please provide your Auth0 credentials:\n');
  
  const domain = await askQuestion('Enter your Auth0 domain (e.g., your-tenant.us.auth0.com): ');
  const clientId = await askQuestion('Enter your Auth0 client ID: ');
  const audience = await askQuestion('Enter your API audience (optional, press Enter to skip): ');
  
  // Validate inputs
  if (!domain || !clientId) {
    console.log('❌ Domain and Client ID are required!');
    process.exit(1);
  }
  
  if (!domain.includes('.auth0.com')) {
    console.log('⚠️  Warning: Domain should end with .auth0.com');
  }
  
  // Generate configuration
  const config = `export const auth0Config = {
  domain: '${domain}',
  clientId: '${clientId}',${audience ? `\n  audience: '${audience}',` : ''}
};

// ✅ Auth0 configuration completed on ${new Date().toLocaleString()}
// 
// Next steps:
// 1. Make sure callback URLs are configured in your Auth0 dashboard:
//    - com.navsense://${domain}/ios/com.navsense/callback
//    - com.navsense://${domain}/android/com.navsense/callback
// 2. Start your server: cd server && node index.js
// 3. Start your app: npm start
// 4. Test authentication!`;

  // Write configuration
  try {
    fs.writeFileSync('auth0-configuration.ts', config);
    console.log('\n✅ Auth0 configuration saved successfully!');
    console.log('\n📱 Your app is now ready for authentication testing.');
    
    console.log('\n🔧 Callback URLs to add in Auth0 dashboard:');
    console.log(`   com.navsense://${domain}/ios/com.navsense/callback`);
    console.log(`   com.navsense://${domain}/android/com.navsense/callback`);
    
    console.log('\n🚀 Ready to test:');
    console.log('   1. Start server: cd server && node index.js');
    console.log('   2. Start app: npm start');
    console.log('   3. Try logging in!');
    
  } catch (error) {
    console.log('❌ Failed to save configuration:', error.message);
  }
  
  rl.close();
}

setupAuth0();