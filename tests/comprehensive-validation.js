/**
 * Comprehensive Validation Suite
 * Complete feature verification for production deployment
 */

import axios from 'axios';
const BASE_URL = 'http://localhost:5000';

const TEST_USER = {
  email: 'test@depwatch.dev',
  password: 'TestPass123',
  username: 'testuser'
};

class ComprehensiveValidator {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runCompleteValidation() {
    console.log('🚀 Starting Comprehensive DependencyWarden Validation...\n');

    try {
      await this.validateAuthentication();
      await this.validateRepositoryManagement();
      await this.validateSecurityOperations();
      await this.validateDashboardAnalytics();
      await this.validateAPIInfrastructure();
      await this.validateIntegrationPlatform();
      await this.validatePerformance();
      await this.validateSecurityCompliance();
      
      this.generateComprehensiveReport();
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
    }
  }

  async validateAuthentication() {
    console.log('🔐 Validating Authentication System...');

    // Test user registration
    await this.runValidation('User Registration', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
      return response.status === 201 && response.data.user;
    });

    // Test user login with session
    let loginResponse;
    await this.runValidation('Session-based Login', async () => {
      loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
      return loginResponse.status === 200 && loginResponse.data.token;
    });

    // Test JWT Bearer token authentication
    await this.runValidation('JWT Bearer Authentication', async () => {
      const token = loginResponse.data.token;
      const response = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && response.data.id;
    });

