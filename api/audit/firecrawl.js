/**
 * Firecrawl Integration for Page Scraping
 * Extracts content, metadata, and structure from URLs
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';

/**
 * Scrape a single URL with Firecrawl
 */
async function scrapeUrl(url) {
  try {
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
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        url: data.url,
        title: data.metadata?.title || '',
        description: data.metadata?.description || '',
        keywords: data.metadata?.keywords || '',
        ogImage: data.metadata?.ogImage || '',
        markdown: data.markdown || '',
        html: data.html || '',
        rawHtml: data.rawHtml || '',
        metadata: data.metadata || {},
        links: extractLinks(data.html || ''),
        images: extractImages(data.html || ''),
        headings: extractHeadings(data.html || ''),
        wordCount: countWords(data.markdown || ''),
        readingTime: calculateReadingTime(data.markdown || ''),
      },
    };
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Scrape multiple URLs in batch
 */
async function scrapeMultiple(urls) {
  const results = await Promise.allSettled(
    urls.map(url => scrapeUrl(url))
  );

  return results.map((result, index) => ({
    url: urls[index],
    ...(result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }),
  }));
}

/**
 * Extract all links from HTML
 */
function extractLinks(html) {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      text: match[2].replace(/<[^>]*>/g, '').trim(),
      isInternal: !match[1].startsWith('http') || match[1].includes(new URL(html).hostname),
    });
  }

  return links;
}

/**
 * Extract all images from HTML
 */
function extractImages(html) {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
  const images = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    images.push({
      src: match[1],
      alt: match[2],
      hasAlt: match[2].length > 0,
    });
  }

  return images;
}

/**
 * Extract heading structure from HTML
 */
function extractHeadings(html) {
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1].substring(1)),
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    });
  }

  return headings;
}

/**
 * Count words in markdown content
 */
function countWords(markdown) {
  return markdown.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate reading time (avg 200 words per minute)
 */
function calculateReadingTime(markdown) {
  const words = countWords(markdown);
  return Math.ceil(words / 200);
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
