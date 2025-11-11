/**
 * TEST GATEWAY 3: Technical SEO Checker Test
 * Tests the technical SEO audit functionality with mock data
 * 
 * This MUST pass before moving to the next test
 */

const { runTechnicalSEOAudit } = require('../api/audit/technical-seo.js');

async function testTechnicalSEO() {
  console.log('🧪 TEST GATEWAY 3: Technical SEO Checker');
  console.log('=' .repeat(50));
  
  // Mock scraped data
  const mockData = {
    url: 'https://example.com/test-article',
    title: 'Complete Guide to SEO - Best Practices for 2024',
    description: 'Learn the latest SEO best practices and techniques to improve your website rankings in search engines with our comprehensive guide.',
    markdown: 'This is a test article with sufficient content. '.repeat(100), // ~800 words
    wordCount: 800,
    readingTime: 4,
    headings: [
      { level: 1, text: 'Complete Guide to SEO' },
      { level: 2, text: 'Introduction' },
      { level: 3, text: 'What is SEO' },
      { level: 2, text: 'Best Practices' },
      { level: 3, text: 'On-Page SEO' },
      { level: 3, text: 'Off-Page SEO' },
    ],
    images: [
      { src: 'image1.webp', alt: 'SEO Dashboard Screenshot', hasAlt: true },
      { src: 'image2.webp', alt: 'Analytics Graph', hasAlt: true },
      { src: 'image3.jpg', alt: '', hasAlt: false },
    ],
    links: [
      { url: '/about', text: 'About Us', isInternal: true },
      { url: '/services', text: 'Our Services', isInternal: true },
      { url: '/blog', text: 'Blog', isInternal: true },
      { url: 'https://google.com', text: 'Google', isInternal: false },
      { url: 'https://example.edu', text: 'Research', isInternal: false },
    ],
    metadata: {
      ogImage: 'https://example.com/og-image.jpg',
    },
  };
  
  try {
    console.log('\n📍 Testing Technical SEO Checker with mock data');
    console.log('⏳ Running audit...\n');
    
    const result = runTechnicalSEOAudit(mockData);
    
    // Validation checks
    const checks = {
      'Result is object': typeof result === 'object',
      'Overall score exists': typeof result.overallScore === 'number',
      'Overall score in range': result.overallScore >= 0 && result.overallScore <= 100,
      'Grade exists': typeof result.grade === 'string',
      'Breakdown exists': result.breakdown !== undefined,
      'Meta tags check exists': result.breakdown?.metaTags !== undefined,
      'Headings check exists': result.breakdown?.headings !== undefined,
      'Images check exists': result.breakdown?.images !== undefined,
      'Internal links check exists': result.breakdown?.internalLinks !== undefined,
      'Content quality check exists': result.breakdown?.contentQuality !== undefined,
      'Issues by priority exists': result.issuesByPriority !== undefined,
      'Total issues count exists': typeof result.totalIssues === 'number',
      'Critical issues count exists': typeof result.criticalIssues === 'number',
      'P0 issues array exists': Array.isArray(result.issuesByPriority?.P0),
      'P1 issues array exists': Array.isArray(result.issuesByPriority?.P1),
      'P2 issues array exists': Array.isArray(result.issuesByPriority?.P2),
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
      console.log('\n🎉 TEST GATEWAY 3: PASSED');
      console.log('✅ Technical SEO Checker is working correctly');
      console.log('\n📋 Audit Results:');
      console.log(`   Overall Score: ${result.overallScore}/100 (${result.grade})`);
      console.log(`   Total Issues: ${result.totalIssues}`);
      console.log(`   Critical Issues (P0): ${result.criticalIssues}`);
      console.log(`   High Priority (P1): ${result.issuesByPriority.P1.length}`);
      console.log(`   Medium Priority (P2): ${result.issuesByPriority.P2.length}`);
      console.log('\n   Category Scores:');
      console.log(`   - Meta Tags: ${result.breakdown.metaTags.score}/100`);
      console.log(`   - Headings: ${result.breakdown.headings.score}/100`);
      console.log(`   - Images: ${result.breakdown.images.score}/100`);
      console.log(`   - Internal Links: ${result.breakdown.internalLinks.score}/100`);
      console.log(`   - Content Quality: ${result.breakdown.contentQuality.score}/100`);
      return true;
    } else {
      console.log('\n❌ TEST GATEWAY 3: FAILED');
      console.log(`⚠️  ${failCount} validation check(s) failed`);
      console.log('\n🔍 Debug Info:');
      console.log(JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST GATEWAY 3: FAILED');
    console.log('⚠️  Error occurred during test:');
    console.log(`   ${error.message}`);
    console.log('\n🔍 Stack Trace:');
    console.log(error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testTechnicalSEO().then(passed => {
    process.exit(passed ? 0 : 1);
  });
}

module.exports = { testTechnicalSEO };
