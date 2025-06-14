/**
 * DependencyWarden QA Automation Master Runner
 * Orchestrates all test suites and generates comprehensive reports
 */

import ComprehensiveQASuite from './comprehensive-qa-suite.js';
import APITestSuite from './api/endpoint-tests.js';
import PerformanceTestSuite from './perf/load-tests.js';
import SecurityTestSuite from './security/security-tests.js';
import CICDTestSuite from './integration/ci-cd-tests.js';
import fs from 'fs';
import path from 'path';

class QAAutomationRunner {
  constructor() {
    this.startTime = Date.now();
    this.allResults = {
      comprehensive: null,
      api: null,
      performance: null,
      security: null,
      cicd: null
    };
    this.masterReport = {
      summary: {},
      suiteResults: {},
      overallScore: 0,
      criticalIssues: [],
      recommendations: []
    };
  }

  async runFullQAAutomation() {
    console.log('🚀 DependencyWarden QA Automation Suite');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 Running comprehensive end-to-end validation of all features');
    console.log('🎯 Testing UI, API, Security, Performance, and Integrations');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
      // Run all test suites in parallel for efficiency
      console.log('⚡ Executing all test suites in parallel...\n');
      
      const [
        comprehensiveResults,
        apiResults,
        performanceResults,
        securityResults,
        cicdResults
      ] = await Promise.allSettled([
        this.runComprehensiveTests(),
        this.runAPITests(),
        this.runPerformanceTests(),
        this.runSecurityTests(),
        this.runCICDTests()
      ]);

      // Process results
      this.processResults({
        comprehensive: comprehensiveResults,
        api: apiResults,
        performance: performanceResults,
        security: securityResults,
        cicd: cicdResults
      });

      // Generate master report
      await this.generateMasterReport();

      // Display final summary
      this.displayFinalSummary();

    } catch (error) {
      console.error('❌ QA Automation Runner failed:', error);
      throw error;
    }
  }

  async runComprehensiveTests() {
    console.log('🔄 Running Comprehensive QA Suite...');
    const suite = new ComprehensiveQASuite();
    return await suite.runFullTestSuite();
  }

  async runAPITests() {
    console.log('🔧 Running API Test Suite...');
    const suite = new APITestSuite();
    await suite.runAllAPITests();
    return suite.generateAPIReport();
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Test Suite...');
    const suite = new PerformanceTestSuite();
    await suite.runPerformanceTests();
    return suite.generatePerformanceReport();
  }

  async runSecurityTests() {
    console.log('🛡️ Running Security Test Suite...');
    const suite = new SecurityTestSuite();
    await suite.runSecurityTests();
    return suite.generateSecurityReport();
  }

  async runCICDTests() {
    console.log('🔄 Running CI/CD Integration Suite...');
    const suite = new CICDTestSuite();
    await suite.runCICDTests();
    return suite.generateCICDReport();
  }

  processResults(results) {
    // Extract successful results
    Object.keys(results).forEach(suiteKey => {
      const result = results[suiteKey];
      if (result.status === 'fulfilled') {
        this.allResults[suiteKey] = result.value;
      } else {
        console.error(`❌ ${suiteKey} suite failed:`, result.reason);
        this.allResults[suiteKey] = {
          error: result.reason.message,
          status: 'failed'
        };
      }
    });
  }

  async generateMasterReport() {
    console.log('\n📊 Generating Master QA Report...');

    const totalExecutionTime = (Date.now() - this.startTime) / 1000;

    // Calculate overall statistics
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalErrors = 0;

    Object.keys(this.allResults).forEach(suiteKey => {
      const result = this.allResults[suiteKey];
      if (result && result.summary) {
        totalTests += result.summary.total || result.summary.totalTests || 0;
        totalPassed += result.summary.passed || result.summary.passedTests || 0;
        totalFailed += result.summary.failed || result.summary.failedTests || 0;
        totalErrors += result.summary.errors || result.summary.errorTests || 0;
      }
    });

    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    this.masterReport = {
      timestamp: new Date().toISOString(),
      executionTime: `${totalExecutionTime.toFixed(2)}s`,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalErrors,
        overallSuccessRate: `${overallSuccessRate}%`
      },
      suiteResults: this.allResults,
      overallScore: this.calculateOverallScore(),
      criticalIssues: this.identifyCriticalIssues(),
      recommendations: this.generateMasterRecommendations(),
      productionReadiness: this.assessProductionReadiness()
    };

    // Save reports
    await this.saveMasterReports();
  }

  calculateOverallScore() {
    let totalScore = 0;
    let suiteCount = 0;

    // API Score (25%)
    if (this.allResults.api?.summary) {
      const apiSuccessRate = parseFloat(this.allResults.api.summary.successRate?.replace('%', '') || 0);
      totalScore += apiSuccessRate * 0.25;
      suiteCount++;
    }

    // Performance Score (20%)
    if (this.allResults.performance?.performanceScore) {
      totalScore += this.allResults.performance.performanceScore * 0.20;
      suiteCount++;
    }

    // Security Score (30%)
    if (this.allResults.security?.securityScore) {
      totalScore += this.allResults.security.securityScore * 0.30;
      suiteCount++;
    }

    // CI/CD Score (15%)
    if (this.allResults.cicd?.summary) {
      const cicdSuccessRate = parseFloat(this.allResults.cicd.summary.successRate?.replace('%', '') || 0);
      totalScore += cicdSuccessRate * 0.15;
      suiteCount++;
    }

    // Comprehensive Score (10%)
    if (this.allResults.comprehensive?.summary) {
      const compSuccessRate = parseFloat(this.allResults.comprehensive.summary.successRate?.replace('%', '') || 0);
      totalScore += compSuccessRate * 0.10;
      suiteCount++;
    }

    return Math.round(totalScore);
  }

  identifyCriticalIssues() {
    const criticalIssues = [];

    // Security vulnerabilities
    if (this.allResults.security?.vulnerabilities?.length > 0) {
      criticalIssues.push({
        category: 'Security',
        severity: 'Critical',
        issue: `${this.allResults.security.vulnerabilities.length} security vulnerabilities detected`,
        impact: 'High security risk, immediate remediation required'
      });
    }

    // Performance issues
    if (this.allResults.performance?.performanceScore < 70) {
      criticalIssues.push({
        category: 'Performance',
        severity: 'High',
        issue: 'Performance below acceptable thresholds',
        impact: 'User experience degradation, scalability concerns'
      });
    }

    // API failures
    const apiFailureRate = this.allResults.api?.summary ? 
      (this.allResults.api.summary.failed + this.allResults.api.summary.errors) / this.allResults.api.summary.total * 100 : 0;
    
    if (apiFailureRate > 20) {
      criticalIssues.push({
        category: 'API',
        severity: 'High',
        issue: `${apiFailureRate.toFixed(1)}% API test failure rate`,
        impact: 'Core functionality compromised'
      });
    }

    // Integration failures
    const cicdFailureRate = this.allResults.cicd?.summary ?
      parseFloat(this.allResults.cicd.summary.successRate?.replace('%', '') || 100) : 100;
    
    if (cicdFailureRate < 80) {
      criticalIssues.push({
        category: 'Integration',
        severity: 'Medium',
        issue: 'Integration test failures detected',
        impact: 'Deployment and operational risks'
      });
    }

    return criticalIssues;
  }

  generateMasterRecommendations() {
    const recommendations = [];
    const overallScore = this.masterReport.overallScore;

    // Overall assessment
    if (overallScore >= 90) {
      recommendations.push({
        priority: 'Info',
        category: 'Overall',
        message: 'Excellent QA results. Platform is production-ready with comprehensive validation.',
        action: 'Proceed with deployment and maintain current quality standards.'
      });
    } else if (overallScore >= 80) {
      recommendations.push({
        priority: 'Medium',
        category: 'Overall',
        message: 'Good QA results with minor improvements needed.',
        action: 'Address specific test failures before production deployment.'
      });
    } else if (overallScore >= 70) {
      recommendations.push({
        priority: 'High',
        category: 'Overall',
        message: 'QA results indicate significant issues requiring attention.',
        action: 'Comprehensive review and fixes needed before deployment.'
      });
    } else {
      recommendations.push({
        priority: 'Critical',
        category: 'Overall',
        message: 'QA results show critical issues preventing production deployment.',
        action: 'Major remediation required across multiple areas.'
      });
    }

    // Specific recommendations from each suite
    Object.keys(this.allResults).forEach(suiteKey => {
      const result = this.allResults[suiteKey];
      if (result?.recommendations) {
        recommendations.push(...result.recommendations.map(rec => ({
          ...rec,
          suite: suiteKey
        })));
      }
    });

    return recommendations;
  }

  assessProductionReadiness() {
    const score = this.masterReport.overallScore;
    const criticalCount = this.criticalIssues.filter(issue => issue.severity === 'Critical').length;
    const highCount = this.criticalIssues.filter(issue => issue.severity === 'High').length;

    if (criticalCount > 0) {
      return {
        status: 'Not Ready',
        reason: 'Critical security or functionality issues detected',
        recommendation: 'Address all critical issues before deployment'
      };
    } else if (score >= 85 && highCount === 0) {
      return {
        status: 'Production Ready',
        reason: 'Comprehensive validation passed with excellent scores',
        recommendation: 'Approved for production deployment'
      };
    } else if (score >= 75 && highCount <= 2) {
      return {
        status: 'Ready with Caution',
        reason: 'Good validation results with minor issues',
        recommendation: 'Address high-priority issues, monitor closely post-deployment'
      };
    } else {
      return {
        status: 'Needs Improvement',
        reason: 'Multiple issues requiring attention',
        recommendation: 'Comprehensive fixes needed before production consideration'
      };
    }
  }

  async saveMasterReports() {
    const reportsDir = path.join('tests', 'reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save JSON report
    const jsonPath = path.join(reportsDir, 'master-qa-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.masterReport, null, 2));

    // Save Markdown report
    const markdownPath = path.join(reportsDir, 'master-qa-report.md');
    const markdownContent = this.generateMarkdownReport();
    fs.writeFileSync(markdownPath, markdownContent);

    // Save executive summary
    const summaryPath = path.join(reportsDir, 'executive-summary.md');
    const summaryContent = this.generateExecutiveSummary();
    fs.writeFileSync(summaryPath, summaryContent);

    console.log(`📄 Master reports saved to ${reportsDir}/`);
  }

  generateMarkdownReport() {
    return `# DependencyWarden QA Automation Report

## Executive Summary
- **Overall Score**: ${this.masterReport.overallScore}/100
- **Production Readiness**: ${this.masterReport.productionReadiness.status}
- **Total Tests**: ${this.masterReport.summary.totalTests}
- **Success Rate**: ${this.masterReport.summary.overallSuccessRate}
- **Execution Time**: ${this.masterReport.executionTime}
- **Generated**: ${this.masterReport.timestamp}

## Production Readiness Assessment
**Status**: ${this.masterReport.productionReadiness.status}
**Reason**: ${this.masterReport.productionReadiness.reason}
**Recommendation**: ${this.masterReport.productionReadiness.recommendation}

## Test Suite Results

### Comprehensive QA Suite
${this.formatSuiteResults('comprehensive')}

### API Test Suite
${this.formatSuiteResults('api')}

### Performance Test Suite
${this.formatSuiteResults('performance')}

### Security Test Suite
${this.formatSuiteResults('security')}

### CI/CD Integration Suite
${this.formatSuiteResults('cicd')}

## Critical Issues
${this.masterReport.criticalIssues.length === 0 ? 'No critical issues detected.' : ''}
${this.masterReport.criticalIssues.map(issue => `
### ${issue.category} - ${issue.severity}
- **Issue**: ${issue.issue}
- **Impact**: ${issue.impact}
`).join('')}

## Recommendations
${this.masterReport.recommendations.map(rec => `
### ${rec.priority} - ${rec.category}
${rec.message}
${rec.action ? `**Action**: ${rec.action}` : ''}
`).join('')}

## Detailed Results
${Object.keys(this.allResults).map(suiteKey => {
  const result = this.allResults[suiteKey];
  if (result?.error) {
    return `### ${suiteKey} Suite: ERROR\n${result.error}`;
  } else if (result?.summary) {
    return `### ${suiteKey} Suite: ${JSON.stringify(result.summary, null, 2)}`;
  }
  return '';
}).join('\n\n')}
`;
  }

  formatSuiteResults(suiteKey) {
    const result = this.allResults[suiteKey];
    if (!result) return 'No results available';
    if (result.error) return `ERROR: ${result.error}`;
    
    if (result.summary) {
      const summary = result.summary;
      return `- Tests: ${summary.total || summary.totalTests || 0}
