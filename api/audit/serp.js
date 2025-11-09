import FirecrawlApp from '@mendable/firecrawl-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const firecrawl = new FirecrawlApp({ 
  apiKey: process.env.FIRECRAWL_API_KEY 
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keyword, targetUrl, limit = 10 } = req.body;

    if (!keyword) {
      return res.status(400).json({ 
        error: 'Keyword is required' 
      });
    }

    console.log(`🔍 Starting SERP analysis for: "${keyword}"`);

    // Step 1: Get SERP results using Google search
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${limit}`;
    
    console.log('📡 Fetching SERP data...');
    const searchResult = await firecrawl.scrapeUrl(searchUrl, {
      formats: ['markdown', 'html'],
      onlyMainContent: false,
    });

    if (!searchResult.success) {
      return res.status(400).json({ 
        error: 'Failed to fetch SERP data' 
      });
    }

    // Step 2: Extract top URLs from search results
    const topUrls = extractSearchUrls(searchResult.markdown || '', limit);
    console.log(`✅ Found ${topUrls.length} competitor URLs`);

    if (topUrls.length === 0) {
      return res.status(400).json({
        error: 'No competitor URLs found in search results'
      });
    }

    // Step 3: Scrape each competitor page for detailed analysis
    console.log('🕷️ Scraping competitor pages...');
    const competitors = await scrapeCompetitors(topUrls, keyword);

    // Step 4: Analyze target URL if provided
    let targetAnalysis = null;
    if (targetUrl) {
      console.log(`🎯 Analyzing target URL: ${targetUrl}`);
      targetAnalysis = await analyzeTargetUrl(targetUrl, keyword);
    }

    // Step 5: Perform gap analysis
    console.log('📊 Performing gap analysis...');
    const gapAnalysis = performGapAnalysis(competitors, targetAnalysis);

    // Step 6: Generate AI recommendations
    console.log('🤖 Generating AI recommendations...');
    const recommendations = await generateRecommendations(
      keyword, 
      competitors, 
      targetAnalysis, 
      gapAnalysis
    );

    // Step 7: Compile final report
    const report = {
      success: true,
      keyword: keyword,
      targetUrl: targetUrl || null,
      analyzedAt: new Date().toISOString(),
      summary: {
        totalCompetitors: competitors.length,
        avgWordCount: Math.round(
          competitors.reduce((sum, c) => sum + c.wordCount, 0) / competitors.length
        ),
        avgHeadings: Math.round(
          competitors.reduce((sum, c) => sum + c.headings.total, 0) / competitors.length
        ),
        commonKeywords: gapAnalysis.commonKeywords.slice(0, 10),
      },
      competitors: competitors,
      targetAnalysis: targetAnalysis,
      gapAnalysis: gapAnalysis,
      recommendations: recommendations,
    };

    console.log('✅ SERP analysis complete!');
    return res.status(200).json(report);

  } catch (error) {
    console.error('❌ SERP analysis error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Extract URLs from Google search results
function extractSearchUrls(markdown, limit = 10) {
  const urls = [];
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const matches = markdown.match(urlRegex) || [];

  const seen = new Set();
  for (const url of matches) {
    if (urls.length >= limit) break;
    
    // Skip Google's own URLs and common non-content URLs
    if (
      url.includes('google.com') || 
      url.includes('gstatic.com') ||
      url.includes('youtube.com') ||
      url.includes('facebook.com') ||
      url.includes('twitter.com')
    ) continue;
    
    // Clean URL
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    if (!seen.has(cleanUrl)) {
      seen.add(cleanUrl);
      urls.push(cleanUrl);
    }
  }

  return urls;
}

// Scrape competitor pages and extract key metrics
async function scrapeCompetitors(urls, keyword) {
  const competitors = [];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      console.log(`  📄 Scraping #${i + 1}: ${urls[i]}`);
      
      const result = await firecrawl.scrapeUrl(urls[i], {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        timeout: 15000,
      });

      if (!result.success) {
        console.log(`  ⚠️ Failed to scrape: ${urls[i]}`);
        continue;
      }

      const content = result.markdown || '';
      const html = result.html || '';
      const metadata = result.metadata || {};

      // Extract metrics
      const analysis = {
        rank: i + 1,
        url: urls[i],
        domain: new URL(urls[i]).hostname,
        title: metadata.title || extractTitle(html) || 'No title',
        description: metadata.description || extractDescription(html) || '',
        wordCount: countWords(content),
        headings: extractHeadings(content),
        keywords: extractKeywords(content, keyword),
        images: extractImages(html),
        links: extractLinks(html, urls[i]),
        contentStructure: analyzeContentStructure(content),
        metaTags: {
          hasTitle: !!metadata.title,
          hasDescription: !!metadata.description,
          titleLength: (metadata.title || '').length,
          descriptionLength: (metadata.description || '').length,
        },
      };

      competitors.push(analysis);
      
    } catch (error) {
      console.log(`  ❌ Error scraping ${urls[i]}:`, error.message);
    }
  }

  return competitors;
}

