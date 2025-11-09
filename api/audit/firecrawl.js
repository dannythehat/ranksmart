/**
 * Firecrawl Integration for Page Scraping
 * Extracts content, metadata, and structure from URLs
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';
const TIMEOUT_MS = parseInt(process.env.FIRECRAWL_TIMEOUT || '30000');

/**
 * Scrape a single URL with Firecrawl
 */
async function scrapeUrl(url) {
  try {
    // Validate API key
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Check for supported protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are supported');
    }

    console.log(`Scraping URL: ${url}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'rawHtml'],
        onlyMainContent: true,
        includeTags: ['meta', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'p'],
        waitFor: 2000, // Wait for dynamic content
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        `Firecrawl API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from Firecrawl API');
    }

    // Extract and validate content
    const markdown = data.markdown || '';
    const html = data.html || '';
    const rawHtml = data.rawHtml || '';

    // Check if we got any content
    if (!markdown && !html && !rawHtml) {
      throw new Error('No content extracted from URL');
    }

    // Extract structured data
    const links = extractLinks(html, parsedUrl.hostname);
    const images = extractImages(html);
    const headings = extractHeadings(html);
    const wordCount = countWords(markdown);
    const readingTime = calculateReadingTime(markdown);

    return {
      success: true,
      data: {
        url: data.url || url,
        title: data.metadata?.title || extractTitleFromHtml(html) || '',
        description: data.metadata?.description || '',
        keywords: data.metadata?.keywords || '',
        ogImage: data.metadata?.ogImage || '',
        markdown,
        html,
        rawHtml,
        metadata: data.metadata || {},
        links,
        images,
        headings,
        wordCount,
        readingTime,
        hasContent: wordCount > 0,
        contentQuality: assessContentQuality(wordCount, headings, images, links),
      },
    };
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Request timeout after ${TIMEOUT_MS / 1000} seconds`,
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Scrape multiple URLs in batch
 */
async function scrapeMultiple(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('URLs must be a non-empty array');
  }

  const results = await Promise.allSettled(
    urls.map(url => scrapeUrl(url))
  );

  return results.map((result, index) => ({
    url: urls[index],
    ...(result.status === 'fulfilled' ? result.value : { 
      success: false, 
      error: result.reason?.message || 'Unknown error' 
    }),
  }));
}

/**
 * Extract all links from HTML
 */
function extractLinks(html, hostname) {
  if (!html) return [];

  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();

    // Skip empty links and anchors
    if (!url || url === '#' || url.startsWith('javascript:')) continue;

    try {
      const isInternal = !url.startsWith('http') || 
                        (url.includes('://') && url.includes(hostname));

      links.push({
        url,
        text: text || url,
        isInternal,
        isEmpty: !text || text.length === 0,
      });
    } catch {
      // Skip invalid URLs
      continue;
    }
  }

  return links;
}

/**
 * Extract all images from HTML
 */
function extractImages(html) {
  if (!html) return [];

  const imgRegex = /<img[^>]*>/gi;
  const images = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);

    if (srcMatch) {
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : '';

      images.push({
        src,
        alt,
        hasAlt: alt.length > 0,
        isGeneric: isGenericAlt(alt),
      });
    }
  }

  return images;
}

/**
 * Extract heading structure from HTML
 */
function extractHeadings(html) {
  if (!html) return [];

  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1].substring(1));
    const text = match[2].replace(/<[^>]*>/g, '').trim();

    headings.push({
      level,
      text,
      isEmpty: !text || text.length === 0,
    });
  }

  return headings;
}

/**
 * Count words in markdown content
 */
function countWords(markdown) {
  if (!markdown) return 0;
  return markdown.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate reading time (avg 200 words per minute)
 */
function calculateReadingTime(markdown) {
  const words = countWords(markdown);
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Extract title from HTML if not in metadata
 */
function extractTitleFromHtml(html) {
  if (!html) return '';
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

/**
 * Check if alt text is generic
 */
function isGenericAlt(alt) {
  if (!alt) return false;
  const generic = ['image', 'img', 'photo', 'picture', 'icon', 'logo'];
  const lowerAlt = alt.toLowerCase();
  return generic.some(word => lowerAlt === word || lowerAlt.includes(word + ' '));
}

/**
 * Assess overall content quality
 */
function assessContentQuality(wordCount, headings, images, links) {
  let score = 0;
  
  // Word count (0-40 points)
  if (wordCount >= 2000) score += 40;
  else if (wordCount >= 1000) score += 30;
  else if (wordCount >= 500) score += 20;
  else if (wordCount >= 300) score += 10;

  // Heading structure (0-20 points)
  if (headings.length >= 5) score += 20;
  else if (headings.length >= 3) score += 15;
  else if (headings.length >= 1) score += 10;

  // Images (0-20 points)
  const imagesWithAlt = images.filter(img => img.hasAlt).length;
  if (imagesWithAlt >= 5) score += 20;
  else if (imagesWithAlt >= 3) score += 15;
  else if (imagesWithAlt >= 1) score += 10;

  // Links (0-20 points)
  const internalLinks = links.filter(link => link.isInternal).length;
  if (internalLinks >= 10) score += 20;
  else if (internalLinks >= 5) score += 15;
  else if (internalLinks >= 2) score += 10;

  return {
    score,
    grade: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
  };
}

module.exports = {
  scrapeUrl,
  scrapeMultiple,
  extractLinks,
  extractImages,
  extractHeadings,
  countWords,
  calculateReadingTime,
};
