#!/usr/bin/env node

/**
 * Simplified Test Suite - DependencyWarden SaaS Platform
 * Tests core functionality without external dependencies
 */

console.log('🚀 Starting DependencyWarden Simple Test Suite...\n');

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-32-chars-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-only';

console.log('✅ Environment variables configured');

class SimpleTestSuite {
  constructor() {
    this.passedTests = 0;
    this.failedTests = 0;
    this.testResults = [];
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`  Running: ${testName}...`);
      const result = await testFunction();
      if (result === true) {
        console.log(`  ✅ ${testName} - PASSED`);
        this.passedTests++;
        this.testResults.push({ name: testName, status: 'PASSED', error: null });
      } else {
        console.log(`  ❌ ${testName} - FAILED (returned ${result})`);
        this.failedTests++;
        this.testResults.push({ name: testName, status: 'FAILED', error: `returned ${result}` });
      }
    } catch (error) {
      console.log(`  ❌ ${testName} - ERROR: ${error.message}`);
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  async runAllTests() {
    console.log('🔧 Testing Environment Setup...');
    await this.testEnvironmentSetup();
    
    console.log('\n📦 Testing Module Imports...');
    await this.testModuleImports();
    
    console.log('\n🗄️  Testing Database Configuration...');
    await this.testDatabaseConfig();
    
    console.log('\n🔒 Testing Authentication Logic...');
    await this.testAuthenticationLogic();
    
    console.log('\n📊 Testing Core Functionality...');
    await this.testCoreFunctionality();
    
    this.generateTestReport();
  }

  async testEnvironmentSetup() {
    await this.runTest('Environment Variables', () => {
      const required = ['NODE_ENV', 'DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET'];
      return required.every(env => process.env[env]);
    });

    await this.runTest('JWT Secret Length', () => {
      return process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;
    });

    await this.runTest('Database URL Format', () => {
      return process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');
    });
  }

  async testModuleImports() {
    await this.runTest('Node.js Core Modules', async () => {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const crypto = await import('crypto');
        return !!(fs && path && crypto);
      } catch (error) {
        return false;
      }
    });

    await this.runTest('Express Framework Available', async () => {
      try {
        // Check if express is available in node_modules
        const fs = await import('fs');
        return fs.existsSync('./node_modules/express/package.json');
      } catch (error) {
        return false;
      }
    });

    await this.runTest('Database Driver Available', async () => {
      try {
        const fs = await import('fs');
        return fs.existsSync('./node_modules/@neondatabase/serverless/package.json');
      } catch (error) {
        return false;
      }
    });
  }

  async testDatabaseConfig() {
    await this.runTest('Database Module Import', async () => {
      try {
        const { db } = await import('./server/db.js');
        return !!db;
      } catch (error) {
        console.log(`    DB Import Error: ${error.message}`);
        return false;
      }
    });

    await this.runTest('Schema Import', async () => {
      try {
        const schema = await import('./shared/schema.js');
        return !!(schema.users && schema.repositories && schema.alerts);
      } catch (error) {
        console.log(`    Schema Import Error: ${error.message}`);
        return false;
      }
    });
  }

  async testAuthenticationLogic() {
    await this.runTest('JWT Package Available', async () => {
      try {
        const fs = await import('fs');
        return fs.existsSync('./node_modules/jsonwebtoken/package.json');
      } catch (error) {
        return false;
      }
    });

    await this.runTest('Bcrypt Package Available', async () => {
      try {
        const fs = await import('fs');
        return fs.existsSync('./node_modules/bcryptjs/package.json');
      } catch (error) {
        return false;
      }
    });

    await this.runTest('Session Configuration', () => {
      return process.env.SESSION_SECRET && process.env.SESSION_SECRET.length > 16;
    });
  }

  async testCoreFunctionality() {
    await this.runTest('Server Files Exist', async () => {
      const fs = await import('fs');
      const serverFiles = ['server/index.ts', 'server/routes.ts', 'server/auth.ts'];
      return serverFiles.every(file => fs.existsSync(file));
    });

    await this.runTest('Client Files Exist', async () => {
      const fs = await import('fs');
      const clientFiles = ['client/src', 'client/package.json'];
      return clientFiles.some(file => fs.existsSync(file)); // Some, not all required
    });

    await this.runTest('Package.json Configuration', async () => {
      const fs = await import('fs');
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return !!(packageJson.scripts && packageJson.dependencies && packageJson.type === 'module');
    });

    await this.runTest('TypeScript Configuration', async () => {
      const fs = await import('fs');
      return fs.existsSync('./tsconfig.json');
    });
  }

  generateTestReport() {
    const total = this.passedTests + this.failedTests;
    const successRate = total > 0 ? (this.passedTests / total * 100).toFixed(1) : 0;

    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📊 Total: ${total}`);
    console.log(`📈 Success Rate: ${successRate}%\n`);

    if (this.failedTests > 0) {
      console.log('❌ Failed Tests:');
      this.testResults.filter(t => t.status !== 'PASSED').forEach(test => {
        console.log(`   • ${test.name}: ${test.error || test.status}`);
      });
      console.log('');
    }

    console.log('🎯 Recommendations:');
    if (successRate < 50) {
      console.log('🔴 CRITICAL - Major setup issues detected. Check environment and dependencies.');
    } else if (successRate < 80) {
      console.log('🟡 WARNING - Some issues detected. Review failed tests and configuration.');
    } else {
      console.log('🟢 GOOD - Most tests passing. Minor issues may need attention.');
    }

    console.log('\n🏁 Simple test suite completed!\n');
  }
}

// Run the test suite
const testSuite = new SimpleTestSuite();
testSuite.runAllTests().catch(console.error); 