// Analyze target URL
async function analyzeTargetUrl(url, keyword) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: 15000,
    });

    if (!result.success) {
      return null;
    }

    const content = result.markdown || '';
    const html = result.html || '';
    const metadata = result.metadata || {};

    return {
      url: url,
      domain: new URL(url).hostname,
      title: metadata.title || extractTitle(html) || 'No title',
      description: metadata.description || extractDescription(html) || '',
      wordCount: countWords(content),
      headings: extractHeadings(content),
      keywords: extractKeywords(content, keyword),
      images: extractImages(html),
      links: extractLinks(html, url),
      contentStructure: analyzeContentStructure(content),
      metaTags: {
        hasTitle: !!metadata.title,
        hasDescription: !!metadata.description,
        titleLength: (metadata.title || '').length,
        descriptionLength: (metadata.description || '').length,
      },
    };
  } catch (error) {
    console.error('Error analyzing target URL:', error);
    return null;
  }
}

// Perform gap analysis
function performGapAnalysis(competitors, targetAnalysis) {
  // Calculate averages
  const avgWordCount = competitors.reduce((sum, c) => sum + c.wordCount, 0) / competitors.length;
  const avgHeadings = competitors.reduce((sum, c) => sum + c.headings.total, 0) / competitors.length;
  const avgImages = competitors.reduce((sum, c) => sum + c.images.total, 0) / competitors.length;
  const avgInternalLinks = competitors.reduce((sum, c) => sum + c.links.internal, 0) / competitors.length;
  const avgExternalLinks = competitors.reduce((sum, c) => sum + c.links.external, 0) / competitors.length;

  // Find common keywords across competitors
  const keywordFrequency = {};
  competitors.forEach(comp => {
    comp.keywords.forEach(kw => {
      keywordFrequency[kw.keyword] = (keywordFrequency[kw.keyword] || 0) + 1;
    });
  });

  const commonKeywords = Object.entries(keywordFrequency)
    .filter(([_, count]) => count >= competitors.length * 0.5) // Present in 50%+ of competitors
    .sort((a, b) => b[1] - a[1])
    .map(([keyword, count]) => ({ keyword, frequency: count }));

  // Identify gaps if target URL provided
  let gaps = [];
  if (targetAnalysis) {
    const targetKeywords = new Set(targetAnalysis.keywords.map(k => k.keyword.toLowerCase()));
    
    gaps = commonKeywords
      .filter(({ keyword }) => !targetKeywords.has(keyword.toLowerCase()))
      .map(({ keyword }) => keyword);
  }

  return {
    averages: {
      wordCount: Math.round(avgWordCount),
      headings: Math.round(avgHeadings),
      images: Math.round(avgImages),
      internalLinks: Math.round(avgInternalLinks),
      externalLinks: Math.round(avgExternalLinks),
    },
    commonKeywords: commonKeywords,
    missingKeywords: gaps,
    contentLengthComparison: targetAnalysis ? {
      target: targetAnalysis.wordCount,
      average: Math.round(avgWordCount),
      difference: targetAnalysis.wordCount - avgWordCount,
      percentDiff: Math.round(((targetAnalysis.wordCount - avgWordCount) / avgWordCount) * 100),
    } : null,
  };
}

