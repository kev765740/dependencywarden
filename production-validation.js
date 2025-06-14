
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.issues = [];
    this.resolved = [];
    this.partially = [];
  }

  async validateSecurity() {
    console.log('🔒 Validating Security Implementation...');
    
    // Check secure storage implementation
    const secureStoragePath = 'client/src/lib/secureStorage.ts';
    if (fs.existsSync(secureStoragePath)) {
      const content = fs.readFileSync(secureStoragePath, 'utf8');
      if (content.includes('localStorage') && !content.includes('httpOnly')) {
        this.issues.push('❌ localStorage still used for sensitive data');
      } else {
        this.resolved.push('✅ Secure storage implemented');
      }
    }

    // Check CSRF protection
    const queryClientPath = 'client/src/lib/queryClient.ts';
    if (fs.existsSync(queryClientPath)) {
      const content = fs.readFileSync(queryClientPath, 'utf8');
      if (content.includes('X-CSRF-Token')) {
        this.resolved.push('✅ CSRF protection implemented');
      } else {
        this.issues.push('❌ CSRF protection missing');
      }
    }

    // Check input sanitization
    const sanitizationPath = 'client/src/lib/inputSanitization.ts';
    if (fs.existsSync(sanitizationPath)) {
      const content = fs.readFileSync(sanitizationPath, 'utf8');
      if (content.includes('DOMPurify')) {
        this.resolved.push('✅ Input sanitization with DOMPurify implemented');
      } else {
        this.issues.push('❌ DOMPurify sanitization missing');
      }
    }
  }

  async validateErrorHandling() {
    console.log('🛡️ Validating Error Handling...');
    
    // Check error boundary implementation
    const errorBoundaryPath = 'client/src/components/ComponentErrorBoundary.tsx';
    if (fs.existsSync(errorBoundaryPath)) {
      this.resolved.push('✅ Component error boundaries implemented');
    } else {
      this.issues.push('❌ Component error boundaries missing');
    }

    // Check retry logic
    const retryLogicPath = 'client/src/lib/retryLogic.ts';
    if (fs.existsSync(retryLogicPath)) {
      const content = fs.readFileSync(retryLogicPath, 'utf8');
      if (content.includes('exponential backoff')) {
        this.resolved.push('✅ Retry logic with exponential backoff implemented');
      } else {
        this.partially.push('⚠️ Retry logic exists but may need exponential backoff');
      }
    }
  }

  async validateAccessibility() {
    console.log('♿ Validating Accessibility...');
    
    // Check for ARIA labels in components
    const componentsDir = 'client/src/components';
    let ariaLabelsFound = 0;
    let totalComponents = 0;

    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir);
      totalComponents = components.filter(f => f.endsWith('.tsx')).length;
      
      components.forEach(component => {
        if (component.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(componentsDir, component), 'utf8');
          if (content.includes('aria-label') || content.includes('aria-labelledby')) {
            ariaLabelsFound++;
          }
        }
      });
    }

    if (ariaLabelsFound > totalComponents * 0.8) {
      this.resolved.push('✅ ARIA labels implemented in most components');
    } else {
      this.issues.push(`❌ ARIA labels missing in ${totalComponents - ariaLabelsFound} components`);
    }

    // Check accessibility enhancement file
    const a11yPath = 'client/src/lib/accessibilityEnhancement.ts';
    if (fs.existsSync(a11yPath)) {
      this.resolved.push('✅ Accessibility enhancement utilities implemented');
    } else {
      this.issues.push('❌ Accessibility enhancement utilities missing');
    }
  }

  async validateTypeScript() {
    console.log('📝 Validating TypeScript...');
    
    // Check for any types
    const srcDir = 'client/src';
    let anyTypesFound = 0;
    
    const checkAnyTypes = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          checkAnyTypes(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const anyMatches = content.match(/:\s*any\b/g);
          if (anyMatches) {
            anyTypesFound += anyMatches.length;
          }
        }
      });
    };

    if (fs.existsSync(srcDir)) {
      checkAnyTypes(srcDir);
    }

    if (anyTypesFound === 0) {
      this.resolved.push('✅ No "any" types found - strict typing maintained');
    } else {
      this.issues.push(`❌ ${anyTypesFound} "any" types found - need proper typing`);
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating Performance...');
    
    // Check lazy loading in App.tsx
    const appPath = 'client/src/App.tsx';
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      if (content.includes('React.lazy') && content.includes('Suspense')) {
        this.resolved.push('✅ Lazy loading implemented for routes');
      } else {
        this.issues.push('❌ Lazy loading not implemented for routes');
      }
    }

    // Check for React.memo usage
    const pagesDir = 'client/src/pages';
    let memoizedComponents = 0;
    let totalPages = 0;

    if (fs.existsSync(pagesDir)) {
      const pages = fs.readdirSync(pagesDir);
      totalPages = pages.filter(f => f.endsWith('.tsx')).length;
      
      pages.forEach(page => {
        if (page.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(pagesDir, page), 'utf8');
          if (content.includes('React.memo') || content.includes('useMemo') || content.includes('useCallback')) {
            memoizedComponents++;
          }
        }
      });
    }

    if (memoizedComponents > totalPages * 0.5) {
      this.resolved.push('✅ Performance optimizations (memo/useMemo/useCallback) implemented');
    } else {
      this.partially.push('⚠️ Some performance optimizations implemented, could be improved');
    }
  }

  async runBuildTest() {
    console.log('🔨 Running Build Test...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe'
      });

      let output = '';
      let hasError = false;

      buildProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        output += data.toString();
        hasError = true;
      });

      buildProcess.on('close', (code) => {
        if (code === 0 && !hasError) {
          this.resolved.push('✅ Build succeeds without TypeScript errors');
        } else {
          this.issues.push('❌ Build fails with TypeScript errors');
          console.log('Build output:', output);
        }
        resolve();
      });
    });
  }

  generateReport() {
    console.log('\n📋 PRODUCTION READINESS REPORT');
    console.log('=====================================');
    
    console.log('\n✅ RESOLVED ISSUES:');
    this.resolved.forEach(item => console.log(item));
    
    console.log('\n⚠️ PARTIALLY RESOLVED:');
    this.partially.forEach(item => console.log(item));
    
    console.log('\n❌ CRITICAL ISSUES:');
    this.issues.forEach(item => console.log(item));
    
    const totalIssues = this.issues.length;
    const totalResolved = this.resolved.length;
    const totalPartial = this.partially.length;
    const total = totalIssues + totalResolved + totalPartial;
    
    const completionRate = total > 0 ? Math.round((totalResolved / total) * 100) : 0;
    
    console.log('\n📊 COMPLETION SUMMARY:');
    console.log(`✅ Resolved: ${totalResolved}`);
    console.log(`⚠️ Partial: ${totalPartial}`);
    console.log(`❌ Issues: ${totalIssues}`);
    console.log(`📈 Completion Rate: ${completionRate}%`);
    
    console.log('\n🚀 RECOMMENDATION:');
    if (totalIssues === 0 && completionRate >= 90) {
      console.log('✅ READY TO DEPLOY - All critical issues resolved');
    } else if (totalIssues <= 2 && completionRate >= 80) {
      console.log('⚠️ DEPLOY WITH CAUTION - Minor issues remain');
    } else {
      console.log('❌ DO NOT DEPLOY - Critical issues must be resolved');
    }
    
    return {
      resolved: totalResolved,
      issues: totalIssues,
      partial: totalPartial,
      completionRate,
      readyToDeploy: totalIssues === 0 && completionRate >= 90
    };
  }

  async runFullValidation() {
    console.log('🧭 Starting Production Validation...\n');
    
    await this.validateSecurity();
    await this.validateErrorHandling();
    await this.validateAccessibility();
    await this.validateTypeScript();
    await this.validatePerformance();
    await this.runBuildTest();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.runFullValidation().then(result => {
    process.exit(result.readyToDeploy ? 0 : 1);
  });
}

module.exports = ProductionValidator;
