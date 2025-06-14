const fs = require('fs');
const path = require('path');

// Update tsconfig.json
const tsconfigPath = './tsconfig.json';
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

tsconfig.compilerOptions.paths = {
  "@/*": ["./src/*"],
  "@shared/*": ["./shared/*"]
};

tsconfig.include = ["src", "shared"];

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('✅ Updated tsconfig.json with @shared alias');

// Update vite.config.ts
const viteConfigPath = './vite.config.ts';
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Check if @shared alias already exists
if (!viteConfig.includes('@shared')) {
  // Add @shared alias to existing alias object
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

console.log('🎉 Path alias configuration complete!');
console.log('📌 Now restart your dev server: npm run dev'); 