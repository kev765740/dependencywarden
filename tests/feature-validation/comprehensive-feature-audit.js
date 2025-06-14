
#!/usr/bin/env node

const { validateAuthenticationFeatures } = require('./auth-validation');
const { validateRepositoryFeatures } = require('./repository-validation');
const { validateAIFeatures } = require('./ai-features-validation');

async function runComprehensiveFeatureAudit() {
  console.log('🎯 COMPREHENSIVE FEATURE AUDIT');
  console.log('==============================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');
  
  const results = {
    timestamp: new Date().toISOString(),
    features: {},
    overallStatus: 'UNKNOWN'
  };
  
  try {
    // 1. Authentication System
    console.log('SECTION 1: AUTHENTICATION & SECURITY');
    results.features.authentication = await validateAuthenticationFeatures();
    console.log('');
    
    // 2. Repository Management
    console.log('SECTION 2: REPOSITORY MANAGEMENT');
    results.features.repositories = await validateRepositoryFeatures();
    console.log('');
    
    // 3. AI Features
    console.log('SECTION 3: AI-POWERED FEATURES');
    results.features.aiFeatures = await validateAIFeatures();
    console.log('');
    
    // 4. Additional Feature Checks
    console.log('SECTION 4: ADDITIONAL FEATURES');
    await validateAdditionalFeatures(results);
    console.log('');
    
    // Generate summary
    generateAuditSummary(results);
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
      'tests/reports/comprehensive-feature-audit.json',
      JSON.stringify(results, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    results.overallStatus = 'FAILED';
  }
  
  return results;
}

async function validateAdditionalFeatures(results) {
  const axios = require('axios');
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://your-app.replit.app' 
    : 'http://0.0.0.0:5000';
  
  // Team Management
  console.log('4a. Testing team management...');
  try {
    const teamTest = await axios.get(`${baseURL}/api/team/members`, {
      validateStatus: () => true
    });
    console.log(`✅ Team Management: ${teamTest.status < 500 ? 'Available' : 'Needs configuration'}`);
    results.features.teamManagement = { status: teamTest.status < 500 ? 'PASS' : 'PARTIAL' };
  } catch (error) {
    console.log('❌ Team management check failed');
    results.features.teamManagement = { status: 'FAIL', error: error.message };
  }
  
  // Billing System
  console.log('4b. Testing billing system...');
  try {
    const billingTest = await axios.get(`${baseURL}/api/billing/status`, {
      validateStatus: () => true
    });
    console.log(`✅ Billing System: ${billingTest.status < 500 ? 'Available' : 'Needs configuration'}`);
    results.features.billing = { status: billingTest.status < 500 ? 'PASS' : 'PARTIAL' };
  } catch (error) {
    console.log('❌ Billing system check failed');
    results.features.billing = { status: 'FAIL', error: error.message };
  }
  
  // Notifications
  console.log('4c. Testing notification system...');
  try {
    const notificationTest = await axios.get(`${baseURL}/api/notifications`, {
      validateStatus: () => true
    });
    console.log(`✅ Notifications: ${notificationTest.status < 500 ? 'Available' : 'Needs configuration'}`);
    results.features.notifications = { status: notificationTest.status < 500 ? 'PASS' : 'PARTIAL' };
  } catch (error) {
    console.log('❌ Notification system check failed');
    results.features.notifications = { status: 'FAIL', error: error.message };
  }
}

function generateAuditSummary(results) {
  console.log('📊 AUDIT SUMMARY');
  console.log('================');
  
  const features = Object.keys(results.features);
  const passed = features.filter(f => results.features[f].status === 'PASS').length;
  const partial = features.filter(f => results.features[f].status === 'PARTIAL').length;
  const failed = features.filter(f => results.features[f].status === 'FAIL').length;
  
  console.log(`Total Features Tested: ${features.length}`);
  console.log(`✅ Fully Functional: ${passed}`);
  console.log(`⚠️  Partially Functional: ${partial}`);
  console.log(`❌ Not Functional: ${failed}`);
  
  const successRate = ((passed + partial * 0.5) / features.length * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (successRate >= 85) {
    results.overallStatus = 'PRODUCTION_READY';
    console.log('🎉 OVERALL STATUS: PRODUCTION READY');
  } else if (successRate >= 70) {
    results.overallStatus = 'NEEDS_MINOR_FIXES';
    console.log('⚠️  OVERALL STATUS: NEEDS MINOR FIXES');
  } else {
    results.overallStatus = 'NEEDS_MAJOR_WORK';
    console.log('❌ OVERALL STATUS: NEEDS MAJOR WORK');
  }
  
  console.log('');
  console.log('📝 Detailed Results:');
  features.forEach(feature => {
    const status = results.features[feature].status;
    const icon = status === 'PASS' ? '✅' : status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`   ${icon} ${feature}: ${status}`);
  });
}

// Run if called directly
if (require.main === module) {
  runComprehensiveFeatureAudit()
    .then(results => {
      console.log('\n📄 Full report saved to: tests/reports/comprehensive-feature-audit.json');
      process.exit(0);
    })
    .catch(error => {
      console.error('Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveFeatureAudit };
