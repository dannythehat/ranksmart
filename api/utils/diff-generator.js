/**
 * Visual Diff Generator
 * Creates highlighted diffs showing what changed between original and improved content
 */

/**
 * Generate visual diff with highlighting
 * @param {string} original - Original content
 * @param {string} improved - Improved content
 * @returns {object} - Diff data with segments and stats
 */
export function generateVisualDiff(original, improved) {
  const originalLines = original.split('\n');
  const improvedLines = improved.split('\n');
  
  const segments = [];
  const changes = {
    additions: 0,
    modifications: 0,
    deletions: 0,
    unchanged: 0
  };

  let i = 0, j = 0;
  
  while (i < originalLines.length || j < improvedLines.length) {
    const origLine = originalLines[i] || '';
    const impLine = improvedLines[j] || '';

    if (i >= originalLines.length) {
      // Addition at end
      segments.push({
        type: 'added',
        content: impLine,
        lineNumber: j + 1,
        originalLineNumber: null
      });
      changes.additions++;
      j++;
    } else if (j >= improvedLines.length) {
      // Deletion at end
      segments.push({
        type: 'deleted',
        content: origLine,
        lineNumber: null,
        originalLineNumber: i + 1
      });
      changes.deletions++;
      i++;
    } else if (origLine === impLine) {
      // Unchanged
      segments.push({
        type: 'unchanged',
        content: origLine,
        lineNumber: j + 1,
        originalLineNumber: i + 1
      });
      changes.unchanged++;
      i++;
      j++;
    } else {
      // Check if it's a modification or add/delete
      const similarity = calculateSimilarity(origLine, impLine);
      
      if (similarity > 0.5) {
        // Modified line
        const inlineDiff = generateInlineDiff(origLine, impLine);
        segments.push({
          type: 'modified',
          original: origLine,
          improved: impLine,
          inlineDiff: inlineDiff,
          lineNumber: j + 1,
          originalLineNumber: i + 1,
          similarity: similarity
        });
        changes.modifications++;
        i++;
        j++;
      } else {
        // Treat as delete + add
        segments.push({
          type: 'deleted',
          content: origLine,
          lineNumber: null,
          originalLineNumber: i + 1
        });
        segments.push({
          type: 'added',
          content: impLine,
          lineNumber: j + 1,
          originalLineNumber: null
        });
        changes.deletions++;
        changes.additions++;
        i++;
        j++;
      }
    }
  }

  return {
    segments,
    changes,
    totalChanges: changes.additions + changes.modifications + changes.deletions,
    changePercentage: calculateChangePercentage(changes, originalLines.length)
  };
}

/**
 * Generate inline diff showing character-level changes
 * @param {string} original - Original line
 * @param {string} improved - Improved line
 * @returns {array} - Array of diff parts
 */
export function generateInlineDiff(original, improved) {
  const parts = [];
  const origWords = original.split(/(\s+)/);
  const impWords = improved.split(/(\s+)/);
  
  let i = 0, j = 0;
  
  while (i < origWords.length || j < impWords.length) {
    const origWord = origWords[i] || '';
    const impWord = impWords[j] || '';
    
    if (origWord === impWord) {
      parts.push({ type: 'unchanged', text: origWord });
      i++;
      j++;
    } else if (i >= origWords.length) {
      parts.push({ type: 'added', text: impWord });
      j++;
    } else if (j >= impWords.length) {
      parts.push({ type: 'deleted', text: origWord });
      i++;
    } else {
      parts.push({ type: 'deleted', text: origWord });
      parts.push({ type: 'added', text: impWord });
      i++;
      j++;
    }
  }
  
  return parts;
}

/**
 * Calculate similarity between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate change percentage
 * @param {object} changes - Changes object
 * @param {number} totalLines - Total original lines
 * @returns {number} - Percentage changed
 */
function calculateChangePercentage(changes, totalLines) {
  if (totalLines === 0) return 0;
  const changedLines = changes.additions + changes.modifications + changes.deletions;
  return Math.round((changedLines / totalLines) * 100);
}

/**
 * Generate HTML diff for display
 * @param {string} original - Original content
 * @param {string} improved - Improved content
 * @param {boolean} showUnchanged - Whether to show unchanged lines
 * @returns {string} - HTML string
 */
