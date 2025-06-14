#!/usr/bin/env node

// Test environment setup for DependencyWarden
// This script sets up the minimal environment variables needed for testing

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only-not-secure';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-not-secure-32chars';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-only';

// Optional environment variables for testing
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SLACK_BOT_TOKEN = 'test-slack-token';
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

console.log('✅ Test environment variables configured');
console.log('ℹ️  DATABASE_URL:', process.env.DATABASE_URL);
console.log('ℹ️  NODE_ENV:', process.env.NODE_ENV);

module.exports = {
  setupTestEnvironment: () => {
    console.log('Test environment ready');
  }
}; 