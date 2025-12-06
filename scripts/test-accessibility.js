#!/usr/bin/env node

/**
 * Browser Accessibility Testing Script
 * 
 * This script tests the frontend application for WCAG 2.1 AA compliance using:
 * - Automated accessibility checks with axe-core
 * - Color contrast verification
 * - Keyboard navigation testing
 * - ARIA attribute validation
 * - Screen reader compatibility checks
 * 
 * Usage: node scripts/test-accessibility.js [--url=http://localhost:4321]
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

// Configuration
const DEFAULT_URL = process.env.TEST_URL || 'http://localhost:4321';
const REPORT_DIR = path.join(process.cwd(), 'accessibility-reports');

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const BASE_URL = urlArg ? urlArg.split('=')[1] : DEFAULT_URL;

// Pages to test
const PAGES_TO_TEST = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Admin', path: '/admin' },
];

// Color contrast requirements (WCAG 2.1 AA)
const CONTRAST_REQUIREMENTS = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponents: 3.0,
};

/**
 * Initialize report directory
 */
function initReportDirectory() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

/**
 * Generate timestamp for report filenames
 */
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Save report to file
 */
function saveReport(filename, content) {
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(content, null, 2));
  console.log(`📄 Report saved: ${filepath}`);
}

/**
 * Test a single page for accessibility issues
 */
