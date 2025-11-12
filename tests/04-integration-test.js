/**
 * TEST GATEWAY 4: Integration Test
 * Tests the complete scan endpoint with all modules integrated
 * 
 * This MUST pass before deploying to production
 * 
 * Prerequisites:
 * - Gateway 1, 2, and 3 must pass
 * - FIRECRAWL_API_KEY must be set in environment
 */

const scanHandler = require('../api/audit/scan.js');

async function testIntegration() {
  console.log('🧪 TEST GATEWAY 4: Full Integration Test');
  console.log('='.repeat(50));
  
  // Check for API key
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('\n⚠️  WARNING: FIRECRAWL_API_KEY not set');
    console.log('   Set it in .env file to run this test');
    console.log('\n⏸️  TEST SKIPPED');
    return null; // null means skipped, not failed
  }
  
  const testUrl = 'https://example.com';
  
  // Mock request and response objects
  const mockReq = {
    method: 'POST',
    body: {
      url: testUrl,
    },
  };
  
  const mockRes = {
    statusCode: null,
    headers: {},
    body: null,
    
    setHeader(key, value) {
      this.headers[key] = value;
    },
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.body = data;
      return this;
    },
    
    end() {
      return this;
    },
  };
  
  try {
    console.log(`\n📍 Testing full scan endpoint with URL: ${testUrl}`);
    console.log('⏳ Running complete audit...\n');
    
    // Run the scan handler
    await scanHandler(mockReq, mockRes);
    
    // Validation checks
    const checks = {
      'Response status is 200': mockRes.statusCode === 200,
      'Response body exists': mockRes.body !== null,
      'Success flag is true': mockRes.body?.success === true,
      'Data object exists': mockRes.body?.data !== undefined,
      'URL in response': mockRes.body?.data?.url === testUrl,
      'Scanned timestamp exists': mockRes.body?.data?.scannedAt !== undefined,
      'Execution time recorded': mockRes.body?.data?.executionTime !== undefined,
      'Overall score exists': mockRes.body?.data?.overall?.score !== undefined,
      'Overall grade exists': mockRes.body?.data?.overall?.grade !== undefined,
      'E-E-A-T data exists': mockRes.body?.data?.eeat !== undefined,
      'E-E-A-T overall score': typeof mockRes.body?.data?.eeat?.overall === 'number',
      'E-E-A-T breakdown exists': mockRes.body?.data?.eeat?.breakdown !== undefined,
      'Technical SEO data exists': mockRes.body?.data?.technicalSEO !== undefined,
      'Technical SEO score': typeof mockRes.body?.data?.technicalSEO?.overall === 'number',
      'Page metadata exists': mockRes.body?.data?.page !== undefined,
      'Stats object exists': mockRes.body?.data?.stats !== undefined,
      'CORS headers set': mockRes.headers['Access-Control-Allow-Origin'] === '*',
    };
    
    console.log('✅ VALIDATION RESULTS:');
    console.log('-'.repeat(50));
    
    let passCount = 0;
    let failCount = 0;
    
    for (const [check, passed] of Object.entries(checks)) {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${check}`);
      if (passed) passCount++;
      else failCount++;
    }
    
    console.log('-'.repeat(50));
    console.log(`\n📊 Results: ${passCount}/${Object.keys(checks).length} checks passed`);
    
    if (failCount === 0) {
      console.log('\n🎉 TEST GATEWAY 4: PASSED');
      console.log('✅ Full integration is working correctly');
      console.log('\n📋 Audit Results:');
      const data = mockRes.body.data;
      console.log(`   URL: ${data.url}`);
      console.log(`   Overall Score: ${data.overall.score}/100 (${data.overall.grade})`);
      console.log(`   E-E-A-T Score: ${data.eeat.overall}/100`);
      console.log(`   Technical SEO Score: ${data.technicalSEO.overall}/100`);
      console.log(`   Total Issues: ${data.stats.totalIssues}`);
      console.log(`   Critical Issues: ${data.stats.criticalIssues}`);
      console.log(`   Execution Time: ${data.executionTime}`);
      console.log('\n🚀 READY FOR DEPLOYMENT!');
      return true;
    } else {
      console.log('\n❌ TEST GATEWAY 4: FAILED');
      console.log(`⚠️  ${failCount} validation check(s) failed`);
      console.log('\n🔍 Debug Info:');
      console.log('Response Status:', mockRes.statusCode);
      console.log('Response Body:', JSON.stringify(mockRes.body, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST GATEWAY 4: FAILED');
    console.log('⚠️  Error occurred during test:');
    console.log(`   ${error.message}`);
    console.log('\n🔍 Stack Trace:');
    console.log(error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testIntegration().then(result => {
    if (result === null) {
      // Skipped
      process.exit(0);
    } else {
      process.exit(result ? 0 : 1);
    }
  });
}

module.exports = { testIntegration };
