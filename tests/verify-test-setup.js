/**
 * TEST SETUP VERIFICATION
 * Verifies that all test prerequisites are met before running tests
 */

const fs = require('fs');
const path = require('path');

function verifyTestSetup() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🔍 RANKSMART TEST SETUP VERIFICATION');
  console.log('═'.repeat(60));
  console.log('\nChecking prerequisites before running tests...\n');
  
  const checks = [];
  let allPassed = true;
  
  // Check 1: Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
  const nodeCheck = nodeMajor >= 18;
  checks.push({
    name: 'Node.js version >= 18',
    passed: nodeCheck,
    details: `Current: ${nodeVersion}`,
  });
  if (!nodeCheck) allPassed = false;
  
  // Check 2: package.json exists
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJsonExists = fs.existsSync(packageJsonPath);
  checks.push({
    name: 'package.json exists',
    passed: packageJsonExists,
    details: packageJsonExists ? 'Found' : 'Missing',
  });
  if (!packageJsonExists) allPassed = false;
  
  // Check 3: node_modules exists
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const nodeModulesExists = fs.existsSync(nodeModulesPath);
  checks.push({
    name: 'Dependencies installed (node_modules)',
    passed: nodeModulesExists,
    details: nodeModulesExists ? 'Found' : 'Run: npm install',
  });
  if (!nodeModulesExists) allPassed = false;
  
  // Check 4: Test files exist
  const testFiles = [
    '01-firecrawl-test.js',
    '02-eeat-scorer-test.js',
    '03-technical-seo-test.js',
    '04-integration-test.js',
    '00-run-all-tests.js',
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    checks.push({
      name: `Test file: ${file}`,
      passed: exists,
      details: exists ? 'Found' : 'Missing',
    });
    if (!exists) allPassed = false;
  });
  
  // Check 5: API module files exist
  const apiFiles = [
    'api/audit/firecrawl.js',
    'api/audit/eeat-scorer.js',
    'api/audit/technical-seo.js',
    'api/audit/scan.js',
  ];
  
  apiFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    checks.push({
      name: `API module: ${file}`,
      passed: exists,
      details: exists ? 'Found' : 'Missing',
    });
    if (!exists) allPassed = false;
  });
  
  // Check 6: Environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  const envVars = [
    { name: 'FIRECRAWL_API_KEY', required: true },
    { name: 'OPENAI_API_KEY', required: false },
    { name: 'GOOGLE_GEMINI_API_KEY', required: false },
    { name: 'SUPABASE_URL', required: false },
    { name: 'SUPABASE_ANON_KEY', required: false },
  ];
  
  envVars.forEach(({ name, required }) => {
    const exists = !!process.env[name];
    checks.push({
      name: `Environment variable: ${name}`,
      passed: exists || !required,
      details: exists ? 'Set' : (required ? 'REQUIRED - Not set' : 'Optional - Not set'),
      warning: !exists && required,
    });
    if (!exists && required) allPassed = false;
  });
  
  // Display results
  console.log('📋 VERIFICATION RESULTS:');
  console.log('─'.repeat(60));
  
  checks.forEach(check => {
    const icon = check.passed ? '✅' : (check.warning ? '⚠️ ' : '❌');
    console.log(`${icon} ${check.name}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  });
  
  console.log('─'.repeat(60));
  
  const passedCount = checks.filter(c => c.passed).length;
  const failedCount = checks.filter(c => !c.passed && !c.warning).length;
  const warningCount = checks.filter(c => c.warning).length;
  
  console.log(`\n📊 Summary: ${passedCount}/${checks.length} checks passed`);
  if (failedCount > 0) {
    console.log(`❌ Failed: ${failedCount}`);
  }
  if (warningCount > 0) {
    console.log(`⚠️  Warnings: ${warningCount}`);
  }
  
  console.log('\n');
  
  if (allPassed) {
    console.log('🎉 ALL PREREQUISITES MET!');
    console.log('✅ Ready to run tests');
    console.log('\n📝 Next steps:');
    console.log('   1. Run individual tests: npm run test:gateway1');
    console.log('   2. Or run all tests: npm test');
    console.log('   3. Or run Day 5 tests: npm run test:day5');
  } else {
    console.log('⚠️  PREREQUISITES NOT MET');
    console.log('❌ Fix the issues above before running tests');
    console.log('\n🔧 Common fixes:');
    console.log('   - Install dependencies: npm install');
    console.log('   - Set up .env file: cp .env.example .env');
    console.log('   - Add FIRECRAWL_API_KEY to .env file');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return allPassed;
}

// Run verification
if (require.main === module) {
  const passed = verifyTestSetup();
  process.exit(passed ? 0 : 1);
}

module.exports = { verifyTestSetup };
