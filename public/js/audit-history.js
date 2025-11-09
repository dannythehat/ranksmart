/**
 * Audit History Management
 * Handles saving, loading, and managing audit history
 */

const AUDIT_HISTORY_KEY = 'ranksmart_audit_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Save audit result to history
 */
function saveAuditToHistory(auditData) {
  try {
    const history = getAuditHistory();
    
    // Create history entry
    const historyEntry = {
      id: generateAuditId(),
      url: auditData.url,
      scannedAt: auditData.scannedAt || new Date().toISOString(),
      overall: auditData.overall,
      eeat: {
        overall: auditData.eeat?.overall,
        grade: auditData.eeat?.grade
      },
      technicalSEO: {
        overall: auditData.technicalSEO?.overall,
        grade: auditData.technicalSEO?.grade
      },
      page: auditData.page,
      stats: auditData.stats,
      executionTime: auditData.executionTime
    };

    // Add to beginning of array
    history.unshift(historyEntry);

    // Keep only last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    // Save to localStorage
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    console.log('✅ Audit saved to history:', historyEntry.id);
    
    return historyEntry;
    
  } catch (error) {
    console.error('❌ Failed to save audit to history:', error);
    return null;
  }
}

/**
 * Get audit history
 */
function getAuditHistory() {
  try {
    const history = localStorage.getItem(AUDIT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load audit history:', error);
    return [];
  }
}

/**
 * Get single audit by ID
 */
function getAuditById(id) {
  const history = getAuditHistory();
  return history.find(audit => audit.id === id);
}

/**
 * Get audits by URL
 */
function getAuditsByUrl(url) {
  const history = getAuditHistory();
  return history.filter(audit => audit.url === url);
}

/**
 * Delete audit from history
 */
function deleteAudit(id) {
  try {
    const history = getAuditHistory();
    const filtered = history.filter(audit => audit.id !== id);
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete audit:', error);
    return false;
  }
}

/**
 * Clear all audit history
 */
function clearAuditHistory() {
  try {
    localStorage.removeItem(AUDIT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear audit history:', error);
    return false;
  }
}

/**
 * Get audit statistics
 */
function getAuditStats() {
  const history = getAuditHistory();
  
  if (history.length === 0) {
    return {
      totalAudits: 0,
      averageScore: 0,
      totalIssues: 0,
      issuesFixed: 0,
      lastAuditDate: null
    };
  }

  const totalScore = history.reduce((sum, audit) => sum + (audit.overall?.score || 0), 0);
  const totalIssues = history.reduce((sum, audit) => sum + (audit.stats?.totalIssues || 0), 0);
  
  return {
    totalAudits: history.length,
    averageScore: Math.round(totalScore / history.length),
    totalIssues: totalIssues,
    issuesFixed: 0, // TODO: Track fixed issues
    lastAuditDate: history[0]?.scannedAt
  };
}

/**
 * Generate unique audit ID
 */
function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export audit data as JSON
 */
function exportAuditAsJSON(auditData) {
  const dataStr = JSON.stringify(auditData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ranksmart-audit-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export audit data as CSV
 */
function exportAuditAsCSV(auditData) {
  const rows = [
    ['Metric', 'Value'],
    ['URL', auditData.url],
    ['Scan Date', auditData.scannedAt],
    ['Overall Score', auditData.overall?.score],
    ['Overall Grade', auditData.overall?.grade],
    ['E-E-A-T Score', auditData.eeat?.overall],
    ['Technical SEO Score', auditData.technicalSEO?.overall],
    ['Total Issues', auditData.stats?.totalIssues],
    ['Critical Issues', auditData.stats?.criticalIssues],
    ['Word Count', auditData.page?.wordCount],
    ['Reading Time', auditData.page?.readingTime + ' min'],
    ['Execution Time', auditData.executionTime]
  ];

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ranksmart-audit-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for display
 */
function formatAuditDate(dateString) {
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
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Get score color class
 */
function getScoreColorClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

/**
 * Get grade emoji
 */
function getGradeEmoji(grade) {
  if (grade.startsWith('A')) return '🌟';
  if (grade.startsWith('B')) return '✅';
  if (grade.startsWith('C')) return '⚠️';
  if (grade.startsWith('D')) return '❌';
  return '💀';
}

// Export functions
window.auditHistory = {
  save: saveAuditToHistory,
  getAll: getAuditHistory,
  getById: getAuditById,
  getByUrl: getAuditsByUrl,
  delete: deleteAudit,
  clear: clearAuditHistory,
  getStats: getAuditStats,
  exportJSON: exportAuditAsJSON,
  exportCSV: exportAuditAsCSV,
  formatDate: formatAuditDate,
  getScoreColorClass,
  getGradeEmoji
};
