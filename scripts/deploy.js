#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Executes a command and returns a promise
 */
function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Runs the deployment process
 */
async function deploy() {
  console.log('🚀 Starting deployment process...\n');
  
  try {
    // Step 1: Clean previous build
    console.log('📁 Cleaning previous build...');
    const distDir = path.join(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
      console.log('✅ Previous build cleaned');
    }
    
    // Step 2: Install dependencies
    console.log('\n📦 Installing dependencies...');
    await executeCommand('npm', ['ci']);
    console.log('✅ Dependencies installed');
    
    // Step 3: Run type checking
    console.log('\n🔍 Running type checking...');
    await executeCommand('npm', ['run', 'type-check']);
    console.log('✅ Type checking passed');
    
    // Step 4: Run linting
    console.log('\n🧹 Running linting...');
    await executeCommand('npm', ['run', 'lint']);
    console.log('✅ Linting passed');
    
    // Step 5: Run tests
    console.log('\n🧪 Running tests...');
    await executeCommand('npm', ['run', 'test:run']);
    console.log('✅ Tests passed');
    
    // Step 6: Build project
    console.log('\n🏗️  Building project...');
    await executeCommand('npm', ['run', 'build']);
    console.log('✅ Build completed');
    
    // Step 7: Validate build
    console.log('\n✅ Validating build...');
    await executeCommand('node', ['scripts/validate-build.js']);
    console.log('✅ Build validation passed');
    
    console.log('\n🎉 Deployment process completed successfully!');
    console.log('📁 Build output is ready in the dist/ directory');
    console.log('🚀 You can now push to trigger GitHub Actions deployment');
    
  } catch (error) {
    console.error('\n💥 Deployment process failed:', error.message);
    process.exit(1);
  }
}

/**
 * Shows deployment status and next steps
 */
function showNextSteps() {
  console.log('\n📋 Next steps:');
  console.log('1. Review the build output in the dist/ directory');
  console.log('2. Commit and push your changes to trigger GitHub Actions');
  console.log('3. Monitor the deployment at: https://github.com/soft98-top/soft98-top.github.io/actions');
  console.log('4. Once deployed, run: npm run check-deployment');
  console.log('\n🔗 Useful commands:');
  console.log('  npm run build          - Build the project');
  console.log('  npm run validate-build - Validate build output');
  console.log('  npm run check-deployment - Check live deployment');
  console.log('  npm run preview        - Preview build locally');
}

// Run deployment
deploy().then(() => {
  showNextSteps();
}).catch((error) => {
  console.error('Deployment failed:', error.message);
  process.exit(1);
});