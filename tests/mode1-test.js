/**
 * Mode 1: Competitor Content Generator - Test Suite
 * Tests the complete flow: SERP Analysis → Content Generation → Export
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Test cases covering different scenarios
const testCases = [
  {
    name: 'iGaming - Casino Bonus',
    keyword: 'best online casino bonuses 2025',
    style: 'professional',
    expectedWordCount: 1500,
  },
  {
    name: 'Tech - SEO Tools',
    keyword: 'best seo tools for small business',
    style: 'conversational',
    expectedWordCount: 1800,
  },
  {
    name: 'Finance - Investment',
    keyword: 'how to invest in stocks for beginners',
    style: 'educational',
    expectedWordCount: 2000,
  },
  {
    name: 'Short Keyword',
    keyword: 'seo tips',
    style: 'professional',
    expectedWordCount: 1200,
  },
];

async function runTests() {
  console.log('🧪 Mode 1: Competitor Content Generator - Test Suite\n');
  console.log('=' .repeat(60));
  
  const results = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    errors: [],
    timings: [],
  };

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Keyword: "${testCase.keyword}"`);
    console.log(`   Style: ${testCase.style}`);
    
    try {
      const result = await testContentGeneration(testCase);
      
      if (result.success) {
        results.passed++;
        console.log(`   ✅ PASSED (${result.timing})`);
        console.log(`   📊 Generated: ${result.wordCount} words`);
        console.log(`   ⭐ SEO Score: ${result.seoScore}/100`);
      } else {
        results.failed++;
        results.errors.push({ testCase: testCase.name, error: result.error });
        console.log(`   ❌ FAILED: ${result.error}`);
      }
      
      results.timings.push(result.timing);
      
      // Rate limiting: wait 3 seconds between tests
      if (testCases.indexOf(testCase) < testCases.length - 1) {
        console.log('   ⏳ Waiting 3s before next test...');
        await sleep(3000);
      }
      
    } catch (error) {
      results.failed++;
      results.errors.push({ testCase: testCase.name, error: error.message });
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Avg Time: ${calculateAverage(results.timings)}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`   - ${err.testCase}: ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Test content generation for a single test case
 */
async function testContentGeneration(testCase) {
  const startTime = Date.now();
  
  try {
    // Step 1: Get SERP data
    console.log('   [1/3] Fetching SERP data...');
    const serpResponse = await fetch(`${API_BASE}/api/audit/serp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: testCase.keyword }),
    });

    if (!serpResponse.ok) {
      throw new Error(`SERP API failed: ${serpResponse.status}`);
    }

    const serpResult = await serpResponse.json();
    
    if (!serpResult.success) {
      throw new Error(`SERP analysis failed: ${serpResult.message}`);
    }

    // Validate SERP data
    if (!serpResult.data.competitors || serpResult.data.competitors.length === 0) {
      throw new Error('No competitors found in SERP data');
    }

    console.log(`   ✓ Found ${serpResult.data.competitors.length} competitors`);

    // Step 2: Generate content
    console.log('   [2/3] Generating content...');
    const generateResponse = await fetch(`${API_BASE}/api/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: testCase.keyword,
        serpData: serpResult.data,
        style: testCase.style,
      }),
    });

    if (!generateResponse.ok) {
      throw new Error(`Generation API failed: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    
    if (!generateResult.success) {
      throw new Error(`Content generation failed: ${generateResult.message}`);
    }

    const data = generateResult.data;

    // Step 3: Validate generated content
    console.log('   [3/3] Validating content...');
    
    const validations = [
      {
        check: data.content.title && data.content.title.length > 0,
        message: 'Title is missing',
      },
      {
        check: data.content.title.length <= 70,
        message: `Title too long: ${data.content.title.length} chars`,
      },
      {
        check: data.content.metaDescription && data.content.metaDescription.length > 0,
        message: 'Meta description is missing',
      },
      {
        check: data.content.metaDescription.length <= 160,
        message: `Meta description too long: ${data.content.metaDescription.length} chars`,
      },
      {
        check: data.content.body && data.content.body.length > 0,
        message: 'Body content is missing',
      },
      {
        check: data.content.wordCount >= testCase.expectedWordCount * 0.8,
        message: `Word count too low: ${data.content.wordCount} (expected ${testCase.expectedWordCount})`,
      },
      {
        check: data.seo.estimatedScore >= 70,
        message: `SEO score too low: ${data.seo.estimatedScore}`,
      },
      {
        check: data.seo.headingCount >= 5,
        message: `Not enough headings: ${data.seo.headingCount}`,
      },
      {
        check: data.exports.html && data.exports.html.length > 0,
        message: 'HTML export is missing',
      },
      {
        check: data.exports.markdown && data.exports.markdown.length > 0,
        message: 'Markdown export is missing',
      },
      {
        check: data.exports.wordpress && data.exports.wordpress.title,
        message: 'WordPress export is missing',
      },
    ];

    for (const validation of validations) {
      if (!validation.check) {
        throw new Error(`Validation failed: ${validation.message}`);
      }
    }

    const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    return {
      success: true,
      timing,
      wordCount: data.content.wordCount,
      seoScore: data.seo.estimatedScore,
      data,
    };

  } catch (error) {
    const timing = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    return {
      success: false,
      timing,
      error: error.message,
    };
  }
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Calculate average timing
 */
function calculateAverage(timings) {
  if (timings.length === 0) return '0s';
  const total = timings.reduce((sum, t) => sum + parseFloat(t), 0);
  return `${(total / timings.length).toFixed(2)}s`;
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
