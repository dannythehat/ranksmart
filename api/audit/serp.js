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
    const { keyword, targetUrl } = req.body;

    if (!keyword) {
      return res.status(400).json({ 
        error: 'Keyword is required' 
      });
    }

    // Search Google for the keyword
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=10`;
    
    // Use Firecrawl to get search results
    const searchResult = await firecrawl.scrapeUrl(searchUrl, {
      formats: ['markdown'],
      onlyMainContent: false,
    });

    if (!searchResult.success) {
      return res.status(400).json({ 
        error: 'Failed to fetch SERP data' 
      });
    }

    // Extract top 10 URLs from search results
    const topUrls = extractSearchUrls(searchResult.markdown || '', 10);

    // Analyze competitors with AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze these top 10 Google search results for the keyword "${keyword}":

${topUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

${targetUrl ? `Target URL to compare: ${targetUrl}` : ''}

Provide a competitive analysis in JSON format:
{
  "keyword": "${keyword}",
  "top_competitors": [
    {
      "rank": 1,
      "url": "url",
      "domain": "domain.com",
      "strengths": ["strength1", "strength2"],
      "content_type": "blog|product|guide|review"
    }
  ],
  "common_patterns": ["pattern1", "pattern2"],
  "content_gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"],
  ${targetUrl ? `"target_position": <estimated rank or "not ranking">,` : ''}
  ${targetUrl ? `"target_improvements": ["improvement1", "improvement2"],` : ''}
  "serp_features": ["featured_snippet", "people_also_ask", "images", "videos"]
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let analysis;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        rawResponse: text 
      });
    }

    return res.status(200).json({
      success: true,
      serp: {
        keyword: keyword,
        topUrls: topUrls,
        analysis: analysis,
        analyzedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('SERP analysis error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper to extract URLs from search results
function extractSearchUrls(markdown, limit = 10) {
  const urls = [];
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const matches = markdown.match(urlRegex) || [];

  // Filter out Google's own URLs and duplicates
  const seen = new Set();
  for (const url of matches) {
    if (urls.length >= limit) break;
    
    // Skip Google URLs
    if (url.includes('google.com') || url.includes('gstatic.com')) continue;
    
    // Clean URL
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    if (!seen.has(cleanUrl)) {
      seen.add(cleanUrl);
      urls.push(cleanUrl);
    }
  }

  return urls;
}
