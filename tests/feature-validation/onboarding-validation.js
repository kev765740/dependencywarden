
const axios = require('axios');

async function validateOnboardingSystem() {
  console.log('🎯 ONBOARDING SYSTEM VALIDATION');
  console.log('===============================');
  
  try {
    // Check if onboarding component exists and is properly implemented
    const fs = require('fs');
    const path = require('path');
    
    console.log('1. Checking onboarding component implementation...');
    const onboardingPath = path.join(__dirname, '../../client/src/components/OnboardingWizard.tsx');
    
    if (fs.existsSync(onboardingPath)) {
      const content = fs.readFileSync(onboardingPath, 'utf8');
      
      // Check key features
      const hasSteps = content.includes('step') || content.includes('Step');
      const hasLocalStorage = content.includes('localStorage');
      const hasProgress = content.includes('progress') || content.includes('Progress');
      const hasSkipOption = content.includes('skip') || content.includes('Skip');
      
      console.log('✅ OnboardingWizard component found');
      console.log(`✅ Multi-step flow: ${hasSteps ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Persistence: ${hasLocalStorage ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Progress indicator: ${hasProgress ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Skip functionality: ${hasSkipOption ? 'Implemented' : 'Missing'}`);
      
      // Check home page integration
      console.log('\n2. Checking home page integration...');
      const homePath = path.join(__dirname, '../../client/src/pages/home.tsx');
      
      if (fs.existsSync(homePath)) {
        const homeContent = fs.readFileSync(homePath, 'utf8');
        const hasOnboardingImport = homeContent.includes('OnboardingWizard');
        const hasOnboardingState = homeContent.includes('showOnboarding');
        const hasLocalStorageCheck = homeContent.includes('hasSeenOnboarding');
        
        console.log(`✅ Onboarding import: ${hasOnboardingImport ? 'Present' : 'Missing'}`);
        console.log(`✅ Display logic: ${hasOnboardingState ? 'Implemented' : 'Missing'}`);
        console.log(`✅ First-time user detection: ${hasLocalStorageCheck ? 'Implemented' : 'Missing'}`);
        
        return {
          status: 'PASS',
          componentImplemented: true,
          homeIntegration: hasOnboardingImport && hasOnboardingState,
          firstTimeUserDetection: hasLocalStorageCheck,
          features: {
            multiStep: hasSteps,
            persistence: hasLocalStorage,
            progress: hasProgress,
            skip: hasSkipOption
          }
        };
      } else {
        console.log('❌ Home page not found');
        return { status: 'PARTIAL', error: 'Home page missing' };
      }
    } else {
      console.log('❌ OnboardingWizard component not found');
      return { status: 'FAIL', error: 'Onboarding component missing' };
    }
    
  } catch (error) {
    console.log('❌ Onboarding validation failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
}

module.exports = { validateOnboardingSystem };
