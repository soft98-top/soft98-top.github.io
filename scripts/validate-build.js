#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const REQUIRED_FILES = [
  'index.html',
  'assets'
];

const REQUIRED_ASSETS = [
  'main.js',
  'main.css'
];

/**
 * Validates that the build output contains all required files
 */
function validateBuildOutput() {
  console.log('🔍 Validating build output...');
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory does not exist:', DIST_DIR);
    process.exit(1);
  }

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Required file missing: ${file}`);
      process.exit(1);
    }
    console.log(`✅ Found: ${file}`);
  }

  // Check assets directory
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    
    // Check for main JS and CSS files (they might have hash suffixes)
    const hasJS = assetFiles.some(file => file.endsWith('.js'));
    const hasCSS = assetFiles.some(file => file.endsWith('.css'));
    
    if (!hasJS) {
      console.error('❌ JavaScript file not found in assets');
      process.exit(1);
    }
    
    if (!hasCSS) {
      console.error('❌ CSS file not found in assets');
      process.exit(1);
    }
    
    console.log('✅ Found JavaScript and CSS files');
  }

  console.log('✅ Build validation passed!');
}

/**
 * Validates the content of index.html
 */
function validateIndexHtml() {
  console.log('🔍 Validating index.html content...');
  
  const indexPath = path.join(DIST_DIR, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check for essential HTML structure
  const checks = [
    { pattern: /<title>.*<\/title>/, name: 'title tag' },
    { pattern: /<meta.*viewport.*>/, name: 'viewport meta tag' },
    { pattern: /<div.*class="app-grid".*>/, name: 'app-grid container' },
    { pattern: /<script.*src=.*>/, name: 'script tag' },
    { pattern: /<link.*rel="stylesheet".*>/, name: 'stylesheet link' }
  ];
  
  for (const check of checks) {
    if (!check.pattern.test(content)) {
      console.error(`❌ Missing or invalid: ${check.name}`);
      process.exit(1);
    }
    console.log(`✅ Found: ${check.name}`);
  }
  
  console.log('✅ index.html validation passed!');
}

/**
 * Validates apps.json configuration
 */
function validateAppsConfig() {
  console.log('🔍 Validating apps.json configuration...');
  
  const appsConfigPath = path.join(DIST_DIR, 'apps.json');
  
  if (!fs.existsSync(appsConfigPath)) {
    console.error('❌ apps.json not found in build output');
    process.exit(1);
  }
  
  try {
    const configContent = fs.readFileSync(appsConfigPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    if (!config.apps || !Array.isArray(config.apps)) {
      console.error('❌ Invalid apps.json structure: missing apps array');
      process.exit(1);
    }
    
    // Validate each app entry
    for (const app of config.apps) {
      const requiredFields = ['id', 'name', 'description', 'url'];
      for (const field of requiredFields) {
        if (!app[field]) {
          console.error(`❌ App missing required field: ${field}`);
          process.exit(1);
        }
      }
    }
    
    console.log(`✅ Found ${config.apps.length} valid app(s) in configuration`);
    
  } catch (error) {
    console.error('❌ Invalid JSON in apps.json:', error.message);
    process.exit(1);
  }
  
  console.log('✅ apps.json validation passed!');
}

/**
 * Main validation function
 */
function main() {
  console.log('🚀 Starting build validation...\n');
  
  try {
    validateBuildOutput();
    validateIndexHtml();
    validateAppsConfig();
    
    console.log('\n🎉 All validations passed! Build is ready for deployment.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    process.exit(1);
  }
}

main();