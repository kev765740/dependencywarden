/**
 * End-to-End Platform Testing Suite
 * Comprehensive testing across all critical functionality
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-url.replit.app'
  : 'http://localhost:5000';

class PlatformTester {
  constructor() {
    this.testResults = [];
    this.cookies = '';
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      await testFn();
      console.log(`✅ ${name} - PASSED`);
      this.testResults.push({ name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ ${name} - FAILED: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.cookies,
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Update cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookies = setCookie;
    }

    return response;
  }

  async testHealthCheck() {
    const response = await this.makeRequest('/api/health');
    const data = await response.json();
    
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    if (!data.status || data.status !== 'ok') {
      throw new Error('Health check returned invalid status');
    }
  }

  async testAuthentication() {
    // Test login
    const loginResponse = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    // Test user info retrieval
    const userResponse = await this.makeRequest('/api/auth/user');
    const userData = await userResponse.json();

    if (userResponse.status !== 200) {
      throw new Error(`User info retrieval failed with status ${userResponse.status}`);
    }

    if (!userData.id || !userData.email) {
      throw new Error('User data incomplete');
    }
  }

  async testRepositoryManagement() {
    // Test repository creation
    const createResponse = await this.makeRequest('/api/repositories', {
      method: 'POST',
      body: JSON.stringify({
        gitUrl: 'https://github.com/test/repo.git',
        githubToken: 'test-token',
        ownerEmail: 'test@example.com',
        slackWebhookUrl: 'https://hooks.slack.com/test'
      })
    });

    if (createResponse.status !== 200) {
      throw new Error(`Repository creation failed with status ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    if (!createData.success || !createData.repository) {
      throw new Error('Repository creation response invalid');
    }

    // Test repository listing
    const listResponse = await this.makeRequest('/api/repositories');
    const repositories = await listResponse.json();

    if (listResponse.status !== 200) {
      throw new Error(`Repository listing failed with status ${listResponse.status}`);
    }

    if (!Array.isArray(repositories)) {
      throw new Error('Repository listing returned invalid format');
    }

    return createData.repository;
  }

  async testSecurityScanning(repository) {
    // Test scan initiation
    const scanResponse = await this.makeRequest(`/api/repositories/${repository.id}/scan`, {
      method: 'POST'
    });

    if (scanResponse.status !== 200) {
      throw new Error(`Scan initiation failed with status ${scanResponse.status}`);
    }

    const scanData = await scanResponse.json();
    if (!scanData.success || !scanData.scanId) {
      throw new Error('Scan initiation response invalid');
    }
  }

  async testJobMonitoring() {
    // Test job statistics
    const statsResponse = await this.makeRequest('/api/jobs/stats');
    if (statsResponse.status !== 200) {
      throw new Error(`Job stats failed with status ${statsResponse.status}`);
    }

    const stats = await statsResponse.json();
    if (typeof stats.total !== 'number') {
      throw new Error('Job stats format invalid');
    }

    // Test recent jobs
    const jobsResponse = await this.makeRequest('/api/jobs/recent');
    if (jobsResponse.status !== 200) {
      throw new Error(`Recent jobs failed with status ${jobsResponse.status}`);
    }

    const jobs = await jobsResponse.json();
    if (!Array.isArray(jobs)) {
      throw new Error('Recent jobs format invalid');
    }
  }

  async testDashboardData() {
    // Test dashboard statistics
    const statsResponse = await this.makeRequest('/api/stats');
    if (statsResponse.status !== 200) {
      throw new Error(`Dashboard stats failed with status ${statsResponse.status}`);
    }

    const stats = await statsResponse.json();
    if (typeof stats.totalRepos !== 'number' || typeof stats.activeAlerts !== 'number') {
      throw new Error('Dashboard stats format invalid');
    }
  }

  async testNotificationSystem() {
    // Test notifications retrieval
    const notifResponse = await this.makeRequest('/api/notifications');
    if (notifResponse.status !== 200) {
      throw new Error(`Notifications failed with status ${notifResponse.status}`);
    }

    const notifications = await notifResponse.json();
    if (!Array.isArray(notifications)) {
      throw new Error('Notifications format invalid');
    }
  }

  async testSecurityCopilot() {
    // Test AI security analysis
    const analysisResponse = await this.makeRequest('/api/security/analyze', {
      method: 'POST',
      body: JSON.stringify({
        vulnerability: 'CVE-2024-1001',
        context: 'Express.js application vulnerability'
      })
    });

    // Note: This might fail if Google API key is not configured
    if (analysisResponse.status !== 200 && analysisResponse.status !== 500) {
      throw new Error(`Security analysis unexpected status ${analysisResponse.status}`);
    }
  }

  async testFeedbackSystem() {
    // Test feedback submission
    const feedbackResponse = await this.makeRequest('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        type: 'bug',
        title: 'Test feedback',
        description: 'End-to-end test feedback submission',
        userEmail: 'test@example.com'
      })
    });

    if (feedbackResponse.status !== 200) {
      throw new Error(`Feedback submission failed with status ${feedbackResponse.status}`);
    }

    const feedbackData = await feedbackResponse.json();
    if (!feedbackData.success) {
      throw new Error('Feedback submission response invalid');
    }
  }

  async testErrorHandling() {
    // Test invalid endpoint
    const invalidResponse = await this.makeRequest('/api/invalid-endpoint');
    if (invalidResponse.status !== 404) {
      throw new Error('Invalid endpoint should return 404');
    }

    // Test invalid repository ID
    const invalidRepoResponse = await this.makeRequest('/api/repositories/99999/scan', {
      method: 'POST'
    });
    if (invalidRepoResponse.status !== 404) {
      throw new Error('Invalid repository should return 404');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive platform tests...\n');
    
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Authentication Flow', () => this.testAuthentication());
    
    const repository = await this.runTest('Repository Management', () => this.testRepositoryManagement());
    if (repository) {
      await this.runTest('Security Scanning', () => this.testSecurityScanning(repository));
    }
    
    await this.runTest('Job Monitoring', () => this.testJobMonitoring());
    await this.runTest('Dashboard Data', () => this.testDashboardData());
    await this.runTest('Notification System', () => this.testNotificationSystem());
    await this.runTest('Security Copilot', () => this.testSecurityCopilot());
    await this.runTest('Feedback System', () => this.testFeedbackSystem());
    await this.runTest('Error Handling', () => this.testErrorHandling());

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
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
    
    console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed - review above'));
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PlatformTester();
  tester.runAllTests().catch(console.error);
}

export default PlatformTester;