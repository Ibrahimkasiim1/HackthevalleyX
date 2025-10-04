/**
 * Quick validation script for NavSense authentication setup
 * Run with: node validate-setup.js
 */

import fs from 'fs';

const issues = [];
const warnings = [];

// Check if essential files exist
const requiredFiles = [
  'contexts/AuthContext.tsx',
  'app/login.tsx',
  'components/ProtectedRoute.tsx',
  'auth0-configuration.ts',
  'server/config/database.js',
  'server/models/User.js',
  'server/routes/auth.js',
];

console.log('🔍 Checking NavSense authentication setup...\n');

// File existence check
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    issues.push(`❌ Missing required file: ${file}`);
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

// Check Auth0 configuration
try {
  const authConfigContent = fs.readFileSync('auth0-configuration.ts', 'utf8');
  if (authConfigContent.includes('YOUR_AUTH0_DOMAIN')) {
    warnings.push('⚠️  Auth0 configuration still contains placeholder values');
  }
} catch (error) {
  issues.push('❌ Could not read auth0-configuration.ts');
}

// Check app.json for scheme
try {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  if (appConfig.expo.scheme !== 'navsense') {
    warnings.push('⚠️  App scheme should be "navsense" for Auth0 callbacks');
  }
} catch (error) {
  issues.push('❌ Could not read app.json');
}

// Check package.json dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'react-native-auth0',
    'react-native-keychain',
    '@react-native-async-storage/async-storage',
    'jwt-decode'
  ];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      issues.push(`❌ Missing dependency: ${dep}`);
    }
  }
} catch (error) {
  issues.push('❌ Could not read package.json');
}

// Check server dependencies
try {
  const serverPackageJson = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  const requiredServerDeps = [
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
    'express-validator'
  ];
  
  for (const dep of requiredServerDeps) {
    if (!serverPackageJson.dependencies[dep]) {
      issues.push(`❌ Missing server dependency: ${dep}`);
    }
  }
} catch (error) {
  issues.push('❌ Could not read server/package.json');
}

// Report results
console.log('\n📋 Validation Results:');

if (issues.length === 0) {
  console.log('✅ All required files and dependencies are present!');
} else {
  console.log('\n❌ Issues found:');
  issues.forEach(issue => console.log(`  ${issue}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`  ${warning}`));
}

console.log('\n📚 Next steps:');
console.log('1. Set up your Auth0 application');
console.log('2. Update auth0-configuration.ts with your credentials');
console.log('3. Copy server/.env.example to server/.env and configure');
console.log('4. Run: npm start (for the app) and npm run dev (for server)');

console.log('\n📖 See AUTH_SETUP_GUIDE.md for detailed instructions');