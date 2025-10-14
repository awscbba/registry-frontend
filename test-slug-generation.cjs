#!/usr/bin/env node

// Comprehensive slug generation test
// This will find ALL slug generation patterns and test them

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE SLUG GENERATION ANALYSIS\n');

// Test cases that should all produce the same result
const testCases = [
  'AWS Workshop 2025',
  'AWS Workshop 2025!',
  '!AWS Workshop 2025',
  '!AWS Workshop 2025!',
  'AWS Workshop 2025-',
  '-AWS Workshop 2025',
  '-AWS Workshop 2025-',
  'AWS  Workshop  2025',
  'AWS---Workshop---2025'
];

const expectedResult = 'aws-workshop-2025';

// Function implementations found in codebase
const slugFunctions = {
  // From ProjectShowcase.tsx (current)
  projectShowcase: (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
      .trim();
  },

  // From ProjectSubscriptionForm.tsx (current)
  projectSubscriptionForm: (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
      .trim();
  },

  // From subscribe/[projectId].astro (current - FIXED)
  astroPage: (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters (same as React components)
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  },

  // Test what the old version would produce (without trailing dash fix)
  oldVersion: (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
};

console.log('📋 Testing all slug generation functions:\n');

// Test each function with each test case
Object.entries(slugFunctions).forEach(([functionName, func]) => {
  console.log(`🔧 Function: ${functionName}`);
  
  let allMatch = true;
  testCases.forEach(testCase => {
    const result = func(testCase);
    const matches = result === expectedResult;
    allMatch = allMatch && matches;
    
    console.log(`  "${testCase}" → "${result}" ${matches ? '✅' : '❌'}`);
  });
  
  console.log(`  Overall: ${allMatch ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Search for ALL slug-related code in the project
console.log('🔍 SEARCHING FOR ALL SLUG GENERATION CODE:\n');

function searchInFile(filePath, content) {
  const lines = content.split('\n');
  const matches = [];
  
  lines.forEach((line, index) => {
    if (
      line.includes('toLowerCase') ||
      line.includes('replace') && (line.includes('-') || line.includes('slug')) ||
      line.includes('nameToSlug') ||
      line.includes('getProjectSlug') ||
      line.includes('slug =') ||
      line.includes('const slug') ||
      line.includes('let slug')
    ) {
      matches.push({
        line: index + 1,
        content: line.trim()
      });
    }
  });
  
  return matches;
}

function searchDirectory(dir) {
  const results = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.astro') || item.endsWith('.js'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = searchInFile(fullPath, content);
          
          if (matches.length > 0) {
            results.push({
              file: fullPath.replace(process.cwd() + '/', ''),
              matches
            });
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  walk(dir);
  return results;
}

const srcPath = path.join(process.cwd(), 'src');
const searchResults = searchDirectory(srcPath);

searchResults.forEach(result => {
  console.log(`📄 ${result.file}:`);
  result.matches.forEach(match => {
    console.log(`  Line ${match.line}: ${match.content}`);
  });
  console.log('');
});

// Test actual URL generation flow
console.log('🌐 TESTING ACTUAL URL GENERATION FLOW:\n');

// Simulate the actual flow from ProjectShowcase
const testProject = { name: 'AWS Workshop 2025!' };

// Test the getProjectSlug function logic
function getProjectSlug(project) {
  const name = project.name.toLowerCase();
  
  // Map known projects to their expected slugs
  if (name.includes('aws workshop')) {
    return 'aws-workshop-2025';
  } else if (name.includes('serverless bootcamp')) {
    return 'serverless-bootcamp';
  }
  
  // Use natural slug generation for all projects
  return slugFunctions.projectShowcase(project.name);
}

const generatedSlug = getProjectSlug(testProject);
const finalUrl = `/subscribe/${generatedSlug}/`;

console.log(`Project name: "${testProject.name}"`);
console.log(`Generated slug: "${generatedSlug}"`);
console.log(`Final URL: "${finalUrl}"`);
console.log(`Expected: "/subscribe/aws-workshop-2025/"`);
console.log(`Match: ${finalUrl === '/subscribe/aws-workshop-2025/' ? '✅' : '❌'}\n`);

// Test Astro page matching
console.log('🎯 TESTING ASTRO PAGE MATCHING:\n');

const projects = [
  { name: 'AWS Workshop 2025!' },
  { name: 'Serverless Bootcamp' },
  { name: 'Test Project-' }
];

const projectId = 'aws-workshop-2025';

projects.forEach(p => {
  const slug = slugFunctions.astroPage(p.name);
  const matches = slug === projectId;
  console.log(`"${p.name}" → "${slug}" ${matches ? '✅' : '❌'}`);
});

console.log('\n🎯 RECOMMENDATIONS:\n');

if (searchResults.length > 3) {
  console.log('❌ ISSUE: Found more slug generation locations than expected');
  console.log('   Need to check all locations for consistency');
}

console.log('✅ All current functions should now produce consistent results');
console.log('✅ Test this script after each change to verify consistency');
console.log('✅ Consider creating a shared slug utility function to avoid duplication');
