import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ 
  apiKey: process.env.FIRECRAWL_API_KEY 
});

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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Scrape the page with Firecrawl
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'img', 'a'],
    });

    if (!scrapeResult.success) {
      return res.status(400).json({ 
        error: 'Failed to scrape URL',
        details: scrapeResult.error 
      });
    }

    // Extract key SEO elements
    const pageData = {
      url: url,
      title: scrapeResult.metadata?.title || '',
      description: scrapeResult.metadata?.description || '',
      content: scrapeResult.markdown || '',
      html: scrapeResult.html || '',
      wordCount: scrapeResult.markdown?.split(/\s+/).length || 0,
      headings: extractHeadings(scrapeResult.html || ''),
      images: scrapeResult.metadata?.images || [],
      links: extractLinks(scrapeResult.html || ''),
      metadata: scrapeResult.metadata || {},
      scrapedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: pageData,
    });

  } catch (error) {
    console.error('Scan error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper function to extract headings
function extractHeadings(html) {
  const headings = { h1: [], h2: [], h3: [] };
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi;

  let match;
  while ((match = h1Regex.exec(html)) !== null) {
    headings.h1.push(match[1].replace(/<[^>]*>/g, '').trim());
  }
  while ((match = h2Regex.exec(html)) !== null) {
    headings.h2.push(match[1].replace(/<[^>]*>/g, '').trim());
  }
  while ((match = h3Regex.exec(html)) !== null) {
    headings.h3.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  return headings;
}

// Helper function to extract links
function extractLinks(html) {
  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    });
  }

  return links;
}
