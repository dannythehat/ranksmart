/**
 * MASTER TEST RUNNER
 * Runs all test gateways in sequence
 * Each test MUST pass before moving to the next
 */

const { testFirecrawl } = require('./01-firecrawl-test.js');
const { testEEATScorer } = require('./02-eeat-scorer-test.js');
const { testTechnicalSEO } = require('./03-technical-seo-test.js');

async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🚀 RANKSMART TEST SUITE - SEQUENTIAL GATEWAY VALIDATION');
  console.log('═'.repeat(60));
  console.log('\nEach test must pass before proceeding to the next.\n');
  
  const tests = [
    { name: 'Gateway 1: Firecrawl Module', fn: testFirecrawl },
    { name: 'Gateway 2: E-E-A-T Scorer', fn: testEEATScorer },
    { name: 'Gateway 3: Technical SEO Checker', fn: testTechnicalSEO },
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  const results = [];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📍 Running ${test.name}...`);
    console.log('─'.repeat(60));
    
    try {
      const passed = await test.fn();
      
      if (passed) {
        passedCount++;
        results.push({ test: test.name, status: 'PASSED' });
        console.log(`\n✅ ${test.name} PASSED`);
      } else {
        failedCount++;
        results.push({ test: test.name, status: 'FAILED' });
        console.log(`\n❌ ${test.name} FAILED`);
        console.log('\n⚠️  STOPPING: Fix this test before proceeding to the next gateway.');
        break;
      }
    } catch (error) {
      failedCount++;
      results.push({ test: test.name, status: 'ERROR', error: error.message });
      console.log(`\n❌ ${test.name} ERROR`);
      console.log(`   ${error.message}`);
      console.log('\n⚠️  STOPPING: Fix this test before proceeding to the next gateway.');
      break;
    }
  }
  
  // Final summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('═'.repeat(60));
  console.log(`\nTotal Tests: ${tests.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Skipped: ${tests.length - passedCount - failedCount}`);
  
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(60));
  results.forEach((result, index) => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  if (passedCount === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ All modules are working correctly');
    console.log('✅ Ready to proceed with integration testing');
  } else {
    console.log('\n⚠️  TESTS INCOMPLETE');
    console.log(`❌ ${failedCount} test(s) failed`);
    console.log(`⏸️  ${tests.length - passedCount - failedCount} test(s) skipped`);
    console.log('\n🔧 Next Steps:');
    console.log('   1. Fix the failed test');
    console.log('   2. Re-run this test suite');
    console.log('   3. Proceed only when all tests pass');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return passedCount === tests.length;
}

// Run all tests
if (require.main === module) {
  runAllTests().then(allPassed => {
    process.exit(allPassed ? 0 : 1);
  });
}

module.exports = { runAllTests };
