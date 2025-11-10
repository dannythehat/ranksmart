// Authentication module for RankSmart 2.0

const AUTH_TOKEN_KEY = 'ranksmart_auth_token';
const USER_DATA_KEY = 'ranksmart_user_data';

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
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

// Save auth data
export function saveAuthData(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

// Clear auth data
export function clearAuthData() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

// Login function
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save auth data
    saveAuthData(data.session.access_token, data.user);

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Signup function
export async function signup(email, password, fullName) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

// Logout function
export function logout() {
  clearAuthData();
  window.location.href = '/index.html';
}

// Verify token
export async function verifyToken() {
  const token = getAuthToken();
  
  if (!token) {
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

    const data = await response.json();

    if (!response.ok) {
      clearAuthData();
      return { valid: false };
    }

    return { valid: true, user: data.user };
  } catch (error) {
    console.error('Token verification error:', error);
    clearAuthData();
    return { valid: false };
  }
}

// Protect page (redirect to login if not authenticated)
export async function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = '/index.html';
    return false;
  }

  const { valid } = await verifyToken();
  
  if (!valid) {
    window.location.href = '/index.html';
    return false;
  }

  return true;
}

// Get authorization header
export function getAuthHeader() {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : '';
}

// API base URL - Updated with production Vercel deployment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://ranksmart-ep4vmbybn-rank-smart.vercel.app/api';
