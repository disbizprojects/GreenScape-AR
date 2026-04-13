#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * 
 * Run this before deploying to catch common issues:
 * npx node scripts/pre-deploy-check.js
 * 
 * Checks:
 * - TypeScript compilation
 * - Required environment variables
 * - Security issues (exposed secrets)
 * - Build success
 * - No hardcoded URLs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

let passed = 0;
let failed = 0;

// 1. Check for .env.local existence and non-dev values
console.log('\n📋 Checking environment files...\n');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const securityIssues = [
    { pattern: /localhost|127\.0\.0\.1/, name: 'localhost URL' },
    { pattern: /192\.168\.|10\.0\./, name: 'private IP address' },
    { pattern: /dev-secret/, name: 'dev-secret placeholder' },
    { pattern: /test123|demo123/, name: 'weak password' },
  ];
  
  let hasSecurityIssues = false;
  securityIssues.forEach(({ pattern, name }) => {
    if (pattern.test(envContent)) {
      log.warn(`Found ${name} in .env.local - this is OK for development`);
      hasSecurityIssues = true;
    }
  });
  
  if (!hasSecurityIssues) {
    log.info('.env.local exists (or appears to be production-ready)');
  }
} else {
  log.warn('.env.local not found - will use system environment variables');
}

// 2. Check required environment variables
console.log('\n🔐 Checking required environment variables...\n');

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_EMAIL',
  'SEED_SECRET',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length === 0) {
  log.success('All required environment variables are set');
  passed++;
} else {
  log.error(`Missing ${missingVars.length} environment variables:`);
  missingVars.forEach((v) => console.log(`  - ${v}`));
  failed++;
}

// 3. Check for hardcoded URLs in source
console.log('\n🔗 Checking for hardcoded URLs in source code...\n');

const srcPath = path.join(process.cwd(), 'src');
const ignoreDirs = ['node_modules', '.next', '.git', 'out'];
let urlIssues = 0;

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        searchFiles(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const patterns = [
        { pattern: /fetch\(['"]http:\/\/localhost/, type: 'localhost' },
        { pattern: /fetch\(['"]http:\/\/192\.168\./, type: 'private IP' },
        { pattern: /href=['"]http:\/\/localhost/, type: 'localhost link' },
      ];
      
      patterns.forEach(({ pattern, type }) => {
        if (pattern.test(content)) {
          log.error(`Found hardcoded ${type} in ${fullPath}`);
          urlIssues++;
        }
      });
    }
  });
}

searchFiles(srcPath);

if (urlIssues === 0) {
  log.success('No hardcoded localhost or private IPs found');
  passed++;
} else {
  log.warn(`Found ${urlIssues} potential hardcoded URL issues`);
  failed++;
}

// 4. Check TypeScript compilation
console.log('\n📦 Checking TypeScript compilation...\n');

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log.success('TypeScript compilation passed');
  passed++;
} catch (error) {
  log.error('TypeScript compilation failed:');
  console.error(error.message);
  failed++;
}

// 5. Check Next.js build
console.log('\n🔨 Checking Next.js build...\n');

try {
  execSync('npm run build', { stdio: 'pipe' });
  log.success('Next.js build passed');
  passed++;
} catch (error) {
  log.error('Next.js build failed:');
  console.error(error.message);
  failed++;
}

// 6. Check for common issues in .env.example
console.log('\n📄 Checking .env.example...\n');

const examplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(examplePath)) {
  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  
  const exposedSecrets = [
    'mongodb+srv://test1:test1@',
    'sk_test_4eC39HqLyjWDarftYKXSx',
    'pk_test_51',
    'admin@greenscape.local',
  ];
  
  let hasExposedSecrets = false;
  exposedSecrets.forEach((secret) => {
    if (exampleContent.includes(secret)) {
      log.warn(`Found potential exposed test credential in .env.example: ${secret.substring(0, 20)}...`);
      hasExposedSecrets = true;
    }
  });
  
  if (!hasExposedSecrets) {
    log.success('.env.example has no exposed credentials');
    passed++;
  } else {
    failed++;
  }
} else {
  log.error('.env.example not found');
  failed++;
}

// 7. Check .gitignore includes .env.local
console.log('\n🔒 Checking security configuration...\n');

const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

if (gitignoreContent.includes('.env')) {
  log.success('.gitignore properly ignores .env files');
  passed++;
} else {
  log.error('.gitignore does not ignore .env files - SECRET RISK!');
  failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
if (failed > 0) {
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
}
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  console.log(`${colors.yellow}⚠ Fix the above issues before deploying${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.green}✓ Ready for deployment!${colors.reset}`);
  process.exit(0);
}
