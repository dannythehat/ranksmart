/**
 * Domain Detection Utility
 * Identifies whether a URL is internal (user's own site) or external (competitor)
 */

/**
 * Check if a URL belongs to user's domains
 * @param {string} url - URL to check
 * @param {string[]} userDomains - Array of user's domains
 * @returns {boolean} - True if internal, false if external
 */
export function isInternalUrl(url, userDomains = []) {
  if (!url || !Array.isArray(userDomains) || userDomains.length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const urlHostname = urlObj.hostname.toLowerCase();

    // Check against each user domain
    return userDomains.some(domain => {
      const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
      const cleanHostname = urlHostname.replace(/^www\./, '');

      // Exact match or subdomain match
      return cleanHostname === cleanDomain || cleanHostname.endsWith(`.${cleanDomain}`);
    });
  } catch (error) {
    console.error('[DOMAIN-DETECTOR] Invalid URL:', url, error.message);
    return false;
  }
}

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} - Domain or null if invalid
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    console.error('[DOMAIN-DETECTOR] Invalid URL:', url, error.message);
    return null;
  }
}

/**
 * Validate and normalize domain
 * @param {string} domain - Domain to validate
 * @returns {string|null} - Normalized domain or null if invalid
 */
export function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return null;
  }

  try {
    // Remove protocol if present
    let cleanDomain = domain.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    cleanDomain = cleanDomain.replace(/\/$/, '');
    
    // Remove www prefix
    cleanDomain = cleanDomain.replace(/^www\./, '');
    
    // Remove path if present
    cleanDomain = cleanDomain.split('/')[0];
    
    // Basic domain validation (contains at least one dot)
    if (!cleanDomain.includes('.')) {
      return null;
    }

    return cleanDomain.toLowerCase();
  } catch (error) {
    console.error('[DOMAIN-DETECTOR] Invalid domain:', domain, error.message);
    return null;
  }
}

/**
 * Get domain type label for UI
 * @param {string} url - URL to check
 * @param {string[]} userDomains - Array of user's domains
 * @returns {object} - Domain type info
 */
export function getDomainType(url, userDomains = []) {
  const isInternal = isInternalUrl(url, userDomains);
  const domain = extractDomain(url);

  return {
    isInternal,
    domain,
    label: isInternal ? 'Internal' : 'External',
    badge: isInternal ? 'success' : 'info',
    description: isInternal 
      ? 'Your own content - surgical fixes only'
      : 'Competitor content - full analysis',
    mode: isInternal ? 'mode2' : 'mode1',
    modeName: isInternal ? 'Self-Audit & Fixes' : 'Competitor Analysis'
  };
}

/**
 * Auto-detect user domain from URL
 * Useful for first-time users
 * @param {string} url - URL to extract domain from
 * @returns {string|null} - Detected domain or null
 */
export function autoDetectUserDomain(url) {
  const domain = extractDomain(url);
  
  if (!domain) {
    return null;
  }

  console.log('[DOMAIN-DETECTOR] Auto-detected domain:', domain);
  return domain;
}

/**
 * Validate array of domains
 * @param {string[]} domains - Array of domains to validate
 * @returns {object} - Validation result
 */
export function validateDomains(domains) {
  if (!Array.isArray(domains)) {
    return {
      valid: false,
      error: 'Domains must be an array',
      validDomains: []
    };
  }

  const validDomains = [];
  const invalidDomains = [];

  domains.forEach(domain => {
    const normalized = normalizeDomain(domain);
    if (normalized) {
      validDomains.push(normalized);
    } else {
      invalidDomains.push(domain);
    }
  });

  return {
    valid: invalidDomains.length === 0,
    validDomains,
    invalidDomains,
    error: invalidDomains.length > 0 
      ? `Invalid domains: ${invalidDomains.join(', ')}`
      : null
  };
}
