/**
 * RankSmart - SEO Audit Module
 * Handles page auditing, E-E-A-T scoring, and competitor analysis
 */

let currentAudit = null;
let auditHistory = [];

// Start new audit
async function startAudit() {
    const url = document.getElementById('audit-url').value;
    
    if (!url) {
        showNotification('Please enter a URL to audit', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }
    
    // Show loading state
    document.getElementById('audit-btn-text').style.display = 'none';
    document.getElementById('audit-spinner').style.display = 'inline-block';
    
    // Hide previous results
    document.getElementById('audit-results').style.display = 'none';
    
    // Show progress
    document.getElementById('audit-progress').style.display = 'block';
    updateAuditProgress(10, 'Fetching page content...');
    
    try {
        // Fetch page content
        const scrapeResponse = await API.post('/audit/scrape', { url });
        updateAuditProgress(30, 'Analyzing SEO elements...');
        
        // Analyze SEO
        const seoResponse = await API.post('/audit/analyze-seo', {
            url,
            content: scrapeResponse.data.content
        });
        updateAuditProgress(50, 'Calculating E-E-A-T scores...');
        
        // Calculate E-E-A-T
        const eeatResponse = await API.post('/audit/analyze-eeat', {
            url,
            content: scrapeResponse.data.content
        });
        updateAuditProgress(70, 'Analyzing competitors...');
        
        // Get competitor data
        const competitorResponse = await API.post('/audit/competitors', { url });
        updateAuditProgress(90, 'Generating report...');
        
        // Combine results
        currentAudit = {
            url,
            timestamp: new Date().toISOString(),
            seo: seoResponse.data,
            eeat: eeatResponse.data,
            competitors: competitorResponse.data,
            overallScore: calculateOverallScore(seoResponse.data, eeatResponse.data)
        };
        
        updateAuditProgress(100, 'Complete!');
        
        // Display results
        setTimeout(() => {
            displayAuditResults();
        }, 500);
        
        // Add to history
        auditHistory.unshift(currentAudit);
        updateAuditHistory();
        
    } catch (error) {
        console.error('Audit error:', error);
        showNotification('Audit failed. Please try again.', 'error');
        document.getElementById('audit-progress').style.display = 'none';
    } finally {
        document.getElementById('audit-btn-text').style.display = 'inline';
        document.getElementById('audit-spinner').style.display = 'none';
    }
}

// Update audit progress
function updateAuditProgress(percent, text) {
    document.getElementById('audit-progress-fill').style.width = percent + '%';
    document.getElementById('audit-progress-text').textContent = text;
}

// Calculate overall score
function calculateOverallScore(seo, eeat) {
    const seoScore = seo.score || 0;
    const eeatScore = (eeat.experience + eeat.expertise + eeat.authoritativeness + eeat.trustworthiness) / 4;
    return Math.round((seoScore + eeatScore) / 2);
}

// Display audit results
function displayAuditResults() {
    document.getElementById('audit-progress').style.display = 'none';
    document.getElementById('audit-results').style.display = 'block';
    
    // Update overall score
    const score = currentAudit.overallScore;
    document.getElementById('overall-score').textContent = score;
    document.getElementById('overall-score').className = `score-circle ${getScoreClass(score)}`;
    
    // Update E-E-A-T scores
    updateEEATScores();
    
    // Display issues
    displayIssues();
    
    // Display competitor analysis
    displayCompetitorAnalysis();
    
    // Scroll to results
    document.getElementById('audit-results').scrollIntoView({ behavior: 'smooth' });
}

// Update E-E-A-T scores
function updateEEATScores() {
    const eeat = currentAudit.eeat;
    
    updateScoreBar('experience', eeat.experience);
    updateScoreBar('expertise', eeat.expertise);
    updateScoreBar('authoritativeness', eeat.authoritativeness);
    updateScoreBar('trustworthiness', eeat.trustworthiness);
}

// Update individual score bar
function updateScoreBar(type, score) {
    const bar = document.getElementById(`${type}-bar`);
    const value = document.getElementById(`${type}-value`);
    
    if (bar && value) {
        bar.style.width = score + '%';
        bar.className = `score-bar-fill ${getScoreClass(score)}`;
        value.textContent = score;
    }
}

// Get score class based on value
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
}

