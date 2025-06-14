#!/usr/bin/env node

// Start the server with test environment variables
console.log('🚀 Starting test server with environment variables...');

// Set up test environment
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only-not-secure';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-not-secure-32chars';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-only';

// Optional environment variables
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SLACK_BOT_TOKEN = 'test-slack-token';
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

console.log('✅ Environment variables set');
console.log('📊 Starting server on http://localhost:5000');

// Import and start the server
import('./server/index.js').catch(console.error); 