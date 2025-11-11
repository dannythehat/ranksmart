/**
 * TEST GATEWAY 1: Firecrawl Module Test
 * Tests the Firecrawl scraping functionality in isolation
 * 
 * This MUST pass before moving to the next test
 */

const { scrapeUrl } = require('../api/audit/firecrawl.js');

async function testFirecrawl() {
  console.log('🧪 TEST GATEWAY 1: Firecrawl Module');
  console.log('=' .repeat(50));
  
  const testUrl = 'https://example.com';
  
  try {
    console.log(`\n📍 Testing URL: ${testUrl}`);
    console.log('⏳ Scraping...\n');
    
    const result = await scrapeUrl(testUrl);
    
    // Validation checks
    const checks = {
      'Result has success property': result.hasOwnProperty('success'),
      'Success is true': result.success === true,
      'Data object exists': result.data !== undefined,
      'URL matches': result.data?.url !== undefined,
      'Title extracted': result.data?.title && result.data.title.length > 0,
      'Markdown content exists': result.data?.markdown && result.data.markdown.length > 0,
      'Word count calculated': result.data?.wordCount > 0,
      'Headings extracted': Array.isArray(result.data?.headings),
      'Images extracted': Array.isArray(result.data?.images),
      'Links extracted': Array.isArray(result.data?.links),
      'Has content flag': result.data?.hasContent === true,
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
      console.log('\n🎉 TEST GATEWAY 1: PASSED');
      console.log('✅ Firecrawl module is working correctly');
      console.log('\n📋 Sample Data:');
      console.log(`   Title: ${result.data.title}`);
      console.log(`   Word Count: ${result.data.wordCount}`);
      console.log(`   Headings: ${result.data.headings.length}`);
      console.log(`   Images: ${result.data.images.length}`);
      console.log(`   Links: ${result.data.links.length}`);
      console.log(`   Reading Time: ${result.data.readingTime} min`);
      return true;
    } else {
      console.log('\n❌ TEST GATEWAY 1: FAILED');
      console.log(`⚠️  ${failCount} validation check(s) failed`);
      console.log('\n🔍 Debug Info:');
      console.log(JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST GATEWAY 1: FAILED');
    console.log('⚠️  Error occurred during test:');
    console.log(`   ${error.message}`);
    console.log('\n🔍 Stack Trace:');
    console.log(error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testFirecrawl().then(passed => {
    process.exit(passed ? 0 : 1);
  });
}

module.exports = { testFirecrawl };
