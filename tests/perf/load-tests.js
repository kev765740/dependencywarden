/**
 * Performance and Load Testing Suite
 * Comprehensive performance validation for DependencyWarden
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';

class PerformanceTestSuite {
  constructor() {
    this.authToken = null;
    this.performanceResults = [];
    this.loadTestResults = [];
    this.memoryBaseline = process.memoryUsage();
  }

  async runPerformanceTests() {
    console.log('⚡ Starting Performance Test Suite...\n');

    await this.setupAuthentication();
    await this.testAPILatency();
    await this.testConcurrentUsers();
    await this.testDatabasePerformance();
    await this.testMemoryUsage();
    await this.testThroughput();
    await this.generatePerformanceReport();
  }

  async setupAuthentication() {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@depwatch.dev',
        password: 'test123'
      });
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        console.log('Authentication setup completed');
      }
    } catch (error) {
      console.log('Authentication setup failed:', error.message);
    }
  }

  async testAPILatency() {
    console.log('🚀 Testing API Latency...');

    const endpoints = [
      { name: 'GET /api/stats', url: '/api/stats', target: 200 },
      { name: 'GET /api/repositories', url: '/api/repositories', target: 300 },
      { name: 'GET /api/auth/user', url: '/api/auth/user', target: 150 },
      { name: 'GET /api/jobs/recent', url: '/api/jobs/recent', target: 250 },
      { name: 'GET /api/jobs/stats', url: '/api/jobs/stats', target: 100 }
    ];

    for (const endpoint of endpoints) {
      await this.measureEndpointLatency(endpoint);
    }
  }

  async measureEndpointLatency(endpoint) {
    const iterations = 10;
    const latencies = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        if (response.status === 200) {
          latencies.push(latency);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name} - Request failed: ${error.message}`);
      }

      // Small delay between requests
      await this.sleep(100);
    }

    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const p95Latency = this.calculatePercentile(latencies, 95);

      const result = {
        endpoint: endpoint.name,
        averageLatency: avgLatency,
        minLatency: minLatency,
        maxLatency: maxLatency,
        p95Latency: p95Latency,
        targetLatency: endpoint.target,
        meetsTarget: avgLatency <= endpoint.target,
        samples: latencies.length
      };

      this.performanceResults.push(result);

      const status = result.meetsTarget ? '✅' : '⚠️';
      console.log(`  ${status} ${endpoint.name}: ${avgLatency.toFixed(2)}ms avg (target: ${endpoint.target}ms)`);
    }
  }

  async testConcurrentUsers() {
    console.log('👥 Testing Concurrent User Load...');

    const userLoads = [5, 10, 25, 50];

    for (const userCount of userLoads) {
      await this.testConcurrentLoad(userCount);
    }
  }

  async testConcurrentLoad(userCount) {
    console.log(`  Testing ${userCount} concurrent users...`);

    const startTime = performance.now();
    const promises = [];

    // Create concurrent user sessions
    for (let i = 0; i < userCount; i++) {
      promises.push(this.simulateUserSession());
    }

    try {
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;
      const totalTime = endTime - startTime;
      const successRate = (successful / results.length) * 100;

      const loadResult = {
        userCount: userCount,
        totalTime: totalTime,
        successfulUsers: successful,
        failedUsers: failed,
        successRate: successRate,
        avgResponseTime: totalTime / userCount
      };

      this.loadTestResults.push(loadResult);

      const status = successRate >= 95 ? '✅' : successRate >= 80 ? '⚠️' : '❌';
      console.log(`  ${status} ${userCount} users: ${successRate.toFixed(1)}% success, ${totalTime.toFixed(2)}ms total`);

    } catch (error) {
      console.log(`  ❌ ${userCount} users: Load test failed - ${error.message}`);
    }
  }

  async simulateUserSession() {
    try {
      // Simulate typical user workflow
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@depwatch.dev',
        password: 'test123'
      });

      if (loginResponse.status !== 200) return false;

      const token = loginResponse.data.token;

      // Fetch dashboard data
      await axios.get(`${BASE_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch repositories
      await axios.get(`${BASE_URL}/api/repositories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch recent jobs
      await axios.get(`${BASE_URL}/api/jobs/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async testDatabasePerformance() {
    console.log('🗄️ Testing Database Performance...');

    // Test large data queries
    await this.testLargeDataQuery();
    await this.testComplexAggregations();
    await this.testConcurrentDatabaseAccess();
  }

  async testLargeDataQuery() {
    const startTime = performance.now();

    try {
      const response = await axios.get(`${BASE_URL}/api/repositories?limit=1000`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      const result = {
        test: 'Large Data Query',
        queryTime: queryTime,
        recordCount: Array.isArray(response.data) ? response.data.length : 0,
        meetsTarget: queryTime <= 1000 // Under 1 second
      };

      this.performanceResults.push(result);

      const status = result.meetsTarget ? '✅' : '⚠️';
      console.log(`  ${status} Large Data Query: ${queryTime.toFixed(2)}ms (${result.recordCount} records)`);

    } catch (error) {
      console.log(`  ❌ Large Data Query failed: ${error.message}`);
    }
  }

  async testComplexAggregations() {
    const startTime = performance.now();

    try {
      const response = await axios.get(`${BASE_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const endTime = performance.now();
      const aggregationTime = endTime - startTime;

      const result = {
        test: 'Complex Aggregations',
        queryTime: aggregationTime,
        meetsTarget: aggregationTime <= 500 // Under 500ms
      };

      this.performanceResults.push(result);

      const status = result.meetsTarget ? '✅' : '⚠️';
      console.log(`  ${status} Complex Aggregations: ${aggregationTime.toFixed(2)}ms`);

    } catch (error) {
      console.log(`  ❌ Complex Aggregations failed: ${error.message}`);
    }
  }

  async testConcurrentDatabaseAccess() {
    console.log('  Testing concurrent database access...');

    const concurrentQueries = 20;
    const startTime = performance.now();

    const promises = Array(concurrentQueries).fill().map(() =>
      axios.get(`${BASE_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      }).catch(error => error.response)
    );

    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const successful = results.filter(r => r && r.status === 200).length;
      const totalTime = endTime - startTime;

      const result = {
        test: 'Concurrent Database Access',
        totalTime: totalTime,
        successfulQueries: successful,
        totalQueries: concurrentQueries,
        successRate: (successful / concurrentQueries) * 100,
        avgQueryTime: totalTime / concurrentQueries
      };

      this.performanceResults.push(result);

      const status = result.successRate >= 95 ? '✅' : '⚠️';
      console.log(`  ${status} Concurrent DB Access: ${result.successRate.toFixed(1)}% success, ${result.avgQueryTime.toFixed(2)}ms avg`);

    } catch (error) {
      console.log(`  ❌ Concurrent Database Access failed: ${error.message}`);
    }
  }

  async testMemoryUsage() {
    console.log('💾 Testing Memory Usage...');

    const initialMemory = process.memoryUsage();

    // Perform memory-intensive operations
    await this.performMemoryIntensiveOperations();

    const finalMemory = process.memoryUsage();

    const memoryResult = {
      test: 'Memory Usage',
      initialHeapUsed: initialMemory.heapUsed,
      finalHeapUsed: finalMemory.heapUsed,
      heapIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
      initialRSS: initialMemory.rss,
      finalRSS: finalMemory.rss,
      rssIncrease: finalMemory.rss - initialMemory.rss
    };

    this.performanceResults.push(memoryResult);

    const heapMB = memoryResult.heapIncrease / 1024 / 1024;
    const rssMB = memoryResult.rssIncrease / 1024 / 1024;

    console.log(`  📊 Memory Usage: Heap +${heapMB.toFixed(2)}MB, RSS +${rssMB.toFixed(2)}MB`);
  }

  async performMemoryIntensiveOperations() {
    // Simulate multiple API calls
    const operations = Array(50).fill().map(() =>
      axios.get(`${BASE_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      }).catch(() => null)
    );

    await Promise.all(operations);
    
    // Force garbage collection if possible
    if (global.gc) {
      global.gc();
    }
  }

  async testThroughput() {
    console.log('📊 Testing Throughput...');

    const testDuration = 30000; // 30 seconds
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;

    while (Date.now() - startTime < testDuration) {
      try {
        const response = await axios.get(`${BASE_URL}/api/stats`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        requestCount++;
        if (response.status === 200) {
          successCount++;
        }

      } catch (error) {
        requestCount++;
      }

      // Small delay to prevent overwhelming the server
      await this.sleep(10);
    }

    const actualDuration = Date.now() - startTime;
    const throughput = successCount / (actualDuration / 1000); // requests per second
    const successRate = (successCount / requestCount) * 100;

    const throughputResult = {
      test: 'Throughput',
      duration: actualDuration,
      totalRequests: requestCount,
      successfulRequests: successCount,
      throughput: throughput,
      successRate: successRate
    };

    this.performanceResults.push(throughputResult);

    console.log(`  📈 Throughput: ${throughput.toFixed(2)} req/sec, ${successRate.toFixed(1)}% success`);
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generatePerformanceReport() {
    console.log('\n📊 Performance Test Results Summary:');
    console.log('════════════════════════════════════════');

    // API Latency Summary
    const latencyTests = this.performanceResults.filter(r => r.averageLatency);
    if (latencyTests.length > 0) {
      console.log('\n🚀 API Latency Results:');
      latencyTests.forEach(test => {
        const status = test.meetsTarget ? '✅' : '⚠️';
        console.log(`  ${status} ${test.endpoint}: ${test.averageLatency.toFixed(2)}ms avg (P95: ${test.p95Latency.toFixed(2)}ms)`);
      });

      const avgLatency = latencyTests.reduce((sum, test) => sum + test.averageLatency, 0) / latencyTests.length;
      const targetsMet = latencyTests.filter(test => test.meetsTarget).length;
      console.log(`  📈 Overall: ${avgLatency.toFixed(2)}ms avg, ${targetsMet}/${latencyTests.length} targets met`);
    }

    // Load Test Summary
    if (this.loadTestResults.length > 0) {
      console.log('\n👥 Concurrent Load Results:');
      this.loadTestResults.forEach(test => {
        const status = test.successRate >= 95 ? '✅' : test.successRate >= 80 ? '⚠️' : '❌';
        console.log(`  ${status} ${test.userCount} users: ${test.successRate.toFixed(1)}% success, ${test.avgResponseTime.toFixed(2)}ms avg`);
      });
    }

    // Database Performance Summary
    const dbTests = this.performanceResults.filter(r => r.test && r.test.includes('Database') || r.test === 'Large Data Query' || r.test === 'Complex Aggregations');
    if (dbTests.length > 0) {
      console.log('\n🗄️ Database Performance:');
      dbTests.forEach(test => {
        if (test.queryTime) {
          const status = test.meetsTarget ? '✅' : '⚠️';
          console.log(`  ${status} ${test.test}: ${test.queryTime.toFixed(2)}ms`);
        }
      });
    }

    // Memory Usage Summary
    const memoryTest = this.performanceResults.find(r => r.test === 'Memory Usage');
    if (memoryTest) {
      console.log('\n💾 Memory Usage:');
      const heapMB = memoryTest.heapIncrease / 1024 / 1024;
      const rssMB = memoryTest.rssIncrease / 1024 / 1024;
      console.log(`  📊 Heap Usage: +${heapMB.toFixed(2)}MB`);
      console.log(`  📊 RSS Usage: +${rssMB.toFixed(2)}MB`);
    }

    // Throughput Summary
    const throughputTest = this.performanceResults.find(r => r.test === 'Throughput');
    if (throughputTest) {
      console.log('\n📊 Throughput:');
      console.log(`  📈 ${throughputTest.throughput.toFixed(2)} requests/second`);
      console.log(`  📈 ${throughputTest.successRate.toFixed(1)}% success rate`);
    }

    // Performance Score
    const performanceScore = this.calculatePerformanceScore();
    console.log(`\n🎯 Overall Performance Score: ${performanceScore}/100`);

    return {
      latencyTests,
      loadTests: this.loadTestResults,
      databaseTests: dbTests,
      memoryTest,
      throughputTest,
      performanceScore
    };
  }

  calculatePerformanceScore() {
    let score = 0;
    let maxScore = 0;

    // API Latency Score (30 points)
    const latencyTests = this.performanceResults.filter(r => r.averageLatency);
    if (latencyTests.length > 0) {
      const targetsMet = latencyTests.filter(test => test.meetsTarget).length;
      score += (targetsMet / latencyTests.length) * 30;
      maxScore += 30;
    }

    // Load Test Score (25 points)
    if (this.loadTestResults.length > 0) {
      const avgSuccessRate = this.loadTestResults.reduce((sum, test) => sum + test.successRate, 0) / this.loadTestResults.length;
      score += (avgSuccessRate / 100) * 25;
      maxScore += 25;
    }

    // Database Performance Score (25 points)
    const dbTests = this.performanceResults.filter(r => r.meetsTarget !== undefined && r.test);
    if (dbTests.length > 0) {
      const dbTargetsMet = dbTests.filter(test => test.meetsTarget).length;
      score += (dbTargetsMet / dbTests.length) * 25;
      maxScore += 25;
    }

    // Throughput Score (20 points)
    const throughputTest = this.performanceResults.find(r => r.test === 'Throughput');
    if (throughputTest) {
      // Score based on success rate
      score += (throughputTest.successRate / 100) * 20;
      maxScore += 20;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }
}

export default PerformanceTestSuite;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const perfTests = new PerformanceTestSuite();
  perfTests.runPerformanceTests().catch(console.error);
}