// Generate AI recommendations
async function generateRecommendations(keyword, competitors, targetAnalysis, gapAnalysis) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const competitorSummary = competitors.slice(0, 5).map((c, i) => 
      `${i + 1}. ${c.domain} - ${c.wordCount} words, ${c.headings.total} headings, Title: "${c.title}"`
    ).join('\n');

    const prompt = `You are an SEO expert analyzing SERP competition for the keyword: "${keyword}"

Top 5 Competitors:
${competitorSummary}

Average Metrics:
- Word Count: ${gapAnalysis.averages.wordCount}
- Headings: ${gapAnalysis.averages.headings}
- Images: ${gapAnalysis.averages.images}

Common Keywords: ${gapAnalysis.commonKeywords.slice(0, 10).map(k => k.keyword).join(', ')}

${targetAnalysis ? `Target URL Analysis:
- URL: ${targetAnalysis.url}
- Word Count: ${targetAnalysis.wordCount} (${gapAnalysis.contentLengthComparison.percentDiff > 0 ? '+' : ''}${gapAnalysis.contentLengthComparison.percentDiff}% vs avg)
- Headings: ${targetAnalysis.headings.total}
- Missing Keywords: ${gapAnalysis.missingKeywords.slice(0, 10).join(', ')}` : ''}

Provide actionable SEO recommendations in JSON format:
{
  "priority_actions": [
    {"action": "specific action", "impact": "high|medium|low", "reason": "why this matters"}
  ],
  "content_recommendations": [
    {"recommendation": "specific recommendation", "details": "how to implement"}
  ],
  "keyword_opportunities": [
    {"keyword": "keyword phrase", "reason": "why to target this"}
  ],
  "structural_improvements": [
    {"improvement": "specific improvement", "example": "how to do it"}
  ]
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      priority_actions: [],
      content_recommendations: [],
      keyword_opportunities: [],
      structural_improvements: [],
    };
  }
}

// Helper functions
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function extractHeadings(markdown) {
  const h1 = (markdown.match(/^# .+$/gm) || []).length;
  const h2 = (markdown.match(/^## .+$/gm) || []).length;
  const h3 = (markdown.match(/^### .+$/gm) || []).length;
  const h4 = (markdown.match(/^#### .+$/gm) || []).length;
  const h5 = (markdown.match(/^##### .+$/gm) || []).length;
  const h6 = (markdown.match(/^###### .+$/gm) || []).length;

  return {
    h1, h2, h3, h4, h5, h6,
    total: h1 + h2 + h3 + h4 + h5 + h6,
  };
}

function extractKeywords(content, targetKeyword) {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Remove common stop words
  const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'their', 'there', 'would', 'could', 'should']);
  
  return Object.entries(frequency)
    .filter(([word]) => !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

function extractImages(html) {
  const imgRegex = /<img[^>]+>/g;
  const images = html.match(imgRegex) || [];
  
  const withAlt = images.filter(img => /alt=["'][^"']*["']/.test(img)).length;
  
  return {
    total: images.length,
    withAlt: withAlt,
    withoutAlt: images.length - withAlt,
    altCoverage: images.length > 0 ? Math.round((withAlt / images.length) * 100) : 0,
  };
}

function extractLinks(html, baseUrl) {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }

  const baseDomain = new URL(baseUrl).hostname;
  const internal = links.filter(link => {
    try {
      return link.startsWith('/') || new URL(link).hostname === baseDomain;
    } catch {
      return link.startsWith('/');
    }
  }).length;

  return {
    total: links.length,
    internal: internal,
    external: links.length - internal,
  };
}

function analyzeContentStructure(markdown) {
  const paragraphs = markdown.split('\n\n').filter(p => p.trim().length > 0).length;
  const lists = (markdown.match(/^[\*\-\+] .+$/gm) || []).length;
  const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
  const blockquotes = (markdown.match(/^> .+$/gm) || []).length;

  return {
    paragraphs,
    lists,
    codeBlocks,
    blockquotes,
  };
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  return match ? match[1].trim() : null;
}
