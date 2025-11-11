// Authentication module for RankSmart 2.0
// Fixed: Proper API integration, error handling, and session management

const AUTH_TOKEN_KEY = 'ranksmart_auth_token';
const USER_DATA_KEY = 'ranksmart_user_data';
const TOKEN_EXPIRY_KEY = 'ranksmart_token_expiry';

// API base URL - Use relative paths for Vercel deployment
const API_BASE_URL = '/api';

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token) return false;
  
  // Check if token is expired
  if (expiry && new Date().getTime() > parseInt(expiry)) {
    clearAuthData();
    return false;
  }
  
  return true;
}

// Get auth token
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Get user data
export function getUserData() {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
}

// Save auth data with expiry
export function saveAuthData(token, user, expiresIn = 3600) {
  const expiryTime = new Date().getTime() + (expiresIn * 1000);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

// Clear auth data
export function clearAuthData() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// Login function with improved error handling
export async function login(email, password) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { 
        success: false, 
        error: 'Email and password are required' 
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        success: false, 
        error: 'Please enter a valid email address' 
      };
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Invalid email or password' 
        };
      }
      if (response.status === 429) {
        return { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        };
      }
      throw new Error(data.error || 'Login failed');
    }

    // Save auth data with session expiry
    const expiresIn = data.session?.expires_in || 3600;
    saveAuthData(data.session.access_token, data.user, expiresIn);

    console.log('✅ Login successful:', data.user.email);
    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Network error. Please check your connection and try again.' 
    };
  }
}

// Signup function with improved validation
export async function signup(email, password, fullName) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { 
        success: false, 
        error: 'Email and password are required' 
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        success: false, 
        error: 'Please enter a valid email address' 
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      };
    }

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 400 && data.error?.includes('already registered')) {
        return { 
          success: false, 
          error: 'This email is already registered. Please login instead.' 
        };
      }
      throw new Error(data.error || 'Signup failed');
    }

    console.log('✅ Signup successful:', email);
    return { 
      success: true, 
      message: data.message || 'Account created successfully! Please check your email to verify.' 
    };
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    return { 
      success: false, 
      error: error.message || 'Network error. Please check your connection and try again.' 
    };
  }
}

// Logout function
export function logout() {
  console.log('🚪 Logging out user');
  clearAuthData();
  window.location.href = '/index.html';
}

// Verify token with backend
export async function verifyToken() {
  const token = getAuthToken();
  
  if (!token) {
    return { valid: false };
  }

  // Check local expiry first
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiry && new Date().getTime() > parseInt(expiry)) {
    clearAuthData();
    return { valid: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuthData();
      return { valid: false };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    clearAuthData();
    return { valid: false };
  }
}

// Protect page (redirect to login if not authenticated)
export async function protectPage() {
  // Quick check for token
  if (!isAuthenticated()) {
    console.log('🔒 No valid session, redirecting to login');
    window.location.href = '/index.html';
    return false;
  }

  // Verify token with backend
  const { valid } = await verifyToken();
  
  if (!valid) {
    console.log('🔒 Invalid session, redirecting to login');
    window.location.href = '/index.html';
    return false;
  }

  console.log('✅ Page access granted');
  return true;
}

// Get authorization header
export function getAuthHeader() {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : '';
}

// Refresh token (if needed)
export async function refreshToken() {
  const token = getAuthToken();
  
  if (!token) {
    return { success: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuthData();
      return { success: false };
    }

    const data = await response.json();
    const expiresIn = data.session?.expires_in || 3600;
    saveAuthData(data.session.access_token, data.user, expiresIn);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return { success: false };
  }
}

// Initialize auth on page load
export function initAuth() {
  // Check if token is about to expire (within 5 minutes)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiry) {
    const timeUntilExpiry = parseInt(expiry) - new Date().getTime();
    if (timeUntilExpiry > 0 && timeUntilExpiry < 300000) { // 5 minutes
      console.log('🔄 Token expiring soon, refreshing...');
      refreshToken();
    }
  }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initAuth();
}
