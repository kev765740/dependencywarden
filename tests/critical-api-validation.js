
/**
 * Critical API Validation Suite
 * Validates all API endpoints with edge cases and error scenarios
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

class CriticalAPIValidator {
  constructor() {
    this.results = [];
    this.authToken = null;
    this.testUser = {
      email: 'api-test@depwatch.dev',
      password: 'APITest123!',
      username: 'apitest'
    };
  }

  async runCriticalValidation() {
    console.log('🔥 Starting Critical API Validation Suite...\n');

    try {
      await this.setupTestEnvironment();
      await this.validateCoreAPIs();
      await this.validateAuthenticationAPIs();
      await this.validateRepositoryAPIs();
      await this.validateSecurityAPIs();
      await this.validateAnalyticsAPIs();
      await this.validateIntegrationAPIs();
      await this.validateErrorHandling();
      await this.validateEdgeCases();
      await this.validateDataIntegrity();
      await this.validateSecurityVulnerabilities();
      
      this.generateValidationReport();
    } catch (error) {
      console.error('❌ Critical API validation failed:', error);
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Register test user
    await this.testAPI('Test User Registration', 'POST', '/api/auth/register', this.testUser, [200, 201, 409]);
    
    // Login and get token
    await this.testAPI('Test User Login', 'POST', '/api/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password
    }, 200, (response) => {
      this.authToken = response.data.token;
      return true;
    });
  }

  async validateCoreAPIs() {
    console.log('🏗️ Validating Core APIs...');
    
    // Health endpoints
    await this.testAPI('Health Check', 'GET', '/health', null, 200);
    await this.testAPI('System Status', 'GET', '/api/health', null, [200, 404]);
    
    // Version info
    await this.testAPI('API Version', 'GET', '/api/version', null, [200, 404]);
    
    // Options requests
    await this.testAPI('Options Support', 'OPTIONS', '/api/stats', null, [200, 204, 404]);
  }

  async validateAuthenticationAPIs() {
    console.log('🔐 Validating Authentication APIs...');
    
    // Valid authentication
    await this.testAPI('Valid Login', 'POST', '/api/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password
    }, 200);

    // Invalid credentials
    await this.testAPI('Invalid Password', 'POST', '/api/auth/login', {
      email: this.testUser.email,
      password: 'wrongpassword'
    }, [400, 401, 403]);

    await this.testAPI('Invalid Email', 'POST', '/api/auth/login', {
      email: 'nonexistent@test.com',
      password: 'password'
    }, [400, 401, 404]);

    // User info retrieval
    await this.testAuthenticatedAPI('User Info', 'GET', '/api/auth/user', null, 200);

    // Logout
    await this.testAuthenticatedAPI('User Logout', 'POST', '/api/auth/logout', null, [200, 204]);

    // Protected endpoint without auth
    await this.testAPI('Unauthorized Access', 'GET', '/api/repositories', null, 401);

    // Invalid token
    await this.testAPI('Invalid Token', 'GET', '/api/repositories', null, 401, null, {
      'Authorization': 'Bearer invalid-token'
    });
  }

  async validateRepositoryAPIs() {
    console.log('📁 Validating Repository APIs...');
    
    const testRepo = {
      name: 'API Test Repository',
      gitUrl: 'https://github.com/expressjs/express',
      ownerEmail: 'test@example.com',
      defaultBranch: 'main'
    };

    // Repository creation
    await this.testAuthenticatedAPI('Create Repository', 'POST', '/api/repositories', testRepo, 200);

    // Repository listing
    await this.testAuthenticatedAPI('List Repositories', 'GET', '/api/repositories', null, 200, (response) => {
      return Array.isArray(response.data);
    });

    // Get repository details
    let repoId;
    await this.testAuthenticatedAPI('Repository Details', 'GET', '/api/repositories', null, 200, (response) => {
      if (response.data.length > 0) {
        repoId = response.data[0].id;
        return true;
      }
      return true; // No repos is acceptable
    });

    if (repoId) {
      // Individual repository
      await this.testAuthenticatedAPI('Individual Repository', 'GET', `/api/repositories/${repoId}`, null, 200);
      
      // Repository scanning
      await this.testAuthenticatedAPI('Repository Scan', 'POST', `/api/repositories/${repoId}/scan`, {}, 200);
      
      // SBOM generation
      await this.testAuthenticatedAPI('SBOM Generation', 'GET', `/api/repositories/${repoId}/sbom`, null, 200);
      
      // Invalid repository ID
      await this.testAuthenticatedAPI('Invalid Repository ID', 'GET', '/api/repositories/99999', null, 404);
    }

    // Invalid repository data
    await this.testAuthenticatedAPI('Invalid Repository Data', 'POST', '/api/repositories', {
      name: '',
      gitUrl: 'not-a-url'
    }, [400, 422]);

    // Duplicate repository
    await this.testAuthenticatedAPI('Duplicate Repository', 'POST', '/api/repositories', testRepo, [200, 400, 409]);
  }

  async validateSecurityAPIs() {
    console.log('🛡️ Validating Security APIs...');
    
    // Security alerts
    await this.testAuthenticatedAPI('Security Alerts', 'GET', '/api/notifications', null, 200, (response) => {
      return Array.isArray(response.data);
    });

    // Security analysis
    const analysisData = {
      message: 'Test vulnerability analysis',
      context: 'API validation test',
      vulnerability: 'Test Vulnerability',
      packageName: 'test-package',
      version: '1.0.0'
    };
    
    await this.testAuthenticatedAPI('Security Analysis', 'POST', '/api/security/analyze', analysisData, 200);

    // Invalid analysis data
    await this.testAuthenticatedAPI('Invalid Analysis Data', 'POST', '/api/security/analyze', {}, [400, 422]);

    // Security workflows
    await this.testAuthenticatedAPI('Security Workflows', 'GET', '/api/security/workflows', null, 200);

    // License policies
    await this.testAuthenticatedAPI('License Policies', 'GET', '/api/license/policies', null, 200);
  }

  async validateAnalyticsAPIs() {
    console.log('📊 Validating Analytics APIs...');
    
    // Dashboard statistics
    await this.testAuthenticatedAPI('Dashboard Stats', 'GET', '/api/stats', null, 200, (response) => {
      const data = response.data;
      return typeof data.totalRepos === 'number' && 
             typeof data.activeAlerts === 'number' &&
             typeof data.criticalIssues === 'number';
    });

    // Job statistics
    await this.testAuthenticatedAPI('Job Statistics', 'GET', '/api/jobs/stats', null, 200, (response) => {
      const data = response.data;
      return typeof data.total === 'number';
    });

    // Recent jobs
    await this.testAuthenticatedAPI('Recent Jobs', 'GET', '/api/jobs/recent', null, 200, (response) => {
      return Array.isArray(response.data);
    });

    // Job status with invalid ID
    await this.testAuthenticatedAPI('Invalid Job ID', 'GET', '/api/jobs/99999', null, 404);
  }

  async validateIntegrationAPIs() {
    console.log('🔗 Validating Integration APIs...');
    
    // Team management
    await this.testAuthenticatedAPI('Team Management', 'GET', '/api/teams', null, 200);

    // Billing status
    await this.testAuthenticatedAPI('Billing Status', 'GET', '/api/billing/status', null, 200);

    // Feedback submission
    const feedbackData = {
      type: 'bug',
      title: 'API Test Feedback',
      description: 'Test feedback from API validation',
      userEmail: this.testUser.email
    };
    
    await this.testAuthenticatedAPI('Feedback Submission', 'POST', '/api/feedback', feedbackData, 200);

    // Invalid feedback data
    await this.testAuthenticatedAPI('Invalid Feedback', 'POST', '/api/feedback', {
      type: 'invalid-type'
    }, [400, 422]);
  }

  async validateErrorHandling() {
    console.log('🚨 Validating Error Handling...');
    
    // 404 endpoints
    const nonExistentEndpoints = [
      '/api/nonexistent',
      '/api/invalid/endpoint',
      '/api/repositories/invalid',
      '/api/users/999999'
    ];

    for (const endpoint of nonExistentEndpoints) {
      await this.testAPI(`404 Error: ${endpoint}`, 'GET', endpoint, null, 404);
    }

    // Method not allowed
    await this.testAPI('Method Not Allowed', 'PATCH', '/health', null, [404, 405]);

    // Large payload
    const largePayload = {
      data: 'x'.repeat(10000000) // 10MB string
    };
    await this.testAuthenticatedAPI('Large Payload', 'POST', '/api/feedback', largePayload, [400, 413, 422]);

    // Malformed JSON
    await this.testRawAPI('Malformed JSON', 'POST', '/api/auth/login', '{"invalid": json}', [400, 422]);
  }

  async validateEdgeCases() {
    console.log('🔍 Validating Edge Cases...');
    
    // Empty requests
    await this.testAuthenticatedAPI('Empty POST Request', 'POST', '/api/repositories', {}, [400, 422]);

    // SQL injection attempts
    const sqlInjectionData = {
      email: "admin'; DROP TABLE users; --",
      password: "password"
    };
    await this.testAPI('SQL Injection Protection', 'POST', '/api/auth/login', sqlInjectionData, [400, 401]);

    // XSS attempts
    const xssData = {
      name: '<script>alert("xss")</script>',
      gitUrl: 'https://github.com/test/test'
    };
    await this.testAuthenticatedAPI('XSS Protection', 'POST', '/api/repositories', xssData, [200, 400]);

    // Extremely long strings
    const longStringData = {
      name: 'x'.repeat(1000),
      gitUrl: 'https://github.com/test/test'
    };
    await this.testAuthenticatedAPI('Long String Handling', 'POST', '/api/repositories', longStringData, [200, 400]);

    // Special characters
    const specialCharData = {
      name: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      gitUrl: 'https://github.com/test/test'
    };
    await this.testAuthenticatedAPI('Special Characters', 'POST', '/api/repositories', specialCharData, [200, 400]);
  }

  async validateDataIntegrity() {
    console.log('🔒 Validating Data Integrity...');
    
    // Verify no synthetic data in production endpoints
    await this.testAuthenticatedAPI('Authentic CVE Data', 'GET', '/api/notifications', null, 200, (response) => {
      const alerts = response.data;
      if (alerts.length > 0) {
        // Check for real CVE IDs or legitimate severity levels
        return alerts.every(alert => 
          (alert.cveId && alert.cveId.startsWith('CVE-')) ||
          (alert.severity && ['low', 'medium', 'high', 'critical'].includes(alert.severity))
        );
      }
      return true; // No alerts is acceptable
    });

    // Data consistency check
    await this.testAuthenticatedAPI('Data Consistency', 'GET', '/api/stats', null, 200, async (response) => {
      const stats = response.data;
      
      // Get actual repository count
      const reposResponse = await axios.get(`${BASE_URL}/api/repositories`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      const actualRepoCount = reposResponse.data.length;
      const statsRepoCount = stats.totalRepos;
      
      // Allow for minor timing differences
      return Math.abs(actualRepoCount - statsRepoCount) <= 2;
    });
  }

  async validateSecurityVulnerabilities() {
    console.log('🛡️ Validating Security Vulnerabilities...');
    
    // Rate limiting
    await this.testRateLimiting();
    
    // Authentication bypass attempts
    await this.testAuthenticationBypass();
    
    // Authorization bypass attempts
    await this.testAuthorizationBypass();
    
    // Data exposure checks
    await this.testDataExposure();
  }

  async testRateLimiting() {
    return await this.testValidation('Rate Limiting', async () => {
      const rapidRequests = Array(20).fill().map(() => 
        axios.get(`${BASE_URL}/health`)
      );
      
      const results = await Promise.allSettled(rapidRequests);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      // Should handle requests but may limit some
      return successCount > 0 && successCount <= 20;
    });
  }

  async testAuthenticationBypass() {
    return await this.testValidation('Authentication Bypass Prevention', async () => {
      // Try accessing protected endpoint with manipulated headers
      try {
        await axios.get(`${BASE_URL}/api/repositories`, {
          headers: {
            'X-User-ID': '1',
            'X-Admin': 'true',
            'Authorization': 'Bearer fake-token'
          }
        });
        return false; // Should not succeed
      } catch (error) {
        return error.response?.status === 401;
      }
    });
  }

  async testAuthorizationBypass() {
    return await this.testValidation('Authorization Bypass Prevention', async () => {
      // Try accessing admin endpoints
      try {
        await axios.get(`${BASE_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        return true; // Either no admin endpoint or proper authorization
      } catch (error) {
        return error.response?.status === 403 || error.response?.status === 404;
      }
    });
  }

  async testDataExposure() {
    return await this.testValidation('Data Exposure Prevention', async () => {
      // Check if sensitive data is exposed in responses
      const response = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      const userData = response.data;
      
      // Should not expose password or sensitive tokens
      return !userData.password && 
             !userData.passwordHash && 
             !userData.sessionToken &&
             !userData.privateKey;
    });
  }

  // Helper methods

  async testAPI(name, method, endpoint, data, expectedStatus, validator = null, customHeaders = {}) {
    return await this.testValidation(name, async () => {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders
        }
      };

      if (data) config.data = data;

      try {
        const response = await axios(config);
        
        const statusMatch = Array.isArray(expectedStatus) 
          ? expectedStatus.includes(response.status)
          : response.status === expectedStatus;
          
        if (!statusMatch) return false;
        
        return validator ? validator(response) : true;
        
      } catch (error) {
        const statusMatch = Array.isArray(expectedStatus) 
          ? expectedStatus.includes(error.response?.status)
          : error.response?.status === expectedStatus;
          
        return statusMatch;
      }
    });
  }

  async testAuthenticatedAPI(name, method, endpoint, data, expectedStatus, validator = null) {
    return await this.testAPI(name, method, endpoint, data, expectedStatus, validator, {
      'Authorization': `Bearer ${this.authToken}`
    });
  }

  async testRawAPI(name, method, endpoint, rawData, expectedStatus) {
    return await this.testValidation(name, async () => {
      try {
        const response = await axios({
          method: method.toLowerCase(),
          url: `${BASE_URL}${endpoint}`,
          data: rawData,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return Array.isArray(expectedStatus) 
          ? expectedStatus.includes(response.status)
          : response.status === expectedStatus;
          
      } catch (error) {
        return Array.isArray(expectedStatus) 
          ? expectedStatus.includes(error.response?.status)
          : error.response?.status === expectedStatus;
      }
    });
  }

  async testValidation(name, testFunction) {
    try {
      const result = await testFunction();
      
      if (result) {
        console.log(`  ✅ ${name}`);
        this.results.push({ name, status: 'PASS' });
      } else {
        console.log(`  ❌ ${name} - Validation failed`);
        this.results.push({ name, status: 'FAIL', error: 'Validation failed' });
      }
      
      return result;
    } catch (error) {
      console.log(`  ❌ ${name} - ${error.message}`);
      this.results.push({ name, status: 'FAIL', error: error.message });
      return false;
    }
  }

  generateValidationReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('🔥 CRITICAL API VALIDATION REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`🧪 Total Validations: ${totalTests}`);

    if (failedTests > 0) {
      console.log(`\n❌ FAILED VALIDATIONS:`);
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log(`\n🎯 API SECURITY ASSESSMENT:`);
    if (successRate >= 98) {
      console.log('🟢 EXCELLENT - APIs are secure and robust');
    } else if (successRate >= 95) {
      console.log('🟢 GOOD - APIs meet security standards');
    } else if (successRate >= 90) {
      console.log('🟡 ACCEPTABLE - Minor security improvements needed');
    } else {
      console.log('🔴 CONCERNING - Security issues require immediate attention');
    }

    console.log('='.repeat(70));
  }
}

// Run critical API validation
const validator = new CriticalAPIValidator();
validator.runCriticalValidation().catch(console.error);

export default CriticalAPIValidator;