export function generateHTMLDiff(original, improved, showUnchanged = true) {
  const diff = generateVisualDiff(original, improved);
  let html = '<div class="diff-container">\n';
  
  diff.segments.forEach((segment, index) => {
    if (!showUnchanged && segment.type === 'unchanged') {
      // Skip unchanged lines if not showing them
      if (index === 0 || diff.segments[index - 1].type !== 'unchanged') {
        html += '  <div class="diff-line diff-unchanged-collapsed">...</div>\n';
      }
      return;
    }
    
    switch (segment.type) {
      case 'added':
        html += `  <div class="diff-line diff-added" data-line="${segment.lineNumber}">`;
        html += `<span class="diff-marker">+</span>`;
        html += `<span class="diff-content">${escapeHtml(segment.content)}</span>`;
        html += `</div>\n`;
        break;
        
      case 'deleted':
        html += `  <div class="diff-line diff-deleted" data-line="${segment.originalLineNumber}">`;
        html += `<span class="diff-marker">-</span>`;
        html += `<span class="diff-content">${escapeHtml(segment.content)}</span>`;
        html += `</div>\n`;
        break;
        
      case 'modified':
        html += `  <div class="diff-line diff-modified" data-line="${segment.lineNumber}">`;
        html += `<span class="diff-marker">~</span>`;
        html += `<span class="diff-content">`;
        segment.inlineDiff.forEach(part => {
          if (part.type === 'added') {
            html += `<mark class="diff-inline-added">${escapeHtml(part.text)}</mark>`;
          } else if (part.type === 'deleted') {
            html += `<del class="diff-inline-deleted">${escapeHtml(part.text)}</del>`;
          } else {
            html += escapeHtml(part.text);
          }
        });
        html += `</span></div>\n`;
        break;
        
      case 'unchanged':
        html += `  <div class="diff-line diff-unchanged" data-line="${segment.lineNumber}">`;
        html += `<span class="diff-marker"> </span>`;
        html += `<span class="diff-content">${escapeHtml(segment.content)}</span>`;
        html += `</div>\n`;
        break;
    }
  });
  
  html += '</div>';
  return html;
}

/**
 * Generate side-by-side diff HTML
 * @param {string} original - Original content
 * @param {string} improved - Improved content
 * @returns {string} - HTML string
 */
export function generateSideBySideDiff(original, improved) {
  const diff = generateVisualDiff(original, improved);
  
  let html = '<div class="diff-side-by-side">\n';
  html += '  <div class="diff-column diff-original">\n';
  html += '    <h3>Original</h3>\n';
  
  diff.segments.forEach(segment => {
    if (segment.type === 'deleted' || segment.type === 'modified' || segment.type === 'unchanged') {
      const content = segment.type === 'modified' ? segment.original : segment.content;
      const className = segment.type === 'deleted' ? 'diff-deleted' : 
                       segment.type === 'modified' ? 'diff-modified' : 'diff-unchanged';
      html += `    <div class="diff-line ${className}">${escapeHtml(content)}</div>\n`;
    } else if (segment.type === 'added') {
      html += `    <div class="diff-line diff-empty"></div>\n`;
    }
  });
  
  html += '  </div>\n';
  html += '  <div class="diff-column diff-improved">\n';
  html += '    <h3>Improved</h3>\n';
  
  diff.segments.forEach(segment => {
    if (segment.type === 'added' || segment.type === 'modified' || segment.type === 'unchanged') {
      const content = segment.type === 'modified' ? segment.improved : segment.content;
      const className = segment.type === 'added' ? 'diff-added' : 
                       segment.type === 'modified' ? 'diff-modified' : 'diff-unchanged';
      html += `    <div class="diff-line ${className}">${escapeHtml(content)}</div>\n`;
    } else if (segment.type === 'deleted') {
      html += `    <div class="diff-line diff-empty"></div>\n`;
    }
  });
  
  html += '  </div>\n';
  html += '</div>';
  
  return html;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate diff summary
 * @param {string} original - Original content
 * @param {string} improved - Improved content
 * @returns {object} - Summary stats
 */
export function generateDiffSummary(original, improved) {
  const diff = generateVisualDiff(original, improved);
  
  return {
    totalLines: original.split('\n').length,
    changes: diff.changes,
    totalChanges: diff.totalChanges,
    changePercentage: diff.changePercentage,
    summary: `${diff.changes.additions} additions, ${diff.changes.modifications} modifications, ${diff.changes.deletions} deletions`
  };
}
