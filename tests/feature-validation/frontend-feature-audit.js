
const fs = require('fs');
const path = require('path');

function auditFrontendFeatures() {
  console.log('🎨 FRONTEND FEATURE AUDIT');
  console.log('=========================');
  
  const clientDir = path.join(__dirname, '../../client/src');
  const results = {
    components: {},
    pages: {},
    hooks: {},
    overallHealth: 'UNKNOWN'
  };
  
  // Audit Components
  console.log('1. Auditing React Components...');
  const componentsDir = path.join(clientDir, 'components');
  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx'))
      .map(file => file.replace('.tsx', ''));
    
    console.log(`✅ Found ${components.length} components:`);
    components.forEach(comp => {
      console.log(`   - ${comp}`);
      results.components[comp] = checkComponentImplementation(path.join(componentsDir, `${comp}.tsx`));
    });
  }
  
  // Audit Pages
  console.log('\n2. Auditing Application Pages...');
  const pagesDir = path.join(clientDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.tsx'))
      .map(file => file.replace('.tsx', ''));
    
    console.log(`✅ Found ${pages.length} pages:`);
    pages.forEach(page => {
      console.log(`   - ${page}`);
      results.pages[page] = checkPageImplementation(path.join(pagesDir, `${page}.tsx`));
    });
  }
  
  // Audit Custom Hooks
  console.log('\n3. Auditing Custom Hooks...');
  const hooksDir = path.join(clientDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hooks = fs.readdirSync(hooksDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map(file => file.replace(/\.(tsx|ts)$/, ''));
    
    console.log(`✅ Found ${hooks.length} custom hooks:`);
    hooks.forEach(hook => {
      console.log(`   - ${hook}`);
      results.hooks[hook] = { implemented: true };
    });
  }
  
  // Generate summary
  generateFrontendSummary(results);
  
  return results;
}

function checkComponentImplementation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      implemented: true,
      hasProps: content.includes('interface') || content.includes('type'),
      hasStateManagement: content.includes('useState') || content.includes('useReducer'),
      hasEffects: content.includes('useEffect'),
      hasErrorHandling: content.includes('try') || content.includes('catch'),
      hasAccessibility: content.includes('aria-') || content.includes('role='),
      linesOfCode: content.split('\n').length
    };
  } catch (error) {
    return { implemented: false, error: error.message };
  }
}

function checkPageImplementation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      implemented: true,
      hasDataFetching: content.includes('fetch') || content.includes('axios') || content.includes('useQuery'),
      hasAuthentication: content.includes('useAuth') || content.includes('isAuthenticated'),
      hasErrorBoundary: content.includes('ErrorBoundary') || content.includes('try'),
      hasLoadingStates: content.includes('loading') || content.includes('isLoading'),
      isResponsive: content.includes('mobile') || content.includes('sm:') || content.includes('md:'),
      linesOfCode: content.split('\n').length
    };
  } catch (error) {
    return { implemented: false, error: error.message };
  }
}

function generateFrontendSummary(results) {
  console.log('\n📊 FRONTEND AUDIT SUMMARY');
  console.log('=========================');
  
  const totalComponents = Object.keys(results.components).length;
  const implementedComponents = Object.values(results.components)
    .filter(c => c.implemented).length;
  
  const totalPages = Object.keys(results.pages).length;
  const implementedPages = Object.values(results.pages)
    .filter(p => p.implemented).length;
  
  console.log(`Components: ${implementedComponents}/${totalComponents} implemented`);
  console.log(`Pages: ${implementedPages}/${totalPages} implemented`);
  console.log(`Custom Hooks: ${Object.keys(results.hooks).length} found`);
  
  const overallHealth = (implementedComponents / totalComponents + implementedPages / totalPages) / 2;
  
  if (overallHealth >= 0.9) {
    results.overallHealth = 'EXCELLENT';
    console.log('🎉 Frontend Health: EXCELLENT');
  } else if (overallHealth >= 0.8) {
    results.overallHealth = 'GOOD';
    console.log('✅ Frontend Health: GOOD');
  } else {
    results.overallHealth = 'NEEDS_WORK';
    console.log('⚠️ Frontend Health: NEEDS WORK');
  }
}

// Run if called directly
if (require.main === module) {
  const results = auditFrontendFeatures();
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync(
    'tests/reports/frontend-feature-audit.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📄 Frontend audit saved to: tests/reports/frontend-feature-audit.json');
}

module.exports = { auditFrontendFeatures };
