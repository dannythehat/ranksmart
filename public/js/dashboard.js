/**
 * RankSmart 2.0 - Dashboard
 * Dashboard-specific functionality
 */

// Dashboard state
const dashboardState = {
    stats: {
        totalAudits: 24,
        avgScore: 87,
        issuesFixed: 156,
        scansRemaining: 176,
        scansLimit: 200
    },
    recentAudits: [],
    loading: false
};

/**
 * Initialize dashboard
 */
function initDashboard() {
    console.log('Dashboard initialized');
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-refresh
    startAutoRefresh();
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        dashboardState.loading = true;
        
        // TODO: Replace with actual API calls
        // const stats = await API.getStats();
        // const audits = await API.getRecentAudits();
        
        // For now, use mock data
        updateStats(dashboardState.stats);
        
        dashboardState.loading = false;
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        RankSmart.utils.showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Update stats display
 */
function updateStats(stats) {
    // Update stat values
    const statElements = {
        totalAudits: document.querySelector('[data-stat="totalAudits"]'),
        avgScore: document.querySelector('[data-stat="avgScore"]'),
        issuesFixed: document.querySelector('[data-stat="issuesFixed"]'),
        scansRemaining: document.querySelector('[data-stat="scansRemaining"]')
    };
    
    // Animate numbers
    Object.keys(stats).forEach(key => {
        if (statElements[key]) {
            animateNumber(statElements[key], stats[key]);
        }
    });
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
    const newAuditBtn = document.querySelector('[data-action="newAudit"]');
    if (newAuditBtn) {
        newAuditBtn.addEventListener('click', handleNewAudit);
    }
    
    // View Report buttons
    const viewReportBtns = document.querySelectorAll('[data-action="viewReport"]');
    viewReportBtns.forEach(btn => {
        btn.addEventListener('click', handleViewReport);
    });
    
    // Continue buttons
    const continueBtns = document.querySelectorAll('[data-action="continue"]');
    continueBtns.forEach(btn => {
        btn.addEventListener('click', handleContinue);
    });
    
    // Fix Issues buttons
    const fixIssuesBtns = document.querySelectorAll('[data-action="fixIssues"]');
    fixIssuesBtns.forEach(btn => {
        btn.addEventListener('click', handleFixIssues);
    });
}

/**
 * Handle new audit
 */
function handleNewAudit(e) {
    e.preventDefault();
    window.location.href = 'audit.html';
}

/**
 * Handle view report
 */
function handleViewReport(e) {
    e.preventDefault();
    const auditId = e.target.dataset.auditId;
    window.location.href = `audit.html?id=${auditId}`;
}

/**
 * Handle continue
 */
function handleContinue(e) {
    e.preventDefault();
    const auditId = e.target.dataset.auditId;
    window.location.href = `optimize.html?id=${auditId}`;
}

/**
 * Handle fix issues
 */
function handleFixIssues(e) {
    e.preventDefault();
    const auditId = e.target.dataset.auditId;
    window.location.href = `optimize.html?id=${auditId}&mode=fix`;
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
 * Export dashboard data
 */
function exportDashboardData() {
    const data = {
        stats: dashboardState.stats,
        audits: dashboardState.recentAudits,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranksmart-dashboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    RankSmart.utils.showToast('Dashboard data exported', 'success');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);

// Export functions
window.Dashboard = {
    state: dashboardState,
    loadData: loadDashboardData,
    exportData: exportDashboardData
};