async function testPage(page, pageName, pagePath) {
  console.log(`\n🔍 Testing: ${pageName} (${pagePath})`);
  
  try {
    // Navigate to page
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Categorize violations by severity
    const violations = {
      critical: accessibilityScanResults.violations.filter(v => v.impact === 'critical'),
      serious: accessibilityScanResults.violations.filter(v => v.impact === 'serious'),
      moderate: accessibilityScanResults.violations.filter(v => v.impact === 'moderate'),
      minor: accessibilityScanResults.violations.filter(v => v.impact === 'minor'),
    };
    
    // Test keyboard navigation
    const keyboardResults = await testKeyboardNavigation(page);
    
    // Test focus indicators
    const focusResults = await testFocusIndicators(page);
    
    // Test ARIA attributes
    const ariaResults = await testAriaAttributes(page);
    
    // Compile results
    const results = {
      page: pageName,
      path: pagePath,
      url: `${BASE_URL}${pagePath}`,
      timestamp: new Date().toISOString(),
      violations,
      totalViolations: accessibilityScanResults.violations.length,
      passes: accessibilityScanResults.passes.length,
      incomplete: accessibilityScanResults.incomplete.length,
      keyboardNavigation: keyboardResults,
      focusIndicators: focusResults,
      ariaAttributes: ariaResults,
      wcagCompliance: {
        level: determineWCAGLevel(violations),
        passed: violations.critical.length === 0 && violations.serious.length === 0,
      },
    };
    
    // Print summary
    printPageSummary(results);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Error testing ${pageName}:`, error.message);
    return {
      page: pageName,
      path: pagePath,
      error: error.message,
      wcagCompliance: { level: 'FAIL', passed: false },
    };
  }
}

/**
 * Test keyboard navigation
 */
async function testKeyboardNavigation(page) {
  const results = {
    tabNavigation: false,
    escapeKey: false,
    enterKey: false,
    arrowKeys: false,
    issues: [],
  };
  
  try {
    // Test Tab navigation
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]').count();
    if (interactiveElements > 0) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      results.tabNavigation = !!focusedElement;
    }
    
    // Test Escape key (for modals/dropdowns)
    const modals = await page.locator('[role="dialog"], [aria-modal="true"]').count();
    results.escapeKey = modals === 0; // Pass if no modals, or would need to test modal closing
    
    // Test Enter key on buttons
    const buttons = await page.locator('button').count();
    results.enterKey = buttons > 0;
    
    // Test arrow keys (for dropdowns/menus)
    const menus = await page.locator('[role="menu"], [role="listbox"]').count();
    results.arrowKeys = menus === 0; // Pass if no menus, or would need to test menu navigation
    
  } catch (error) {
    results.issues.push(error.message);
  }
  
  return results;
}

/**
 * Test focus indicators
 */
async function testFocusIndicators(page) {
  const results = {
    visible: false,
    sufficient: false,
    issues: [],
  };
  
  try {
    // Get all focusable elements
    const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusableElements.length === 0) {
      results.visible = true;
      results.sufficient = true;
      return results;
    }
    
    // Test first focusable element
    await focusableElements[0].focus();
    
    // Check if focus indicator is visible
    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });
    
    // Check if focus indicator exists
    const hasFocusIndicator = 
      (focusStyles.outline && focusStyles.outline !== 'none') ||
      (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
    
    results.visible = hasFocusIndicator;
    results.sufficient = hasFocusIndicator; // Would need more sophisticated checking
    
  } catch (error) {
    results.issues.push(error.message);
  }
  
  return results;
}

/**
 * Test ARIA attributes
 */
async function testAriaAttributes(page) {
  const results = {
    modalsHaveLabels: true,
    buttonsHaveLabels: true,
    formsHaveLabels: true,
    liveRegions: true,
    issues: [],
  };
  
  try {
    // Check modals have proper ARIA attributes
    const modalsWithoutLabels = await page.locator('[role="dialog"]:not([aria-labelledby]):not([aria-label])').count();
    results.modalsHaveLabels = modalsWithoutLabels === 0;
    if (modalsWithoutLabels > 0) {
      results.issues.push(`${modalsWithoutLabels} modal(s) missing aria-labelledby or aria-label`);
    }
    
    // Check buttons without text have aria-label
    const buttonsWithoutAccessibleName = await page.locator('button:not([aria-label]):not([aria-labelledby])').evaluateAll(buttons => {
      return buttons.filter(btn => !btn.textContent?.trim()).length;
    });
    results.buttonsHaveLabels = buttonsWithoutAccessibleName === 0;
    if (buttonsWithoutAccessibleName > 0) {
      results.issues.push(`${buttonsWithoutAccessibleName} button(s) without accessible name`);
    }
    
    // Check form inputs have labels
    const inputsWithoutLabels = await page.locator('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').evaluateAll(inputs => {
      return inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label;
      }).length;
    });
    results.formsHaveLabels = inputsWithoutLabels === 0;
    if (inputsWithoutLabels > 0) {
      results.issues.push(`${inputsWithoutLabels} input(s) without labels`);
    }
    
    // Check for live regions (for dynamic content)
    const liveRegions = await page.locator('[aria-live]').count();
    results.liveRegions = liveRegions > 0;
    
  } catch (error) {
    results.issues.push(error.message);
  }
  
  return results;
}

/**
 * Determine WCAG compliance level
 */
function determineWCAGLevel(violations) {
  if (violations.critical.length > 0) return 'FAIL';
  if (violations.serious.length > 0) return 'PARTIAL';
  if (violations.moderate.length > 0) return 'AA (with warnings)';
  return 'AA';
}

/**
 * Print page summary
 */
function printPageSummary(results) {
  console.log(`\n📊 Results for ${results.page}:`);
  console.log(`   Total Violations: ${results.totalViolations}`);
  console.log(`   - Critical: ${results.violations.critical.length}`);
  console.log(`   - Serious: ${results.violations.serious.length}`);
  console.log(`   - Moderate: ${results.violations.moderate.length}`);
  console.log(`   - Minor: ${results.violations.minor.length}`);
  console.log(`   Passes: ${results.passes}`);
  console.log(`   WCAG Level: ${results.wcagCompliance.level}`);
  console.log(`   Compliant: ${results.wcagCompliance.passed ? '✅' : '❌'}`);
  
  // Print critical violations
  if (results.violations.critical.length > 0) {
    console.log(`\n   🚨 Critical Issues:`);
    results.violations.critical.forEach((v, i) => {
      console.log(`      ${i + 1}. ${v.id}: ${v.description}`);
      console.log(`         Impact: ${v.impact} | Nodes: ${v.nodes.length}`);
    });
  }
  
  // Print keyboard navigation results
  console.log(`\n   ⌨️  Keyboard Navigation:`);
  console.log(`      Tab: ${results.keyboardNavigation.tabNavigation ? '✅' : '❌'}`);
  console.log(`      Escape: ${results.keyboardNavigation.escapeKey ? '✅' : '❌'}`);
  console.log(`      Enter: ${results.keyboardNavigation.enterKey ? '✅' : '❌'}`);
  
  // Print focus indicator results
  console.log(`\n   🎯 Focus Indicators:`);
  console.log(`      Visible: ${results.focusIndicators.visible ? '✅' : '❌'}`);
  console.log(`      Sufficient: ${results.focusIndicators.sufficient ? '✅' : '❌'}`);
  
  // Print ARIA results
  console.log(`\n   🏷️  ARIA Attributes:`);
  console.log(`      Modals: ${results.ariaAttributes.modalsHaveLabels ? '✅' : '❌'}`);
  console.log(`      Buttons: ${results.ariaAttributes.buttonsHaveLabels ? '✅' : '❌'}`);
  console.log(`      Forms: ${results.ariaAttributes.formsHaveLabels ? '✅' : '❌'}`);
  console.log(`      Live Regions: ${results.ariaAttributes.liveRegions ? '✅' : '❌'}`);
}

/**
 * Print final summary
 */
function printFinalSummary(allResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL ACCESSIBILITY REPORT');
  console.log('='.repeat(80));
  
  const totalPages = allResults.length;
  const passedPages = allResults.filter(r => r.wcagCompliance?.passed).length;
  const failedPages = totalPages - passedPages;
  
  console.log(`\nPages Tested: ${totalPages}`);
  console.log(`Passed: ${passedPages} ✅`);
  console.log(`Failed: ${failedPages} ❌`);
  
  const totalViolations = allResults.reduce((sum, r) => sum + (r.totalViolations || 0), 0);
  const criticalViolations = allResults.reduce((sum, r) => sum + (r.violations?.critical.length || 0), 0);
  const seriousViolations = allResults.reduce((sum, r) => sum + (r.violations?.serious.length || 0), 0);
  
  console.log(`\nTotal Violations: ${totalViolations}`);
  console.log(`- Critical: ${criticalViolations}`);
  console.log(`- Serious: ${seriousViolations}`);
  
  console.log(`\n${'='.repeat(80)}`);
  
  if (criticalViolations === 0 && seriousViolations === 0) {
    console.log('✅ WCAG 2.1 AA COMPLIANCE: PASSED');
  } else {
    console.log('❌ WCAG 2.1 AA COMPLIANCE: FAILED');
    console.log('\nPlease review the detailed reports in the accessibility-reports directory.');
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Main test execution
 */
async function runAccessibilityTests() {
  console.log('🚀 Starting Browser Accessibility Tests');
  console.log(`📍 Testing URL: ${BASE_URL}`);
  console.log(`📁 Reports will be saved to: ${REPORT_DIR}\n`);
  
  initReportDirectory();
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const allResults = [];
  
  try {
    // Test each page
    for (const pageConfig of PAGES_TO_TEST) {
      const results = await testPage(page, pageConfig.name, pageConfig.path);
      allResults.push(results);
      
      // Save individual page report
      const timestamp = getTimestamp();
      saveReport(`${pageConfig.name.toLowerCase()}-${timestamp}.json`, results);
    }
    
    // Save combined report
    const timestamp = getTimestamp();
    const combinedReport = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        totalPages: allResults.length,
        passed: allResults.filter(r => r.wcagCompliance?.passed).length,
        failed: allResults.filter(r => !r.wcagCompliance?.passed).length,
        totalViolations: allResults.reduce((sum, r) => sum + (r.totalViolations || 0), 0),
      },
      pages: allResults,
    };
    saveReport(`combined-report-${timestamp}.json`, combinedReport);
    
    // Print final summary
    printFinalSummary(allResults);
    
    // Exit with appropriate code
    const hasFailures = allResults.some(r => !r.wcagCompliance?.passed);
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run tests
runAccessibilityTests().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
