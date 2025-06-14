const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive fix for import/export errors...\n');

// Fix 1: Update Badge component to export both named and default
console.log('1. Fixing Badge component exports...');
const badgePath = './src/components/ui/badge.tsx';
let badgeContent = fs.readFileSync(badgePath, 'utf8');

// Replace the export section with both named and default exports
const newBadgeExports = `
// Export both named and default for compatibility
export { Badge };
export default Badge;
export { badgeVariants };
`;

// Find and replace the existing export section
badgeContent = badgeContent.replace(
  /\/\/ Export.*[\s\S]*$/,
  newBadgeExports.trim()
);

fs.writeFileSync(badgePath, badgeContent);
console.log('✅ Updated Badge component with named export');

// Fix 2: Update tsconfig.json with @shared alias
console.log('\n2. Updating TypeScript configuration...');
const tsconfigPath = './tsconfig.json';
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

tsconfig.compilerOptions.paths = {
  "@/*": ["./src/*"],
  "@shared/*": ["./shared/*"]
};

if (!tsconfig.include.includes("shared")) {
  tsconfig.include = ["src", "shared"];
}

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('✅ Updated tsconfig.json with @shared alias');

// Fix 3: Update vite.config.ts with @shared alias
console.log('\n3. Updating Vite configuration...');
const viteConfigPath = './vite.config.ts';
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

if (!viteConfig.includes('@shared')) {
  viteConfig = viteConfig.replace(
    /alias: \{[\s\S]*?\}/,
    `alias: {
      "@": path.resolve(__dirname, './src'),
      "@shared": path.resolve(__dirname, './shared'),
    }`
  );
  
  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log('✅ Updated vite.config.ts with @shared alias');
}

// Fix 4: Install vite-tsconfig-paths if not already installed
console.log('\n4. Checking for vite-tsconfig-paths...');
const packageJsonPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.devDependencies['vite-tsconfig-paths']) {
  console.log('📦 Installing vite-tsconfig-paths...');
  const { exec } = require('child_process');
  exec('npm install --save-dev vite-tsconfig-paths', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️  Please manually install: npm install --save-dev vite-tsconfig-paths');
    } else {
      console.log('✅ Installed vite-tsconfig-paths');
    }
  });
} else {
  console.log('✅ vite-tsconfig-paths already installed');
}

console.log('\n🎉 Comprehensive fix complete!');
console.log('📌 Please restart your dev server: npm run dev');
console.log('🔧 Your Badge imports and @shared schema imports should now work!'); 