// Display issues
function displayIssues() {
    const issues = currentAudit.seo.issues || [];
    const issuesContainer = document.getElementById('issues-list');
    
    if (issues.length === 0) {
        issuesContainer.innerHTML = '<p class="text-muted">No issues found! Your page is well optimized.</p>';
        return;
    }
    
    // Group by priority
    const p0 = issues.filter(i => i.priority === 'P0');
    const p1 = issues.filter(i => i.priority === 'P1');
    const p2 = issues.filter(i => i.priority === 'P2');
    
    let html = '';
    
    if (p0.length > 0) {
        html += '<div class="issue-group"><h3 class="issue-priority-title priority-p0">🔴 Critical Issues (P0)</h3>';
        p0.forEach(issue => {
            html += renderIssue(issue);
        });
        html += '</div>';
    }
    
    if (p1.length > 0) {
        html += '<div class="issue-group"><h3 class="issue-priority-title priority-p1">🟡 Important Issues (P1)</h3>';
        p1.forEach(issue => {
            html += renderIssue(issue);
        });
        html += '</div>';
    }
    
    if (p2.length > 0) {
        html += '<div class="issue-group"><h3 class="issue-priority-title priority-p2">🟢 Minor Issues (P2)</h3>';
        p2.forEach(issue => {
            html += renderIssue(issue);
        });
        html += '</div>';
    }
    
    issuesContainer.innerHTML = html;
}

// Render single issue
function renderIssue(issue) {
    return `
        <div class="issue-item priority-${issue.priority.toLowerCase()}">
            <div class="issue-header">
                <h4>${issue.title}</h4>
                <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
            </div>
            <p class="issue-description">${issue.description}</p>
            ${issue.recommendation ? `<p class="issue-recommendation"><strong>Fix:</strong> ${issue.recommendation}</p>` : ''}
        </div>
    `;
}

// Display competitor analysis
function displayCompetitorAnalysis() {
    const competitors = currentAudit.competitors || [];
    const container = document.getElementById('competitor-list');
    
    if (competitors.length === 0) {
        container.innerHTML = '<p class="text-muted">No competitor data available</p>';
        return;
    }
    
    let html = '<div class="competitor-grid">';
    
    competitors.forEach((comp, index) => {
        html += `
            <div class="competitor-card">
                <div class="competitor-rank">#${index + 1}</div>
                <h4 class="competitor-title">${comp.title}</h4>
                <a href="${comp.url}" target="_blank" class="competitor-url">${comp.domain}</a>
                <div class="competitor-stats">
                    <div class="stat-item">
                        <span class="stat-label">Words</span>
                        <span class="stat-value">${comp.wordCount || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Backlinks</span>
                        <span class="stat-value">${comp.backlinks || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">DA</span>
                        <span class="stat-value">${comp.domainAuthority || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Export audit report
async function exportReport(format) {
    if (!currentAudit) {
        showNotification('No audit to export', 'error');
        return;
    }
    
    showNotification(`Exporting report as ${format.toUpperCase()}...`, 'info');
    
    try {
        const response = await API.post('/audit/export', {
            audit: currentAudit,
            format: format
        });
        
        if (response.success) {
            // Download file
            const blob = new Blob([response.data.content], { type: response.data.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.data.filename;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('Report exported successfully', 'success');
        } else {
            showNotification('Export failed', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed', 'error');
    }
}

// Update audit history
function updateAuditHistory() {
    const container = document.getElementById('audit-history');
    
    if (!container) return;
    
    if (auditHistory.length === 0) {
        container.innerHTML = '<p class="text-muted">No audit history yet</p>';
        return;
    }
    
    let html = '<div class="history-list">';
    
    auditHistory.slice(0, 10).forEach(audit => {
        const date = new Date(audit.timestamp).toLocaleDateString();
        const time = new Date(audit.timestamp).toLocaleTimeString();
        
        html += `
            <div class="history-item" onclick="loadAudit('${audit.timestamp}')">
                <div class="history-info">
                    <div class="history-url">${audit.url}</div>
                    <div class="history-date">${date} ${time}</div>
                </div>
                <div class="history-score ${getScoreClass(audit.overallScore)}">
                    ${audit.overallScore}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Load previous audit
function loadAudit(timestamp) {
    const audit = auditHistory.find(a => a.timestamp === timestamp);
    if (audit) {
        currentAudit = audit;
        displayAuditResults();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load audit history from storage
    const stored = localStorage.getItem('ranksmart_audit_history');
    if (stored) {
        try {
            auditHistory = JSON.parse(stored);
            updateAuditHistory();
        } catch (e) {
            console.error('Failed to load audit history:', e);
        }
    }
    
    // Save history on changes
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('ranksmart_audit_history', JSON.stringify(auditHistory));
    });
});

// Utility: Show notification
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}