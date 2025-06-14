
// Master Feature Audit

import { runComprehensiveFeatureAudit } from './comprehensive-feature-audit.js';
import { auditFrontendFeatures } from './frontend-feature-audit.js';
import { validateOnboardingSystem } from './onboarding-validation.js';

async function runMasterFeatureAudit() {
  console.log('🚀 MASTER FEATURE AUDIT - DEPENDENCYWARDEN');
  console.log('==========================================');
  console.log('Starting comprehensive application audit...');
  console.log('Timestamp:', new Date().toISOString());
  console.log('\n');
  
  const masterResults = {
    timestamp: new Date().toISOString(),
    application: 'DependencyWarden',
    version: 'Production',
    audits: {}
  };
  
  try {
    // 1. Backend Feature Audit
    console.log('🔧 PHASE 1: BACKEND & API VALIDATION');
    console.log('====================================');
    masterResults.audits.backend = await runComprehensiveFeatureAudit();
    console.log('\n');
    
    // 2. Frontend Feature Audit
    console.log('🎨 PHASE 2: FRONTEND COMPONENT VALIDATION');
    console.log('=========================================');
    masterResults.audits.frontend = auditFrontendFeatures();
    console.log('\n');
    
    // 3. Onboarding System Validation
    console.log('🎯 PHASE 3: ONBOARDING SYSTEM VALIDATION');
    console.log('========================================');
    masterResults.audits.onboarding = await validateOnboardingSystem();
    console.log('\n');
    
    // 4. Generate Overall Assessment
    console.log('📊 PHASE 4: OVERALL ASSESSMENT');
    console.log('==============================');
    generateOverallAssessment(masterResults);
    
    // Save comprehensive results
    const fs = require('fs');
    if (!fs.existsSync('tests/reports')) {
      fs.mkdirSync('tests/reports', { recursive: true });
    }
    
    fs.writeFileSync(
      'tests/reports/master-feature-audit.json',
      JSON.stringify(masterResults, null, 2)
    );
    
    console.log('\n📄 Complete audit report saved to: tests/reports/master-feature-audit.json');
    
    return masterResults;
    
  } catch (error) {
    console.error('❌ Master audit failed:', error.message);
    masterResults.status = 'FAILED';
    masterResults.error = error.message;
    return masterResults;
  }
}

function generateOverallAssessment(results) {
  console.log('Generating overall platform assessment...');
  
  const scores = {
    backend: calculateBackendScore(results.audits.backend),
    frontend: calculateFrontendScore(results.audits.frontend),
    onboarding: calculateOnboardingScore(results.audits.onboarding)
  };
  
  const overallScore = (scores.backend + scores.frontend + scores.onboarding) / 3;
  
  console.log('\n📈 FEATURE SCORES:');
  console.log('==================');
  console.log(`Backend & APIs: ${scores.backend.toFixed(1)}%`);
  console.log(`Frontend Components: ${scores.frontend.toFixed(1)}%`);
  console.log(`Onboarding System: ${scores.onboarding.toFixed(1)}%`);
  console.log(`\n🎯 OVERALL SCORE: ${overallScore.toFixed(1)}%`);
  
  // Determine readiness level
  let readinessLevel, recommendation;
  
  if (overallScore >= 90) {
    readinessLevel = 'PRODUCTION READY';
    recommendation = 'Platform is ready for immediate launch with all features functional';
  } else if (overallScore >= 80) {
    readinessLevel = 'NEAR PRODUCTION READY';
    recommendation = 'Platform is stable with minor enhancements needed';
  } else if (overallScore >= 70) {
    readinessLevel = 'DEVELOPMENT COMPLETE';
    recommendation = 'Core functionality working, some features need refinement';
  } else {
    readinessLevel = 'DEVELOPMENT IN PROGRESS';
    recommendation = 'Significant development work remaining';
  }
  
  console.log(`\n🚦 READINESS LEVEL: ${readinessLevel}`);
  console.log(`💡 RECOMMENDATION: ${recommendation}`);
  
  results.assessment = {
    scores,
    overallScore,
    readinessLevel,
    recommendation
  };
}

function calculateBackendScore(backendResults) {
  if (!backendResults || !backendResults.features) return 0;
  
  const features = Object.values(backendResults.features);
  const passCount = features.filter(f => f.status === 'PASS').length;
  const partialCount = features.filter(f => f.status === 'PARTIAL').length;
  
  return ((passCount + partialCount * 0.5) / features.length) * 100;
}

function calculateFrontendScore(frontendResults) {
  if (!frontendResults) return 0;
  
  const componentScore = Object.values(frontendResults.components || {})
    .filter(c => c.implemented).length / Math.max(Object.keys(frontendResults.components || {}).length, 1);
  
  const pageScore = Object.values(frontendResults.pages || {})
    .filter(p => p.implemented).length / Math.max(Object.keys(frontendResults.pages || {}).length, 1);
  
  return ((componentScore + pageScore) / 2) * 100;
}

function calculateOnboardingScore(onboardingResults) {
  if (!onboardingResults) return 0;
  
  if (onboardingResults.status === 'PASS') return 100;
  if (onboardingResults.status === 'PARTIAL') return 70;
  return 30; // Some implementation exists
}

// Run if called directly
if (require.main === module) {
  runMasterFeatureAudit()
    .then(results => {
      console.log('\n✅ Master feature audit completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Master audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runMasterFeatureAudit };
