/**
 * Content Ingestion API for Link Building
 * Crawls and analyzes site content, extracts metadata, and stores with semantic embeddings
 */

import { createClient } from '@supabase/supabase-js';
import Firecrawl from '@mendable/firecrawl-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract existing links from HTML content
 */
function extractExistingLinks(html) {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"\s*(?:[^>]*?\s+)?>(.*?)<\/a>/gi;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      anchor_text: match[2].replace(/<[^>]*>/g, ''), // Strip HTML tags
      type: match[1].startsWith('http') ? 'external' : 'internal'
    });
  }
  
  return links;
}

/**
 * Extract metadata from page content
 */
function extractMetadata(content, html) {
  // Extract headings
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, '')
    });
  }
  
  // Extract keywords (simple approach - top words by frequency)
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4); // Filter short words
  
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
  
  return {
    headings,
    keywords,
    word_count: words.length
  };
}

/**
 * Generate semantic embedding for content
 */
async function generateEmbedding(text) {
  try {
    // Truncate text to fit within token limits (8191 tokens for text-embedding-3-small)
    const maxChars = 30000; // Roughly 8000 tokens
    const truncatedText = text.substring(0, maxChars);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Crawl a single page
 */
async function crawlPage(url) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      timeout: 30000
    });
    
    if (!result.success) {
      throw new Error('Firecrawl scraping failed');
    }
    
    return {
      content: result.markdown || '',
      html: result.html || '',
      title: result.metadata?.title || '',
      success: true
    };
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process and store a single page
 */
async function processPage(userId, siteDomain, pageUrl) {
  try {
    // Crawl the page
    const crawlResult = await crawlPage(pageUrl);
    
    if (!crawlResult.success) {
      return {
        success: false,
        url: pageUrl,
        error: crawlResult.error
      };
    }
    
    // Extract metadata
    const metadata = extractMetadata(crawlResult.content, crawlResult.html);
    
    // Extract existing links
    const existingLinks = extractExistingLinks(crawlResult.html);
    
    // Generate semantic embedding
    const embedding = await generateEmbedding(crawlResult.content);
    
    // Store in database
    const { data, error } = await supabase
      .from('site_pages')
      .upsert({
        user_id: userId,
        site_domain: siteDomain,
        page_url: pageUrl,
        page_title: crawlResult.title,
        page_content: crawlResult.content,
        page_html: crawlResult.html,
        word_count: metadata.word_count,
        existing_links: existingLinks,
        metadata: metadata,
        embedding: embedding,
        last_scanned_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,page_url'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      url: pageUrl,
      page_id: data.id,
      word_count: metadata.word_count,
      existing_links_count: existingLinks.length
    };
  } catch (error) {
    console.error(`Error processing page ${pageUrl}:`, error);
    return {
      success: false,
      url: pageUrl,
      error: error.message
    };
  }
}

/**
 * Discover pages from sitemap
 */
async function discoverPagesFromSitemap(siteDomain) {
  try {
    const sitemapUrl = `https://${siteDomain}/sitemap.xml`;
    const response = await fetch(sitemapUrl);
    
    if (!response.ok) {
      throw new Error('Sitemap not found');
    }
    
    const xml = await response.text();
    
    // Extract URLs from sitemap (simple regex approach)
    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;
    
    while ((match = urlRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    
    return urls;
  } catch (error) {
    console.error('Error discovering pages from sitemap:', error);
    return [];
  }
}

/**
 * Main handler
 */
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
    const { userId, siteDomain, pages, scanType = 'full' } = req.body;
    
    // Validation
    if (!userId || !siteDomain) {
      return res.status(400).json({
        error: 'Missing required fields: userId, siteDomain'
      });
    }
    
    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('link_building_scans')
      .insert({
        user_id: userId,
        site_domain: siteDomain,
        scan_type: scanType,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (scanError) {
      throw scanError;
    }
    
    const scanId = scan.id;
    
    // Determine pages to crawl
    let pagesToCrawl = pages || [];
    
    if (scanType === 'full' && (!pages || pages.length === 0)) {
      // Discover pages from sitemap
      pagesToCrawl = await discoverPagesFromSitemap(siteDomain);
      
      if (pagesToCrawl.length === 0) {
        // Fallback to homepage only
        pagesToCrawl = [`https://${siteDomain}`];
      }
    }
    
    // Limit pages for initial scan (prevent abuse)
    const maxPages = 100;
    if (pagesToCrawl.length > maxPages) {
      pagesToCrawl = pagesToCrawl.slice(0, maxPages);
    }
    
    // Process pages
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const pageUrl of pagesToCrawl) {
      const result = await processPage(userId, siteDomain, pageUrl);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update scan record
    const completedAt = new Date();
    const durationSeconds = Math.floor((completedAt - new Date(scan.started_at)) / 1000);
    
    await supabase
      .from('link_building_scans')
      .update({
        status: 'completed',
        pages_scanned: successCount,
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', scanId);
    
    return res.status(200).json({
      success: true,
      scan_id: scanId,
      summary: {
        total_pages: pagesToCrawl.length,
        successful: successCount,
        failed: failureCount,
        duration_seconds: durationSeconds
      },
      results: results
    });
    
  } catch (error) {
    console.error('Content ingestion error:', error);
    return res.status(500).json({
      error: 'Content ingestion failed',
      details: error.message
    });
  }
}
