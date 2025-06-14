import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Function to update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update Button imports
  content = content.replace(
    /import\s*{\s*Button\s*}\s*from\s*["']@\/components\/ui\/button["']/g,
    'import Button from "@/components/ui/button"'
  );
  content = content.replace(
    /import\s*{\s*Button,\s*buttonVariants\s*}\s*from\s*["']@\/components\/ui\/button["']/g,
    'import Button, { buttonVariants } from "@/components/ui/button"'
  );
  
  // Update Badge imports
  content = content.replace(
    /import\s*{\s*Badge\s*}\s*from\s*["']@\/components\/ui\/badge["']/g,
    'import Badge from "@/components/ui/badge"'
  );
  content = content.replace(
    /import\s*{\s*Badge,\s*badgeVariants\s*}\s*from\s*["']@\/components\/ui\/badge["']/g,
    'import Badge, { badgeVariants } from "@/components/ui/badge"'
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

// Find all TypeScript and TypeScript React files
const files = await glob('src/**/*.{ts,tsx}');

// Update imports in each file
files.forEach(file => {
  console.log(`Updating imports in ${file}...`);
  updateImports(file);
}); 