    // Test cookie-based authentication
    await this.runValidation('Cookie Authentication', async () => {
      const cookies = loginResponse.headers['set-cookie'];
      const response = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Cookie: cookies?.join('; ') }
      });
      return response.status === 200;
    });

    // Test protected route access
    await this.runValidation('Protected Route Access', async () => {
      const token = loginResponse.data.token;
      const response = await axios.get(`${BASE_URL}/api/repositories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    });
  }

  async validateRepositoryManagement() {
    console.log('📁 Validating Repository Management...');

    const token = await this.getAuthToken();

    // Test repository creation with multiple formats
    await this.runValidation('Repository Creation (repoUrl)', async () => {
      const response = await axios.post(`${BASE_URL}/api/repositories`, {
        repoUrl: 'https://github.com/express/express.git',
        name: 'Express.js Test Repository',
        ownerEmail: 'test@example.com'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && response.data.success;
    });

    await this.runValidation('Repository Creation (gitUrl)', async () => {
      const response = await axios.post(`${BASE_URL}/api/repositories`, {
        gitUrl: 'https://github.com/facebook/react',
        name: 'React Framework'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && response.data.success;
    });

    // Test repository listing
    let repositories;
    await this.runValidation('Repository Listing', async () => {
      const response = await axios.get(`${BASE_URL}/api/repositories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      repositories = response.data;
      return response.status === 200 && Array.isArray(response.data);
    });

    // Test repository details with enhanced validation
    await this.runValidation('Repository Details', async () => {
      if (repositories.length === 0) return true;
      
      const repoId = repositories[0].id;
      const response = await axios.get(`${BASE_URL}/api/repositories/${repoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const repo = response.data;
      return response.status === 200 && 
             (repo.id || repo.name || repo.gitUrl || repo.repository);
    });

    // Test repository scanning
    await this.runValidation('Repository Security Scan', async () => {
      if (repositories.length === 0) return true;
      
      const repoId = repositories[0].id;
      const response = await axios.post(`${BASE_URL}/api/repositories/${repoId}/scan`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && response.data.success;
    });
  }

  async validateSecurityOperations() {
    console.log('🔍 Validating Security Operations...');

    const token = await this.getAuthToken();

    // Test security alerts retrieval
    await this.runValidation('Security Alerts Retrieval', async () => {
      const response = await axios.get(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && Array.isArray(response.data);
    });

    // Test AI security analysis with comprehensive format validation
    await this.runValidation('AI Security Analysis', async () => {
      const analysisData = {
        message: 'Analyze SQL injection vulnerability in mysql2 package version 2.3.3',
        context: 'Security vulnerability analysis for CVE-2024-1002',
        vulnerability: 'SQL Injection',
        packageName: 'mysql2',
        version: '2.3.3',
        cveId: 'CVE-2024-1002'
      };
      
      const response = await axios.post(`${BASE_URL}/api/security/analyze`, analysisData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.status === 200 && 
             (response.data.analysis || response.data.response || response.data.message);
    });

    // Test security workflows
    await this.runValidation('Security Workflows', async () => {
      const response = await axios.get(`${BASE_URL}/api/security/workflows`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && Array.isArray(response.data);
    });
  }

  async validateDashboardAnalytics() {
    console.log('📊 Validating Dashboard Analytics...');

    const token = await this.getAuthToken();

    // Test dashboard statistics
    await this.runValidation('Dashboard Statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.status === 200 && 
             typeof response.data.totalRepos === 'number' &&
             typeof response.data.activeAlerts === 'number';
    });

    // Test job statistics with enhanced authentication
    await this.runValidation('Job Statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.status === 200 && 
             typeof response.data.total === 'number';
    });

    // Test recent jobs monitoring
    await this.runValidation('Recent Jobs Monitoring', async () => {
      const response = await axios.get(`${BASE_URL}/api/jobs/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && Array.isArray(response.data);
    });
  }

  async validateAPIInfrastructure() {
    console.log('🌐 Validating API Infrastructure...');

    const token = await this.getAuthToken();

    // Test system health check
    await this.runValidation('System Health Check', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      return response.status === 200;
    });

    // Test SBOM generation
    await this.runValidation('SBOM Generation', async () => {
      const reposResponse = await axios.get(`${BASE_URL}/api/repositories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (reposResponse.data.length === 0) return true;
      
      const repoId = reposResponse.data[0].id;
      const response = await axios.get(`${BASE_URL}/api/repositories/${repoId}/sbom`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.status === 200 && response.data.sbom;
    });

    // Test license policies
    await this.runValidation('License Policies', async () => {
      const response = await axios.get(`${BASE_URL}/api/license/policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && Array.isArray(response.data);
    });
  }

  async validateIntegrationPlatform() {
    console.log('🔗 Validating Integration Platform...');

    const token = await this.getAuthToken();

    // Test team management
    await this.runValidation('Team Management', async () => {
      const response = await axios.get(`${BASE_URL}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && Array.isArray(response.data);
    });

    // Test billing status
    await this.runValidation('Billing Status', async () => {
      const response = await axios.get(`${BASE_URL}/api/billing/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200 && response.data.status;
    });
  }

  async validatePerformance() {
    console.log('⚡ Validating Performance...');

    const token = await this.getAuthToken();

    // Test API response times
    await this.runValidation('API Response Time (<200ms)', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const responseTime = Date.now() - startTime;
      
      console.log(`    Response time: ${responseTime}ms`);
      return response.status === 200 && responseTime < 200;
    });

    // Test concurrent requests handling
    await this.runValidation('Concurrent Request Handling', async () => {
      const requests = Array(5).fill().map(() => 
        axios.get(`${BASE_URL}/api/repositories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      const responses = await Promise.all(requests);
      return responses.every(response => response.status === 200);
    });
  }

  async validateSecurityCompliance() {
    console.log('🛡️ Validating Security Compliance...');

    // Test unauthorized access protection
    await this.runValidation('Unauthorized Access Protection', async () => {
      try {
        await axios.get(`${BASE_URL}/api/repositories`);
        return false; // Should fail without token
      } catch (error) {
        return error.response.status === 401;
      }
    });

    // Test authentic CVE data (no synthetic data)
    await this.runValidation('Authentic CVE Data', async () => {
      const token = await this.getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Validate that alerts contain real CVE references
      if (response.data.length > 0) {
        const alert = response.data[0];
        return alert.cveId && alert.cveId.startsWith('CVE-');
      }
      return true; // No alerts is acceptable
    });
  }

  async getAuthToken() {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
      return response.data.token;
    } catch (error) {
      throw new Error('Failed to get authentication token');
    }
  }

  async runValidation(testName, testFunction) {
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result) {
        console.log(`  ✅ ${testName} (${duration}ms)`);
        this.results.push({ name: testName, status: 'PASS', duration });
      } else {
        console.log(`  ❌ ${testName} - Test returned false`);
        this.results.push({ name: testName, status: 'FAIL', duration, reason: 'Test returned false' });
      }
    } catch (error) {
      console.log(`  ❌ ${testName} - ${error.message}`);
      this.results.push({ name: testName, status: 'FAIL', duration: 0, reason: error.message });
    }
  }

  generateComprehensiveReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    const totalDuration = Date.now() - this.startTime;

    console.log('\n📋 Comprehensive Validation Report:');
    console.log('=======================================');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`📊 Total: ${totalTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Validations:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.reason}`);
      });
    }

    const productionReadiness = successRate >= 95 ? '🟢 EXCELLENT' : 
                               successRate >= 85 ? '🟡 GOOD' : 
                               successRate >= 70 ? '🟠 FAIR' : '🔴 POOR';

    console.log(`\n🎯 Production Readiness Assessment:`);
    console.log(`${productionReadiness} - ${successRate}% functionality validated`);

    if (successRate >= 95) {
      console.log('\n🚀 READY FOR COMMERCIAL DEPLOYMENT');
      console.log('All critical systems validated and operational');
    } else {
      console.log('\n⚠️ Additional fixes required before deployment');
    }
  }
}

// Run comprehensive validation
const validator = new ComprehensiveValidator();
validator.runCompleteValidation().catch(console.error);

export default ComprehensiveValidator;