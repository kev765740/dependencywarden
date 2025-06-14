
/**
 * Complete Platform Verification Script
 * Validates all features and functionality before GitHub push
 */

import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

class PlatformVerifier {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  async verifyPlatform() {
    console.log('🔍 Starting Complete Platform Verification...\n');

    try {
      await this.setupAuthentication();
      await this.verifyAllEndpoints();
      await this.verifyDatabaseOperations();
      await this.verifySecurityFeatures();
      await this.verifyUIComponents();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Platform verification failed:', error);
    }
  }

  async setupAuthentication() {
    console.log('🔐 Setting up authentication...');
    
    try {
      // Register test user
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'verify@test.com',
        password: 'VerifyTest123',
        username: 'verifyuser'
      });
    } catch (error) {
      // User might already exist
    }

    // Login
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'verify@test.com',
      password: 'VerifyTest123'
    });

    this.authToken = response.data.token;
    console.log('✅ Authentication setup complete');
  }

  async verifyAllEndpoints() {
    console.log('🌐 Verifying all API endpoints...');

    const endpoints = [
      { method: 'GET', path: '/health', auth: false },
      { method: 'GET', path: '/api/stats', auth: true },
      { method: 'GET', path: '/api/repositories', auth: true },
      { method: 'GET', path: '/api/notifications', auth: true },
      { method: 'GET', path: '/api/jobs/stats', auth: true },
      { method: 'GET', path: '/api/jobs/recent', auth: true },
      { method: 'GET', path: '/api/license/policies', auth: true },
      { method: 'GET', path: '/api/security/workflows', auth: true },
      { method: 'GET', path: '/api/teams', auth: true },
      { method: 'GET', path: '/api/billing/status', auth: true }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method.toLowerCase(),
          url: `${BASE_URL}${endpoint.path}`
        };

        if (endpoint.auth) {
          config.headers = {
            'Authorization': `Bearer ${this.authToken}`
          };
        }

        const response = await axios(config);
        console.log(`  ✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);
        this.results.push({ endpoint: endpoint.path, status: 'PASS' });
      } catch (error) {
        console.log(`  ❌ ${endpoint.method} ${endpoint.path} - ${error.response?.status || 'ERROR'}`);
        this.results.push({ endpoint: endpoint.path, status: 'FAIL', error: error.message });
      }
    }
  }

  async verifyDatabaseOperations() {
    console.log('💾 Verifying database operations...');

    try {
      // Test repository creation
      const repoResponse = await axios.post(`${BASE_URL}/api/repositories`, {
        name: 'Verification Test Repo',
        gitUrl: 'https://github.com/test/verification-repo',
        ownerEmail: 'verify@test.com'
      }, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      console.log('  ✅ Repository creation successful');

      // Test repository scanning
      if (repoResponse.data.repository?.id) {
        await axios.post(`${BASE_URL}/api/repositories/${repoResponse.data.repository.id}/scan`, {}, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        console.log('  ✅ Repository scanning successful');
      }

      this.results.push({ operation: 'Database Operations', status: 'PASS' });
    } catch (error) {
      console.log('  ❌ Database operations failed:', error.message);
      this.results.push({ operation: 'Database Operations', status: 'FAIL', error: error.message });
    }
  }

  async verifySecurityFeatures() {
    console.log('🛡️ Verifying security features...');

    try {
      // Test security analysis
      const analysisResponse = await axios.post(`${BASE_URL}/api/security/analyze`, {
        message: 'Verify security analysis functionality',
        context: 'Platform verification test'
      }, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      console.log('  ✅ Security analysis functional');
      this.results.push({ feature: 'Security Analysis', status: 'PASS' });
    } catch (error) {
      console.log('  ❌ Security analysis failed:', error.message);
      this.results.push({ feature: 'Security Analysis', status: 'FAIL', error: error.message });
    }
  }

  async verifyUIComponents() {
    console.log('🎨 Verifying UI components...');

    const uiFiles = [
      'client/src/pages/home.tsx',
      'client/src/components/Sidebar.tsx',
      'client/src/App.tsx',
      'client/src/hooks/use-auth.tsx'
    ];

    let allValid = true;
    for (const file of uiFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('export default') || content.includes('export')) {
          console.log(`  ✅ ${file} - Valid`);
        } else {
          console.log(`  ❌ ${file} - Invalid exports`);
          allValid = false;
        }
      } else {
        console.log(`  ❌ ${file} - Missing`);
        allValid = false;
      }
    }

    this.results.push({ 
      component: 'UI Components', 
      status: allValid ? 'PASS' : 'FAIL' 
    });
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log('\n📊 Platform Verification Report:');
    console.log('================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Verifications:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.endpoint || result.operation || result.feature || result.component}: ${result.error || 'Failed'}`);
        });
    }

    if (successRate >= 95) {
      console.log('\n🚀 PLATFORM READY FOR GITHUB PUSH');
      console.log('All critical systems verified and operational');
    } else {
      console.log('\n⚠️ Additional fixes required before push');
    }
  }
}

// Run verification
const verifier = new PlatformVerifier();
verifier.verifyPlatform().catch(console.error);
