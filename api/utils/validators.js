// Validate URL format
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true, message: 'Password is strong' };
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate API key format
export function isValidApiKey(key, prefix = '') {
  if (!key || typeof key !== 'string') return false;
  if (prefix && !key.startsWith(prefix)) return false;
  return key.length >= 20;
}

// Rate limiting helper
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Filter out old requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
    };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
  };
}

// Validate request body
export function validateRequestBody(body, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!body[field]) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`,
    };
  }
  
  return { valid: true };
}

// Validate score range
export function isValidScore(score) {
  return typeof score === 'number' && score >= 0 && score <= 100;
}

// Clean and validate keyword
export function sanitizeKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') return '';
  
  return keyword
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .substring(0, 100);
}

// Validate pagination parameters
export function validatePagination(page, limit, maxLimit = 100) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
  
  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
}
