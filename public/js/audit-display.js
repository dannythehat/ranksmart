/**
 * Audit Display Logic
 * Handles displaying audit results and integrating with history
 */

let currentAuditData = null;

/**
 * Initialize audit display
 */
function initAuditDisplay() {
  // Get URL from query params
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    showError('No URL provided. Please start an audit from the dashboard.');
  } else {
    runAudit(targetUrl);
  }

  // Setup export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportOptions);
  }
}

/**
 * Run audit
 */
async function runAudit(url) {
  try {
    console.log('🔍 Starting audit for:', url);
    
    // Call the audit API
    const response = await fetch('/api/audit/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Audit failed');
    }

    console.log('✅ Audit complete:', result.data);
    
    // Store current audit data
    currentAuditData = result.data;
    
    // Display results
    displayResults(result.data);
    
    // Save to history
    if (window.auditHistory) {
      window.auditHistory.save(result.data);
      console.log('💾 Audit saved to history');
    }
    
  } catch (error) {
    console.error('❌ Audit error:', error);
    showError(error.message || 'Failed to analyze the page. Please try again.');
  }
}

/**
 * Display audit results
 */
function displayResults(data) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('auditResults').style.display = 'block';

  // Overall score
  const score = data.overall.score;
  document.getElementById('overallScore').textContent = score;
  document.getElementById('overallGrade').textContent = data.overall.grade;
  document.getElementById('scoreStatus').textContent = data.overall.status.replace('-', ' ').toUpperCase();
  animateScoreCircle(score);

  // Page info
  document.getElementById('pageTitle').textContent = data.page.title;
  document.getElementById('pageUrl').textContent = data.url;

  // Stats
  document.getElementById('totalIssues').textContent = data.stats.totalIssues;
  document.getElementById('criticalIssues').textContent = data.stats.criticalIssues;
  document.getElementById('wordCount').textContent = data.page.wordCount.toLocaleString();
  document.getElementById('readingTime').textContent = data.page.readingTime + ' min';

  // E-E-A-T Breakdown
  renderScoreBreakdown('eeatBreakdown', data.eeat.breakdown);

  // Technical SEO Breakdown
  renderScoreBreakdown('technicalBreakdown', data.technicalSEO.breakdown);

  // Issues
  renderIssues(data.technicalSEO.issuesByPriority);

  // E-E-A-T Recommendations
  renderRecommendations(data.eeat.recommendations);
}

/**
 * Animate score circle
 */
function animateScoreCircle(score) {
  const circle = document.getElementById('scoreCircle');
  const circumference = 502.65;
  const offset = circumference - (score / 100) * circumference;
  
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);
}

/**
 * Render score breakdown
 */
function renderScoreBreakdown(containerId, breakdown) {
  const container = document.getElementById(containerId);
  let html = '';

  for (const [key, value] of Object.entries(breakdown)) {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const scoreClass = getScoreClass(value);
    
    html += `
      <div class="score-bar-item">
        <div class="score-bar-header">
          <span class="score-bar-label">${label}</span>
          <span class="score-bar-value">${value}/100</span>
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill ${scoreClass}" style="width: ${value}%"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Render issues by priority
 */
function renderIssues(issuesByPriority) {
  const container = document.getElementById('issuesList');
  let html = '';

  const priorities = [
    { key: 'P0', label: 'Critical Issues', icon: '🔴', class: 'critical' },
    { key: 'P1', label: 'Important Issues', icon: '🟡', class: 'important' },
    { key: 'P2', label: 'Minor Issues', icon: '🟢', class: 'minor' }
  ];

  priorities.forEach(priority => {
    const issues = issuesByPriority[priority.key] || [];
    if (issues.length > 0) {
      html += `
        <div class="priority-group">
          <div class="priority-header">
            <span class="priority-icon">${priority.icon}</span>
            <span class="priority-title">${priority.label}</span>
            <span class="priority-count">${issues.length}</span>
          </div>
      `;

      issues.forEach(issue => {
        html += `
          <div class="issue-card ${priority.class}">
            <div class="issue-title">${issue.issue}</div>
            <div class="issue-description">${issue.description || ''}</div>
            ${issue.recommendation ? `
              <div class="issue-recommendation">
                <strong>💡 Fix:</strong> ${issue.recommendation}
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }
  });

  if (html === '') {
    html = '<p style="color: #10b981; text-align: center; padding: 2rem;">🎉 No issues found! Your page is well optimized.</p>';
  }

  container.innerHTML = html;
}

/**
 * Render E-E-A-T recommendations
 */
function renderRecommendations(recommendations) {
  const container = document.getElementById('eeatRecommendations');
  
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = '<p style="color: #10b981; text-align: center; padding: 2rem;">✅ Your E-E-A-T signals are strong!</p>';
    return;
  }

  let html = '';
  recommendations.forEach(rec => {
    const priorityClass = rec.priority === 'high' ? 'high-priority' : 
                        rec.priority === 'medium' ? 'medium-priority' : '';
    html += `
      <div class="recommendation-card ${priorityClass}">
        <div style="font-weight: 600; margin-bottom: 0.5rem;">${rec.title || rec.recommendation}</div>
        <div style="color: #6b7280; font-size: 0.9rem;">${rec.description || ''}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Get score class
 */
function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

/**
 * Show error
 */
function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
}

/**
 * Show export options
 */
function showExportOptions() {
  if (!currentAuditData) {
    alert('No audit data to export');
    return;
  }

  const choice = confirm('Export as JSON? (Cancel for CSV)');
  
  if (choice) {
    // Export as JSON
    if (window.auditHistory) {
      window.auditHistory.exportJSON(currentAuditData);
    }
  } else {
    // Export as CSV
    if (window.auditHistory) {
      window.auditHistory.exportCSV(currentAuditData);
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuditDisplay);
} else {
  initAuditDisplay();
}

// Export for use in other scripts
window.auditDisplay = {
  runAudit,
  displayResults,
  showError,
  getCurrentAudit: () => currentAuditData
};