- Passed: ${summary.passed || summary.passedTests || 0}
- Failed: ${summary.failed || summary.failedTests || 0}
- Success Rate: ${summary.successRate || summary.overallSuccessRate || 'N/A'}`;
    }
    
    return 'Results available in detailed section';
  }

  generateExecutiveSummary() {
    return `# DependencyWarden QA Executive Summary

**Date**: ${new Date().toLocaleDateString()}
**Overall Score**: ${this.masterReport.overallScore}/100
**Production Status**: ${this.masterReport.productionReadiness.status}

## Key Findings

### Test Coverage
- **Total Tests Executed**: ${this.masterReport.summary.totalTests}
- **Overall Success Rate**: ${this.masterReport.summary.overallSuccessRate}
- **Execution Time**: ${this.masterReport.executionTime}

### Quality Metrics
- **API Reliability**: ${this.allResults.api?.summary?.successRate || 'N/A'}
- **Security Score**: ${this.allResults.security?.securityScore || 'N/A'}/100
- **Performance Score**: ${this.allResults.performance?.performanceScore || 'N/A'}/100
- **Integration Health**: ${this.allResults.cicd?.summary?.successRate || 'N/A'}

### Critical Issues
${this.masterReport.criticalIssues.length === 0 ? 
  '✅ No critical issues detected' : 
  `⚠️ ${this.masterReport.criticalIssues.length} critical issues require attention`
}

