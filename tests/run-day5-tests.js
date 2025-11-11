#!/usr/bin/env node

/**
 * Day 5 Comprehensive Test Runner
 * 
 * This script runs all tests systematically and generates a detailed report.
 * 
 * Usage:
 *   node tests/run-day5-tests.js
 * 
 * Or with npm:
 *   npm run test:day5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results storage
const results = {
  gateway1: { status: 'pending', time: 0, checks: 0, errors: [] },
  gateway2: { status: 'pending', time: 0, checks: 0, errors: [] },
  gateway3: { status: 'pending', time: 0, checks: 0, errors: [] },
  gateway4: { status: 'pending', time: 0, checks: 0, errors: [] },
  startTime: Date.now(),
  endTime: null,
};

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  print(`  ${title}`, 'bright');
  console.log('='.repeat(80) + '\n');
}

/**
 * Run a test gateway
 */
function runGateway(number, name, command) {
  printHeader(`Gateway ${number}: ${name}`);
  
  const startTime = Date.now();
  const gatewayKey = `gateway${number}`;
  
  try {
    print(`Running: ${command}`, 'cyan');
    console.log('');
    
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Parse output for checks passed
    const checksMatch = output.match(/(\d+)\/(\d+) checks passed/);
    const checksPassed = checksMatch ? parseInt(checksMatch[1]) : 0;
    const totalChecks = checksMatch ? parseInt(checksMatch[2]) : 0;
    
    // Check if test passed
    const passed = output.includes('PASSED') || output.includes('✅');
    
    results[gatewayKey] = {
      status: passed ? 'passed' : 'failed',
      time: duration,
      checks: `${checksPassed}/${totalChecks}`,
      errors: passed ? [] : ['Test did not pass'],
    };
    
    console.log(output);
    
    if (passed) {
      print(`✅ Gateway ${number} PASSED (${duration}ms)`, 'green');
    } else {
      print(`❌ Gateway ${number} FAILED (${duration}ms)`, 'red');
    }
    
    return passed;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    results[gatewayKey] = {
      status: 'failed',
      time: duration,
      checks: '0/0',
      errors: [error.message],
    };
    
    print(`❌ Gateway ${number} FAILED (${duration}ms)`, 'red');
    print(`Error: ${error.message}`, 'red');
    
    if (error.stdout) {
      console.log('\nOutput:');
      console.log(error.stdout.toString());
    }
    
    if (error.stderr) {
      console.log('\nError Output:');
      console.log(error.stderr.toString());
    }
    
    return false;
  }
}

/**
 * Generate test report
 */
function generateReport() {
  results.endTime = Date.now();
  const totalTime = results.endTime - results.startTime;
  
  printHeader('Day 5 Test Results Summary');
  
  // Gateway results table
  console.log('Gateway Test Results:');
  console.log('─'.repeat(80));
  console.log('Gateway | Status   | Time    | Checks | Result');
  console.log('─'.repeat(80));
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (let i = 1; i <= 4; i++) {
    const key = `gateway${i}`;
    const result = results[key];
    const statusIcon = result.status === 'passed' ? '✅' : 
                       result.status === 'failed' ? '❌' : '⏸️';
    const statusColor = result.status === 'passed' ? 'green' : 
                        result.status === 'failed' ? 'red' : 'yellow';
    
    const line = `${i}       | ${statusIcon} ${result.status.padEnd(6)} | ${result.time}ms | ${result.checks} | ${result.status.toUpperCase()}`;
    print(line, statusColor);
    
    if (result.status === 'passed') passCount++;
    else if (result.status === 'failed') failCount++;
    else skipCount++;
  }
  
  console.log('─'.repeat(80));
  console.log('');
  
  // Summary statistics
  print('Summary:', 'bright');
  print(`  Total Tests: 4`, 'cyan');
  print(`  Passed: ${passCount}`, 'green');
  print(`  Failed: ${failCount}`, failCount > 0 ? 'red' : 'cyan');
  print(`  Skipped: ${skipCount}`, skipCount > 0 ? 'yellow' : 'cyan');
  print(`  Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`, 'cyan');
  console.log('');
  
  // Overall result
  if (failCount === 0 && skipCount === 0) {
    printHeader('🎉 ALL TESTS PASSED!');
    print('✅ All modules are working correctly', 'green');
    print('✅ Integration is validated', 'green');
    print('✅ Ready for deployment!', 'green');
    console.log('');
    return true;
  } else if (failCount === 0 && skipCount > 0) {
    printHeader('⚠️  TESTS PASSED WITH SKIPS');
    print(`✅ ${passCount} test(s) passed`, 'green');
    print(`⏸️  ${skipCount} test(s) skipped (missing API keys)`, 'yellow');
    console.log('');
    print('Next Steps:', 'bright');
    print('  1. Set missing API keys in .env file', 'yellow');
    print('  2. Re-run tests', 'yellow');
    print('  3. Ensure all tests pass before deployment', 'yellow');
    console.log('');
    return true;
  } else {
    printHeader('⚠️  TESTS INCOMPLETE');
    print(`❌ ${failCount} test(s) failed`, 'red');
    print(`⏸️  ${skipCount} test(s) skipped`, 'yellow');
    print(`⏭️  ${4 - passCount - failCount - skipCount} test(s) not run`, 'yellow');
    console.log('');
    print('Next Steps:', 'bright');
    print('  1. Review error messages above', 'red');
    print('  2. Fix the failing test(s)', 'red');
    print('  3. Re-run test suite', 'red');
    print('  4. Do NOT proceed until all tests pass', 'red');
    console.log('');
    return false;
  }
}

/**
 * Save results to file
 */
function saveResults() {
  const reportPath = path.join(__dirname, '..', 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  print(`\n📄 Detailed results saved to: ${reportPath}`, 'cyan');
}

/**
 * Main test execution
 */
async function main() {
  printHeader('🧪 Day 5 Comprehensive Test Suite');
  
  print('Starting comprehensive test suite...', 'cyan');
  print('This will run all 4 gateway tests sequentially.', 'cyan');
  console.log('');
  
  // Check for .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    print('⚠️  Warning: .env file not found', 'yellow');
    print('Some tests may be skipped due to missing API keys', 'yellow');
    console.log('');
  }
  
  // Run all gateways
  const gateway1Passed = runGateway(1, 'Firecrawl Module', 'npm run test:gateway1');
  const gateway2Passed = runGateway(2, 'E-E-A-T Scorer', 'npm run test:gateway2');
  const gateway3Passed = runGateway(3, 'Technical SEO Checker', 'npm run test:gateway3');
  const gateway4Passed = runGateway(4, 'Full Integration', 'npm run test:gateway4');
  
  // Generate report
  const allPassed = generateReport();
  
  // Save results
  saveResults();
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  print(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
