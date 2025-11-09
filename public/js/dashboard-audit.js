/**
 * Dashboard Audit Starter
 * Handles quick audit initiation from dashboard
 */

// Initialize audit starter
document.addEventListener('DOMContentLoaded', () => {
  setupAuditStarter();
  loadRecentAudits();
});

/**
 * Setup quick audit form
 */
function setupAuditStarter() {
  // Create audit modal/form if not exists
  const auditForm = document.getElementById('quick-audit-form');
  
  if (auditForm) {
    auditForm.addEventListener('submit', handleQuickAudit);
  }

  // Add click handlers to "New Audit" buttons
  const newAuditButtons = document.querySelectorAll('[data-action="new-audit"]');
  newAuditButtons.forEach(btn => {
    btn.addEventListener('click', showAuditModal);
  });
}

/**
 * Show audit modal
 */
function showAuditModal(e) {
  e.preventDefault();
  
  // Simple prompt for now (can be replaced with modal)
  const url = prompt('Enter URL to audit:');
  
  if (url) {
    startAudit(url);
  }
}

/**
 * Handle quick audit submission
 */
async function handleQuickAudit(e) {
  e.preventDefault();
  
  const urlInput = document.getElementById('audit-url-input');
  const url = urlInput?.value?.trim();
  
  if (!url) {
    showNotification('Please enter a URL', 'error');
    return;
  }

  startAudit(url);
}

/**
 * Start audit and redirect to results page
 */
function startAudit(url) {
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    showNotification('Please enter a valid URL (e.g., https://example.com)', 'error');
    return;
  }

  // Redirect to audit page with URL parameter
  window.location.href = `audit.html?url=${encodeURIComponent(url)}`;
}

/**
 * Load recent audits from localStorage or API
 */
async function loadRecentAudits() {
  const auditsContainer = document.getElementById('recent-audits-list');
  
  if (!auditsContainer) return;

  try {
    // For now, load from localStorage
    // In production, this would fetch from API
    const audits = JSON.parse(localStorage.getItem('auditHistory') || '[]');
    
    if (audits.length === 0) {
      auditsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #6b7280;">
          <p style="font-size: 1.1rem; margin-bottom: 1rem;">📊 No audits yet</p>
          <p>Run your first audit to see results here</p>
          <button onclick="showAuditModal(event)" class="btn btn-primary" style="margin-top: 1rem;">
            Start First Audit
          </button>
        </div>
      `;
      return;
    }

    // Render recent audits
    renderRecentAudits(audits.slice(0, 5));
    
  } catch (error) {
    console.error('Failed to load audits:', error);
  }
}

/**
 * Render recent audits table
 */
function renderRecentAudits(audits) {
  const tbody = document.querySelector('.audits-table tbody');
  
  if (!tbody) return;

  tbody.innerHTML = audits.map(audit => `
    <tr>
      <td>
        <div class="url-cell">
          <span class="url-title">${audit.page?.title || 'Untitled'}</span>
          <span class="url-link">${getDomain(audit.url)}</span>
        </div>
      </td>
      <td>
        <div class="score-badge ${getScoreBadgeClass(audit.overall?.score || 0)}">
          ${audit.overall?.score || 0}/100
        </div>
      </td>
      <td>
        <span class="badge ${getIssuesBadgeClass(audit.stats?.totalIssues || 0)}">
          ${audit.stats?.totalIssues || 0} Issues
        </span>
      </td>
      <td>${formatDate(audit.scannedAt)}</td>
      <td>
        <span class="badge badge-success">Complete</span>
      </td>
      <td>
        <button onclick="viewAudit('${audit.url}')" class="btn btn-small btn-outline">
          View Report
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * View audit report
 */
function viewAudit(url) {
  window.location.href = `audit.html?url=${encodeURIComponent(url)}`;
}

/**
 * Get domain from URL
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Get score badge class
 */
function getScoreBadgeClass(score) {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
}

/**
 * Get issues badge class
 */
function getIssuesBadgeClass(count) {
  if (count === 0) return 'badge-success';
  if (count <= 5) return 'badge-warning';
  return 'badge-error';
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
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
  
  return date.toLocaleDateString();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Simple alert for now (can be replaced with toast notification)
  alert(message);
}

/**
 * Save audit to history
 */
function saveAuditToHistory(auditData) {
  try {
    const history = JSON.parse(localStorage.getItem('auditHistory') || '[]');
    
    // Add to beginning of array
    history.unshift({
      ...auditData,
      savedAt: new Date().toISOString()
    });

    // Keep only last 50 audits
    const trimmedHistory = history.slice(0, 50);
    
    localStorage.setItem('auditHistory', JSON.stringify(trimmedHistory));
    
    // Reload recent audits display
    loadRecentAudits();
    
  } catch (error) {
    console.error('Failed to save audit:', error);
  }
}

// Export functions for use in other scripts
window.dashboardAudit = {
  startAudit,
  viewAudit,
  saveAuditToHistory,
  loadRecentAudits
};