### Recommendation
${this.masterReport.productionReadiness.recommendation}

## Next Steps
${this.masterReport.productionReadiness.status === 'Production Ready' ?
  '1. Proceed with deployment\n2. Monitor production metrics\n3. Maintain testing cadence' :
  '1. Address identified issues\n2. Re-run affected test suites\n3. Reassess production readiness'
}
`;
  }

  displayFinalSummary() {
    console.log('\n╭─────────────────────────────────────────────────────╮');
    console.log('│              QA AUTOMATION SUMMARY                  │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log(`│ Overall Score:        ${this.masterReport.overallScore.toString().padEnd(25)} │`);
    console.log(`│ Total Tests:          ${this.masterReport.summary.totalTests.toString().padEnd(25)} │`);
    console.log(`│ Success Rate:         ${this.masterReport.summary.overallSuccessRate.padEnd(25)} │`);
    console.log(`│ Execution Time:       ${this.masterReport.executionTime.padEnd(25)} │`);
    console.log(`│ Production Ready:     ${this.masterReport.productionReadiness.status.padEnd(25)} │`);
    console.log(`│ Critical Issues:      ${this.masterReport.criticalIssues.length.toString().padEnd(25)} │`);
    console.log('╰─────────────────────────────────────────────────────╯');

    console.log('\n🎯 Production Readiness Assessment:');
    console.log(`   Status: ${this.masterReport.productionReadiness.status}`);
    console.log(`   Reason: ${this.masterReport.productionReadiness.reason}`);
    console.log(`   Action: ${this.masterReport.productionReadiness.recommendation}`);

    if (this.masterReport.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues Requiring Attention:');
      this.masterReport.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.category}: ${issue.issue}`);
      });
    }

    console.log('\n📊 Detailed reports generated in tests/reports/');
    console.log('🎉 QA Automation Suite completed successfully!');
  }
}

// Export for use as module
export default QAAutomationRunner;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new QAAutomationRunner();
  runner.runFullQAAutomation().catch(console.error);
}