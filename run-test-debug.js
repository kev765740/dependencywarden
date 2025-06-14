#!/usr/bin/env node

console.log('🔧 Starting DependencyWarden Test Debug Session...\n');

// Set up environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-32-chars-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-only';

console.log('✅ Environment variables set:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

async function testServerStartup() {
  console.log('🚀 Testing server startup...');
  
  try {
    // Try to import the database module
    console.log('📦 Loading database module...');
    const { db } = await import('./server/db.js');
    console.log('✅ Database module loaded successfully');
    
    // Try to import the server
    console.log('🖥️  Loading server module...');
    await import('./server/index.js');
    console.log('✅ Server module loaded successfully');
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test server health
    console.log('🏥 Testing server health...');
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch('http://localhost:5000/health', {
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ Server health check passed');
        const data = await response.text();
        console.log('📊 Health response:', data);
      } else {
        console.log('⚠️  Server responded but with error:', response.status);
      }
    } catch (healthError) {
      console.log('❌ Server health check failed:', healthError.message);
    }
    
  } catch (error) {
    console.error('❌ Server startup failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testServerStartup().then(() => {
  console.log('\n🎯 Test debug session complete');
}).catch(console.error); 