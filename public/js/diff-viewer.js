/**
 * Diff Viewer JavaScript
 * Interactive features for visual diff highlighting
 */

class DiffViewer {
  constructor(containerId, diffData) {
    this.container = document.getElementById(containerId);
    this.diffData = diffData;
    this.currentView = 'inline'; // 'inline' or 'side-by-side'
    this.showUnchanged = true;
    this.currentChangeIndex = 0;
    this.changes = this.extractChanges();
    
    this.init();
  }
  
  init() {
    this.render();
    this.attachEventListeners();
  }
  
  extractChanges() {
    return this.diffData.segments
      .map((segment, index) => ({ ...segment, index }))
      .filter(segment => segment.type !== 'unchanged');
  }
  
  render() {
    const html = `
      <div class="diff-viewer">
        ${this.renderControls()}
        ${this.renderStats()}
        ${this.renderLegend()}
        ${this.renderNavigation()}
        ${this.renderDiff()}
        ${this.renderExportOptions()}
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  renderControls() {
    return `
      <div class="diff-controls">
        <button id="toggle-view" class="${this.currentView === 'inline' ? 'active' : ''}">
          ${this.currentView === 'inline' ? '📄 Inline View' : '⚡ Side by Side'}
        </button>
        <button id="toggle-unchanged" class="${this.showUnchanged ? 'active' : ''}">
          ${this.showUnchanged ? '👁️ Hide Unchanged' : '👁️ Show Unchanged'}
        </button>
        <button id="collapse-all">
          📦 Collapse All
        </button>
        <button id="expand-all">
          📂 Expand All
        </button>
      </div>
    `;
  }
  
  renderStats() {
    const { changes } = this.diffData;
    return `
      <div class="diff-stats">
        <div class="diff-stat">
          <span class="diff-stat-label">Additions:</span>
          <span class="diff-stat-value additions">+${changes.additions}</span>
        </div>
        <div class="diff-stat">
          <span class="diff-stat-label">Modifications:</span>
          <span class="diff-stat-value modifications">~${changes.modifications}</span>
        </div>
        <div class="diff-stat">
          <span class="diff-stat-label">Deletions:</span>
          <span class="diff-stat-value deletions">-${changes.deletions}</span>
        </div>
        <div class="diff-stat">
          <span class="diff-stat-label">Total Changes:</span>
          <span class="diff-stat-value">${this.diffData.totalChanges}</span>
        </div>
        <div class="diff-stat">
          <span class="diff-stat-label">Changed:</span>
          <span class="diff-stat-value">${this.diffData.changePercentage}%</span>
        </div>
      </div>
    `;
  }
  
  renderLegend() {
    return `
      <div class="diff-legend">
        <div class="diff-legend-item">
          <div class="diff-legend-marker added"></div>
          <span>Added</span>
        </div>
        <div class="diff-legend-item">
          <div class="diff-legend-marker modified"></div>
          <span>Modified</span>
        </div>
        <div class="diff-legend-item">
          <div class="diff-legend-marker deleted"></div>
          <span>Deleted</span>
        </div>
      </div>
    `;
  }
  
  renderNavigation() {
    const hasChanges = this.changes.length > 0;
    const hasPrev = this.currentChangeIndex > 0;
    const hasNext = this.currentChangeIndex < this.changes.length - 1;
    
    return `
      <div class="diff-navigation">
        <div class="diff-nav-buttons">
          <button class="diff-nav-button" id="prev-change" ${!hasPrev ? 'disabled' : ''}>
            ← Previous
          </button>
          <button class="diff-nav-button" id="next-change" ${!hasNext ? 'disabled' : ''}>
            Next →
          </button>
        </div>
        <div class="diff-nav-info">
          ${hasChanges ? `Change ${this.currentChangeIndex + 1} of ${this.changes.length}` : 'No changes'}
        </div>
      </div>
    `;
  }
  
  renderDiff() {
    if (this.currentView === 'side-by-side') {
      return this.renderSideBySide();
    }
    return this.renderInline();
  }
  
  renderInline() {
    let html = '<div class="diff-container">';
    
    let lastWasUnchanged = false;
    this.diffData.segments.forEach((segment, index) => {
      if (!this.showUnchanged && segment.type === 'unchanged') {
        if (!lastWasUnchanged) {
          html += '<div class="diff-line diff-unchanged-collapsed" data-collapsed="true">... (unchanged lines) ...</div>';
          lastWasUnchanged = true;
        }
        return;
      }
      
      lastWasUnchanged = false;
      html += this.renderSegment(segment, index);
    });
    
    html += '</div>';
    return html;
  }
  
  renderSegment(segment, index) {
    const isCurrentChange = this.changes.findIndex(c => c.index === index) === this.currentChangeIndex;
    const highlightClass = isCurrentChange ? 'flash' : '';
    
    switch (segment.type) {
      case 'added':
        return `
          <div class="diff-line diff-added ${highlightClass}" data-index="${index}">
            <span class="diff-marker">+</span>
            <span class="diff-content">${this.escapeHtml(segment.content)}</span>
          </div>
        `;
        
      case 'deleted':
        return `
          <div class="diff-line diff-deleted ${highlightClass}" data-index="${index}">
            <span class="diff-marker">-</span>
            <span class="diff-content">${this.escapeHtml(segment.content)}</span>
          </div>
        `;
        
      case 'modified':
        return `
          <div class="diff-line diff-modified ${highlightClass}" data-index="${index}">
            <span class="diff-marker">~</span>
            <span class="diff-content">${this.renderInlineDiff(segment.inlineDiff)}</span>
          </div>
        `;
        
      case 'unchanged':
        return `
          <div class="diff-line diff-unchanged" data-index="${index}">
            <span class="diff-marker"> </span>
            <span class="diff-content">${this.escapeHtml(segment.content)}</span>
          </div>
        `;
        
      default:
        return '';
    }
  }
  
  renderInlineDiff(inlineDiff) {
    return inlineDiff.map(part => {
      if (part.type === 'added') {
        return `<mark class="diff-inline-added">${this.escapeHtml(part.text)}</mark>`;
      } else if (part.type === 'deleted') {
        return `<del class="diff-inline-deleted">${this.escapeHtml(part.text)}</del>`;
      } else {
        return this.escapeHtml(part.text);
      }
    }).join('');
  }
  
  renderSideBySide() {
    let originalHtml = '';
    let improvedHtml = '';
    
    this.diffData.segments.forEach(segment => {
      if (!this.showUnchanged && segment.type === 'unchanged') {
        return;
      }
      
      switch (segment.type) {
        case 'added':
          originalHtml += '<div class="diff-line diff-empty"></div>';
          improvedHtml += `<div class="diff-line diff-added">${this.escapeHtml(segment.content)}</div>`;
          break;
          
        case 'deleted':
          originalHtml += `<div class="diff-line diff-deleted">${this.escapeHtml(segment.content)}</div>`;
          improvedHtml += '<div class="diff-line diff-empty"></div>';
          break;
          
        case 'modified':
          originalHtml += `<div class="diff-line diff-modified">${this.escapeHtml(segment.original)}</div>`;
          improvedHtml += `<div class="diff-line diff-modified">${this.escapeHtml(segment.improved)}</div>`;
          break;
          
        case 'unchanged':
          originalHtml += `<div class="diff-line diff-unchanged">${this.escapeHtml(segment.content)}</div>`;
          improvedHtml += `<div class="diff-line diff-unchanged">${this.escapeHtml(segment.content)}</div>`;
          break;
      }
    });
    
    return `
      <div class="diff-side-by-side">
        <div class="diff-column diff-original">
          <h3>Original</h3>
          ${originalHtml}
        </div>
        <div class="diff-column diff-improved">
          <h3>Improved</h3>
          ${improvedHtml}
        </div>
      </div>
    `;
  }
  
  renderExportOptions() {
    return `
      <div class="diff-export-options">
        <button class="diff-export-button primary" id="export-clean">
          📄 Export Clean (No Highlights)
        </button>
        <button class="diff-export-button" id="export-highlighted">
          🎨 Export with Highlights
        </button>
        <button class="diff-export-button" id="export-diff">
          📊 Export Diff Report
        </button>
        <button class="diff-export-button" id="copy-improved">
          📋 Copy Improved Content
        </button>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Toggle view
    const toggleViewBtn = document.getElementById('toggle-view');
    if (toggleViewBtn) {
      toggleViewBtn.addEventListener('click', () => this.toggleView());
    }
    
    // Toggle unchanged
    const toggleUnchangedBtn = document.getElementById('toggle-unchanged');
    if (toggleUnchangedBtn) {
      toggleUnchangedBtn.addEventListener('click', () => this.toggleUnchanged());
    }
    
    // Navigation
    const prevBtn = document.getElementById('prev-change');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousChange());
    }
    
    const nextBtn = document.getElementById('next-change');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextChange());
    }
    
    // Export options
    document.getElementById('export-clean')?.addEventListener('click', () => this.exportClean());
    document.getElementById('export-highlighted')?.addEventListener('click', () => this.exportHighlighted());
    document.getElementById('export-diff')?.addEventListener('click', () => this.exportDiff());
    document.getElementById('copy-improved')?.addEventListener('click', () => this.copyImproved());
    
    // Collapsed sections
    document.querySelectorAll('.diff-unchanged-collapsed').forEach(el => {
      el.addEventListener('click', () => this.expandCollapsed(el));
    });
  }
  
  toggleView() {
    this.currentView = this.currentView === 'inline' ? 'side-by-side' : 'inline';
    this.render();
  }
  
  toggleUnchanged() {
    this.showUnchanged = !this.showUnchanged;
    this.render();
  }
  
  previousChange() {
    if (this.currentChangeIndex > 0) {
      this.currentChangeIndex--;
      this.scrollToCurrentChange();
      this.render();
    }
  }
  
  nextChange() {
    if (this.currentChangeIndex < this.changes.length - 1) {
      this.currentChangeIndex++;
      this.scrollToCurrentChange();
      this.render();
    }
  }
  
  scrollToCurrentChange() {
    setTimeout(() => {
      const changeElement = document.querySelector(`[data-index="${this.changes[this.currentChangeIndex].index}"]`);
      if (changeElement) {
        changeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  
  expandCollapsed(element) {
    this.showUnchanged = true;
    this.render();
  }
  
  exportClean() {
    // Trigger download of clean content
    const content = this.diffData.segments
      .filter(s => s.type !== 'deleted')
      .map(s => s.type === 'modified' ? s.improved : s.content)
      .join('\n');
    
    this.downloadFile('improved-content.txt', content);
  }
  
  exportHighlighted() {
    // Export HTML with highlights
    alert('Export with highlights - This would download an HTML file with visual highlights');
  }
  
  exportDiff() {
    // Export diff report
    const report = `Diff Report
Generated: ${new Date().toLocaleString()}

Statistics:
- Additions: ${this.diffData.changes.additions}
- Modifications: ${this.diffData.changes.modifications}
- Deletions: ${this.diffData.changes.deletions}
- Total Changes: ${this.diffData.totalChanges}
- Change Percentage: ${this.diffData.changePercentage}%

${this.diffData.segments.map(s => {
  if (s.type === 'added') return `+ ${s.content}`;
  if (s.type === 'deleted') return `- ${s.content}`;
  if (s.type === 'modified') return `~ ${s.improved}`;
  return `  ${s.content}`;
}).join('\n')}
`;
    
    this.downloadFile('diff-report.txt', report);
  }
  
  copyImproved() {
    const content = this.diffData.segments
      .filter(s => s.type !== 'deleted')
      .map(s => s.type === 'modified' ? s.improved : s.content)
      .join('\n');
    
    navigator.clipboard.writeText(content).then(() => {
      alert('✅ Improved content copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('❌ Failed to copy content');
    });
  }
  
  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Export for use in other scripts
window.DiffViewer = DiffViewer;
