/**
 * RankSmart - SEO Audit Results Display
 * Handles displaying audit results from the scan API
 */

// Get URL parameter
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Animate score circle
function animateScoreCircle(score) {
  const circle = document.getElementById('scoreCircle');
  const circumference = 502.65;
  const offset = circumference - (score / 100) * circumference;
  
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);
}

// Animate score number
function animateScoreNumber(targetScore) {
  const element = document.getElementById('overallScore');
  let current = 0;
  const increment = targetScore / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= targetScore) {
      current = targetScore;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 20);
}

// Get score color class
function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

// Render E-E-A-T breakdown
function renderEEATBreakdown(eeat) {
  const container = document.getElementById('eeatBreakdown');
  const breakdown = eeat.breakdown;
  
  const items = [
    { label: 'Experience', value: breakdown.experience, key: 'experience' },
    { label: 'Expertise', value: breakdown.expertise, key: 'expertise' },
    { label: 'Authoritativeness', value: breakdown.authoritativeness, key: 'authoritativeness' },
    { label: 'Trustworthiness', value: breakdown.trustworthiness, key: 'trustworthiness' }
  ];
  
  let html = '';
  items.forEach(item => {
    html += `
      <div class="score-bar-item">
        <div class="score-bar-header">
          <span class="score-bar-label">${item.label}</span>
          <span class="score-bar-value">${item.value}/100</span>
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill ${getScoreClass(item.value)}" 
               style="width: ${item.value}%"></div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Render Technical SEO breakdown
function renderTechnicalBreakdown(technical) {
  const container = document.getElementById('technicalBreakdown');
  const breakdown = technical.breakdown || {};
  
  const items = [
    { label: 'Meta Tags', value: breakdown.metaTags || 0 },
    { label: 'Headings', value: breakdown.headings || 0 },
    { label: 'Images', value: breakdown.images || 0 },
    { label: 'Internal Links', value: breakdown.internalLinks || 0 },
    { label: 'Content Quality', value: breakdown.contentQuality || 0 }
  ];
  
  let html = '';
  items.forEach(item => {
    html += `
      <div class="score-bar-item">
        <div class="score-bar-header">
          <span class="score-bar-label">${item.label}</span>
          <span class="score-bar-value">${item.value}/100</span>
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill ${getScoreClass(item.value)}" 
               style="width: ${item.value}%"></div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Render issues by priority
function renderIssues(technical) {
  const container = document.getElementById('issuesList');
  const issuesByPriority = technical.issuesByPriority || {};
  
  let html = '';
  
  // P0 - Critical
  if (issuesByPriority.P0 && issuesByPriority.P0.length > 0) {
    html += `
      <div class="priority-group">
        <div class="priority-header">
          <span class="priority-icon">🔴</span>
          <span class="priority-title">Critical Issues</span>
          <span class="priority-count">${issuesByPriority.P0.length}</span>
        </div>
    `;
    
    issuesByPriority.P0.forEach(issue => {
      html += `
        <div class="issue-card critical">
          <div class="issue-title">${issue.issue}</div>
          <div class="issue-description">${issue.description || ''}</div>
          ${issue.recommendation ? `
            <div class="issue-recommendation">
              <strong>Fix:</strong> ${issue.recommendation}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  // P1 - Important
  if (issuesByPriority.P1 && issuesByPriority.P1.length > 0) {
    html += `
      <div class="priority-group">
        <div class="priority-header">
          <span class="priority-icon">🟡</span>
          <span class="priority-title">Important Issues</span>
          <span class="priority-count">${issuesByPriority.P1.length}</span>
        </div>
    `;
    
    issuesByPriority.P1.forEach(issue => {
      html += `
        <div class="issue-card important">
          <div class="issue-title">${issue.issue}</div>
          <div class="issue-description">${issue.description || ''}</div>
          ${issue.recommendation ? `
            <div class="issue-recommendation">
              <strong>Fix:</strong> ${issue.recommendation}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  // P2 - Minor
  if (issuesByPriority.P2 && issuesByPriority.P2.length > 0) {
    html += `
      <div class="priority-group">
        <div class="priority-header">
          <span class="priority-icon">🟢</span>
          <span class="priority-title">Minor Issues</span>
          <span class="priority-count">${issuesByPriority.P2.length}</span>
        </div>
    `;
    
    issuesByPriority.P2.forEach(issue => {
      html += `
        <div class="issue-card">
          <div class="issue-title">${issue.issue}</div>
          <div class="issue-description">${issue.description || ''}</div>
          ${issue.recommendation ? `
            <div class="issue-recommendation">
              <strong>Fix:</strong> ${issue.recommendation}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  if (html === '') {
    html = '<p style="color: #10b981; text-align: center; padding: 2rem;">🎉 No issues found! Your page is well optimized.</p>';
  }
  
  container.innerHTML = html;
}

// Render E-E-A-T recommendations
function renderEEATRecommendations(eeat) {
  const container = document.getElementById('eeatRecommendations');
  const recommendations = eeat.recommendations || [];
  
  if (recommendations.length === 0) {
    container.innerHTML = '<p style="color: #10b981; text-align: center;">✅ Your E-E-A-T signals are strong!</p>';
    return;
  }
  
  let html = '';
  recommendations.forEach(rec => {
    const priorityClass = rec.priority === 'high' ? 'high-priority' : 
                         rec.priority === 'medium' ? 'medium-priority' : '';
    html += `
      <div class="recommendation-card ${priorityClass}">
        <div style="font-weight: 600; margin-bottom: 0.5rem;">${rec.category}</div>
        <div style="color: #374151;">${rec.recommendation}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Display audit results
async function displayAuditResults(data) {
  // Hide loading
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('auditResults').style.display = 'block';
  
  const { overall, eeat, technicalSEO, page, stats } = data;
  
  // Update overall score
  document.getElementById('overallScore').textContent = overall.score;
  document.getElementById('overallGrade').textContent = overall.grade;
  document.getElementById('scoreStatus').textContent = overall.message;
  animateScoreCircle(overall.score);
  animateScoreNumber(overall.score);
  
  // Update page info
  document.getElementById('pageTitle').textContent = page.title;
  document.getElementById('pageUrl').textContent = data.url;
  
  // Update stats
  document.getElementById('totalIssues').textContent = stats.totalIssues;
  document.getElementById('criticalIssues').textContent = stats.criticalIssues;
  document.getElementById('wordCount').textContent = page.wordCount.toLocaleString();
  document.getElementById('readingTime').textContent = `${page.readingTime} min`;
  
  // Render breakdowns
  renderEEATBreakdown(eeat);
  renderTechnicalBreakdown(technicalSEO);
  
  // Render issues
  renderIssues(technicalSEO);
  
  // Render recommendations
  renderEEATRecommendations(eeat);
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').innerHTML = `
    <div class="error-state">
      <div class="error-icon">❌</div>
      <div class="error-title">Audit Failed</div>
      <div class="error-message">${message}</div>
      <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">
        ← Back to Dashboard
      </button>
    </div>
  `;
}

// Export report
document.getElementById('exportBtn')?.addEventListener('click', () => {
  alert('Export functionality coming soon!');
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('ranksmart_token');
  window.location.href = 'index.html';
});

// Load audit on page load
document.addEventListener('DOMContentLoaded', async () => {
  const url = getUrlParameter('url');
  
  if (!url) {
    showError('No URL provided. Please start a new audit from the dashboard.');
    return;
  }
  
  try {
    // Call the audit API
    const response = await fetch('https://ranksmart.vercel.app/api/audit/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: decodeURIComponent(url) })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || result.error || 'Audit failed');
    }
    
    // Display results
    await displayAuditResults(result.data);
    
  } catch (error) {
    console.error('Audit error:', error);
    showError(error.message || 'An unexpected error occurred. Please try again.');
  }
});
