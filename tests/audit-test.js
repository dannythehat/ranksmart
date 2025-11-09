/**
 * Audit Endpoint Test Suite
 * Tests the complete audit flow with real URLs
 */

const testUrls = [
  // Good SEO examples
  'https://moz.com/learn/seo/what-is-seo',
  'https://backlinko.com/hub/seo',
  
  // Medium quality
  'https://example.com',
  
  // Edge cases
  'https://httpstat.us/404', // 404 page
  'https://httpstat.us/500', // Server error
];

async function testAuditEndpoint(url) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${url}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch('http://localhost:3000/api/audit/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Error (${response.status}):`, data.error);
      return { url, success: false, error: data.error };
    }

    console.log('✅ Audit completed successfully!\n');
    
    // Display results
    console.log('📊 OVERALL SCORE');
    console.log(`   Score: ${data.data.overall.score}/100 (${data.data.overall.grade})`);
    console.log(`   Status: ${data.data.overall.status}`);
    
    console.log('\n🎯 E-E-A-T ANALYSIS');
    console.log(`   Overall: ${data.data.eeat.overall}/100 (${data.data.eeat.grade})`);
    console.log(`   Experience: ${data.data.eeat.breakdown.experience}/100`);
    console.log(`   Expertise: ${data.data.eeat.breakdown.expertise}/100`);
    console.log(`   Authoritativeness: ${data.data.eeat.breakdown.authoritativeness}/100`);
    console.log(`   Trustworthiness: ${data.data.eeat.breakdown.trustworthiness}/100`);
    
    console.log('\n🔧 TECHNICAL SEO');
    console.log(`   Overall: ${data.data.technicalSEO.overall}/100 (${data.data.technicalSEO.grade})`);
    console.log(`   Total Issues: ${data.data.technicalSEO.totalIssues}`);
    console.log(`   Critical Issues: ${data.data.technicalSEO.criticalIssues}`);
    
    console.log('\n📄 PAGE INFO');
    console.log(`   Title: ${data.data.page.title}`);
    console.log(`   Words: ${data.data.page.wordCount}`);
    console.log(`   Reading Time: ${data.data.page.readingTime} min`);
    console.log(`   Headings: ${data.data.page.headingCount}`);
    console.log(`   Images: ${data.data.page.imageCount}`);
    console.log(`   Links: ${data.data.page.linkCount}`);

    // Show top issues
    if (data.data.technicalSEO.issuesByPriority.P0?.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (P0)');
      data.data.technicalSEO.issuesByPriority.P0.slice(0, 3).forEach(issue => {
        console.log(`   - ${issue.message}`);
      });
    }

    // Show top recommendations
    if (data.data.eeat.recommendations?.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS');
      data.data.eeat.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }

    return { url, success: true, data: data.data };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { url, success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Audit Endpoint Tests');
  console.log(`Testing ${testUrls.length} URLs...\n`);

  const results = [];

  for (const url of testUrls) {
    const result = await testAuditEndpoint(url);
    results.push(result);
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed URLs:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.url}: ${r.error}`);
    });
  }

  // Score distribution
  const scores = results.filter(r => r.success).map(r => r.data.overall.score);
  if (scores.length > 0) {
    console.log('\n📈 Score Distribution:');
    console.log(`   Average: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}/100`);
    console.log(`   Highest: ${Math.max(...scores)}/100`);
    console.log(`   Lowest: ${Math.min(...scores)}/100`);
  }

  return results;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✅ All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuditEndpoint, runAllTests };
