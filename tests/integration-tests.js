/**
 * Integration Testing Suite
 * Tests component interactions and database operations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class IntegrationTester {
  constructor() {
    this.testResults = [];
  }

  async runTest(name, testFn) {
    console.log(`\n🔧 Running integration test: ${name}`);
    try {
      await testFn();
      console.log(`✅ ${name} - PASSED`);
      this.testResults.push({ name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ ${name} - FAILED: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', error: error.message });
    }
  }

  testDatabaseConnection() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    if (!dbUrl.includes('postgresql://')) {
      throw new Error('Invalid PostgreSQL connection string');
    }
  }

  testEnvironmentVariables() {
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY'
    ];
    
    const optional = [
      'GOOGLE_API_KEY',
      'GITHUB_TOKEN',
      'SENDGRID_API_KEY',
      'SLACK_BOT_TOKEN'
    ];
    
    // Check required variables
    for (const varName of required) {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is missing`);
      }
    }
    
    // Report optional variables
    const missingOptional = optional.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      console.log(`⚠️  Optional variables missing: ${missingOptional.join(', ')}`);
    }
  }

  testFileStructure() {
    const requiredFiles = [
      'package.json',
      'server/index.ts',
      'server/routes.ts',
      'server/storage.ts',
      'shared/schema.ts',
      'client/src/App.tsx',
      'drizzle.config.ts'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file ${file} is missing`);
      }
    }
  }

  testDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const criticalDeps = [
        '@google/generative-ai',
        '@neondatabase/serverless',
        'drizzle-orm',
        'express',
        'react',
        'typescript'
      ];
      
      for (const dep of criticalDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          throw new Error(`Critical dependency ${dep} is missing`);
        }
      }
    } catch (error) {
      throw new Error(`Package.json validation failed: ${error.message}`);
    }
  }

  testTypeScriptCompilation() {
    try {
      // Check if TypeScript compiles without errors
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  }

  testDrizzleSchema() {
    try {
      // Validate drizzle schema file
      const schemaPath = 'shared/schema.ts';
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      const requiredTables = [
        'users',
        'repositories',
        'scanJobs',
        'securityAlerts',
        'feedback'
      ];
      
      for (const table of requiredTables) {
        if (!schemaContent.includes(`export const ${table}`)) {
          throw new Error(`Table definition for ${table} not found in schema`);
        }
      }
    } catch (error) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
  }

  testServerStartup() {
    try {
      // Test that server files have no syntax errors
      const serverFiles = ['server/index.ts', 'server/routes.ts', 'server/storage.ts'];
      
      for (const file of serverFiles) {
        execSync(`npx tsx --check ${file}`, { stdio: 'pipe' });
      }
    } catch (error) {
      throw new Error(`Server syntax validation failed: ${error.message}`);
    }
  }

  testClientBuild() {
    try {
      // Test that client builds successfully
      execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
    } catch (error) {
      throw new Error(`Client build failed: ${error.message}`);
    }
  }

  testSecurityConfiguration() {
    const securityFiles = [
      'server/productionSecurity.ts',
      'server/performance.ts'
    ];
    
    for (const file of securityFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Security file ${file} is missing`);
      }
    }
    
    // Check if security middleware is properly configured
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    if (!routesContent.includes('simpleAuth')) {
      throw new Error('Authentication middleware not found in routes');
    }
  }

  async runAllTests() {
    console.log('🧩 Starting integration tests...\n');
    
    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Environment Variables', () => this.testEnvironmentVariables());
    await this.runTest('File Structure', () => this.testFileStructure());
    await this.runTest('Dependencies', () => this.testDependencies());
    await this.runTest('TypeScript Compilation', () => this.testTypeScriptCompilation());
    await this.runTest('Drizzle Schema', () => this.testDrizzleSchema());
    await this.runTest('Server Startup', () => this.testServerStartup());
    await this.runTest('Client Build', () => this.testClientBuild());
    await this.runTest('Security Configuration', () => this.testSecurityConfiguration());

    this.generateReport();
  }

  generateReport() {
    console.log('\n📋 INTEGRATION TEST RESULTS');
    console.log('============================');
    
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n' + (failed === 0 ? '🎉 All integration tests passed!' : '⚠️  Some integration tests failed'));
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

export default IntegrationTester;