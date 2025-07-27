#!/usr/bin/env node

import https from 'https';
import { URL } from 'url';

const SITE_URL = 'https://soft98-top.github.io';
const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Makes an HTTP request and returns a promise
 */
function makeRequest(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Deployment-Checker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Checks if the site is accessible and returns expected content
 */
async function checkSiteAccessibility(retryCount = 0) {
  console.log(`🔍 Checking site accessibility (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
  
  try {
    const response = await makeRequest(SITE_URL);
    
    if (response.statusCode === 200) {
      console.log('✅ Site is accessible (HTTP 200)');
      return response;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Site check failed: ${error.message}`);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkSiteAccessibility(retryCount + 1);
    } else {
      throw new Error(`Site accessibility check failed after ${MAX_RETRIES} attempts: ${error.message}`);
    }
  }
}

/**
 * Validates the content of the deployed site
 */
function validateSiteContent(response) {
  console.log('🔍 Validating site content...');
  
  const content = response.body;
  
  // Check for essential content
  const checks = [
    { pattern: /<title>.*Soft98.*<\/title>/i, name: 'site title' },
    { pattern: /<h1>.*Soft98.*<\/h1>/i, name: 'main heading' },
    { pattern: /class="app-grid"/, name: 'app grid container' },
    { pattern: /<script.*src=.*assets.*\.js.*>/, name: 'JavaScript assets' },
    { pattern: /<link.*href=.*assets.*\.css.*>/, name: 'CSS assets' }
  ];
  
  const results = [];
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      console.log(`✅ Found: ${check.name}`);
      results.push({ name: check.name, passed: true });
    } else {
      console.log(`❌ Missing: ${check.name}`);
      results.push({ name: check.name, passed: false });
    }
  }
  
  const failedChecks = results.filter(r => !r.passed);
  
  if (failedChecks.length > 0) {
    throw new Error(`Content validation failed: ${failedChecks.map(c => c.name).join(', ')}`);
  }
  
  console.log('✅ Site content validation passed!');
}

/**
 * Checks if assets are loading correctly
 */
async function checkAssets(response) {
  console.log('🔍 Checking asset availability...');
  
  const content = response.body;
  
  // Extract asset URLs from HTML
  const jsMatch = content.match(/<script.*src="([^"]*\.js[^"]*)".*>/);
  const cssMatch = content.match(/<link.*href="([^"]*\.css[^"]*)".*>/);
  
  const assetsToCheck = [];
  
  if (jsMatch) {
    const jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `${SITE_URL}/${jsMatch[1]}`;
    assetsToCheck.push({ type: 'JavaScript', url: jsUrl });
  }
  
  if (cssMatch) {
    const cssUrl = cssMatch[1].startsWith('http') ? cssMatch[1] : `${SITE_URL}/${cssMatch[1]}`;
    assetsToCheck.push({ type: 'CSS', url: cssUrl });
  }
  
  // Check each asset
  for (const asset of assetsToCheck) {
    try {
      const assetResponse = await makeRequest(asset.url);
      if (assetResponse.statusCode === 200) {
        console.log(`✅ ${asset.type} asset loaded successfully`);
      } else {
        throw new Error(`HTTP ${assetResponse.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${asset.type} asset failed to load: ${error.message}`);
      throw new Error(`Asset check failed for ${asset.type}: ${error.message}`);
    }
  }
  
  console.log('✅ All assets are loading correctly!');
}

/**
 * Main deployment check function
 */
async function main() {
  console.log('🚀 Starting deployment verification...\n');
  
  try {
    // Check site accessibility
    const response = await checkSiteAccessibility();
    
    // Validate content
    validateSiteContent(response);
    
    // Check assets
    await checkAssets(response);
    
    console.log('\n🎉 Deployment verification completed successfully!');
    console.log(`🌐 Site is live at: ${SITE_URL}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Deployment verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}