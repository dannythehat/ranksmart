/**
 * RankSmart 2.0 - Dashboard
 * Dashboard-specific functionality with real database integration
 */

// API Configuration
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://ranksmart-ep4vmbybn-rank-smart.vercel.app/api';

// Dashboard state
const dashboardState = {
    stats: {
        totalAudits: 0,
        avgScore: 0,
        issuesFixed: 0,
        scansRemaining: 0,
        scansLimit: 50
    },
    recentAudits: [],
    loading: false
};

/**
 * Initialize dashboard
 */
function initDashboard() {
    console.log('Dashboard initialized');
    
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-refresh
    startAutoRefresh();
}

/**
 * Load dashboard data from API
 */
async function loadDashboardData() {
    try {
        dashboardState.loading = true;
        showLoadingState();
        
        const token = localStorage.getItem('auth_token');
        
        // Fetch audit history
        const response = await fetch(`${API_BASE}/history/list?limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update stats
            dashboardState.stats = {
                totalAudits: data.summary.total_audits,
                avgScore: data.summary.average_score,
                issuesFixed: 0, // TODO: Track fixed issues
                scansRemaining: dashboardState.stats.scansLimit - data.summary.total_audits,
                scansLimit: dashboardState.stats.scansLimit
            };
            
            // Update recent audits
            dashboardState.recentAudits = data.audits;
            
            // Update UI
            updateStats(dashboardState.stats);
            updateRecentAudits(dashboardState.recentAudits);
            updateScoreDistribution(data.summary.score_distribution);
        }
        
        dashboardState.loading = false;
        hideLoadingState();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
        dashboardState.loading = false;
        hideLoadingState();
    }
}

/**
 * Update stats display
 */
function updateStats(stats) {
    // Update stat values
    const statElements = {
        totalAudits: document.querySelector('[data-stat=\"totalAudits\"]'),
        avgScore: document.querySelector('[data-stat=\"avgScore\"]'),
        issuesFixed: document.querySelector('[data-stat=\"issuesFixed\"]'),
        scansRemaining: document.querySelector('[data-stat=\"scansRemaining\"]')
    };
    
    // Animate numbers
    Object.keys(stats).forEach(key => {
        if (statElements[key]) {
            animateNumber(statElements[key], stats[key]);
        }
    });
}

/**
 * Update recent audits list
 */
function updateRecentAudits(audits) {
    const container = document.querySelector('[data-recent-audits]');
    if (!container) return;
    
    if (audits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No audits yet. Start your first audit!</p>
                <button onclick="handleNewAudit(event)" class="btn btn-primary">
                    New Audit
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = audits.map(audit => `
        <div class="audit-card" data-audit-id="${audit.id}">
            <div class="audit-header">
                <h3>${audit.title || 'Untitled'}</h3>
                <span class="score-badge score-${getScoreClass(audit.overall_score)}">
                    ${audit.overall_score}/100
                </span>
            </div>
            <div class="audit-meta">
                <span class="url">${truncateUrl(audit.url)}</span>
                <span class="date">${formatDate(audit.created_at)}</span>
            </div>
            <div class="audit-scores">
                <div class="score-item">
                    <span class="label">E-E-A-T</span>
                    <span class="value">${audit.eeat_score || 'N/A'}</span>
                </div>
                <div class="score-item">
                    <span class="label">Technical</span>
                    <span class="value">${audit.technical_score || 'N/A'}</span>
                </div>
                <div class="score-item">
                    <span class="label">Words</span>
                    <span class="value">${audit.word_count || 0}</span>
                </div>
            </div>
            <div class="audit-actions">
                <button onclick="viewAudit('${audit.id}')" class="btn btn-sm btn-primary">
                    View Report
                </button>
                <button onclick="deleteAudit('${audit.id}')" class="btn btn-sm btn-danger">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Update score distribution chart
 */
function updateScoreDistribution(distribution) {
    const container = document.querySelector('[data-score-distribution]');
    if (!container) return;
    
    const total = distribution.excellent + distribution.good + distribution.fair + distribution.poor;
    
    if (total === 0) return;
    
    const percentages = {
        excellent: Math.round((distribution.excellent / total) * 100),
        good: Math.round((distribution.good / total) * 100),
        fair: Math.round((distribution.fair / total) * 100),
        poor: Math.round((distribution.poor / total) * 100)
    };
    
    container.innerHTML = `
        <div class="distribution-bar">
            <div class="bar-segment excellent" style="width: ${percentages.excellent}%"></div>
            <div class="bar-segment good" style="width: ${percentages.good}%"></div>
            <div class="bar-segment fair" style="width: ${percentages.fair}%"></div>
            <div class="bar-segment poor" style="width: ${percentages.poor}%"></div>
        </div>
        <div class="distribution-legend">
            <div class="legend-item">
                <span class="dot excellent"></span>
                <span>Excellent (${distribution.excellent})</span>
            </div>
            <div class="legend-item">
                <span class="dot good"></span>
                <span>Good (${distribution.good})</span>
            </div>
            <div class="legend-item">
                <span class="dot fair"></span>
                <span>Fair (${distribution.fair})</span>
            </div>
            <div class="legend-item">
                <span class="dot poor"></span>
                <span>Poor (${distribution.poor})</span>
            </div>
        </div>
    `;
}

/**
 * View audit details
 */
async function viewAudit(auditId) {
    window.location.href = `audit.html?id=${auditId}`;
}

/**
 * Delete audit
 */
async function deleteAudit(auditId) {
    if (!confirm('Are you sure you want to delete this audit?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_BASE}/history/delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audit_id: auditId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Audit deleted successfully', 'success');
            loadDashboardData(); // Reload dashboard
        } else {
            throw new Error(data.message || 'Failed to delete audit');
        }
        
    } catch (error) {
        console.error('Delete audit error:', error);
        showToast('Failed to delete audit', 'error');
    }
}

/**
 * Animate number counting
 */
function animateNumber(element, target) {
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // New Audit button
    const newAuditBtn = document.querySelector('[data-action=\"newAudit\"]');
    if (newAuditBtn) {
        newAuditBtn.addEventListener('click', handleNewAudit);
    }
    
    // Quick audit form
    const quickAuditForm = document.getElementById('quickAuditForm');
    if (quickAuditForm) {
        quickAuditForm.addEventListener('submit', handleQuickAudit);
    }
}

/**
 * Handle quick audit from dashboard
 */
function handleQuickAudit(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('quickAuditUrl');
    const url = urlInput?.value?.trim();
    
    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    
    // Redirect to audit page with URL
    window.location.href = `audit.html?url=${encodeURIComponent(url)}`;
}

/**
 * Handle new audit
 */
function handleNewAudit(e) {
    e.preventDefault();
    window.location.href = 'audit.html';
}

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
    // Refresh dashboard data every 5 minutes
    setInterval(() => {
        if (!dashboardState.loading) {
            loadDashboardData();
        }
    }, 5 * 60 * 1000);
}

/**
 * Show loading state
 */
function showLoadingState() {
    const container = document.querySelector('[data-recent-audits]');
    if (container) {
        container.innerHTML = '<div class="loading">Loading...</div>';
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state is replaced by actual content
}

/**
 * Helper: Get score class
 */
function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
}

/**
 * Helper: Truncate URL
 */
function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Make functions globally available
window.viewAudit = viewAudit;
window.deleteAudit = deleteAudit;
window.handleNewAudit = handleNewAudit;
