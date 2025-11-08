/**
 * RankSmart - Content Optimization Module
 * Handles Mode A (Fix Article) and Mode B (Rewrite Competitor)
 */

let currentMode = null;
let originalContent = '';
let optimizedContent = '';
let optimizationResults = null;

// Mode selection
function selectMode(mode) {
    currentMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-option').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById(`mode-${mode}`).classList.add('selected');
    
    // Show input section
    document.getElementById('input-section').style.display = 'block';
    
    // Update title and options based on mode
    if (mode === 'fix') {
        document.getElementById('input-title').textContent = 'Enter Your Article';
        document.getElementById('url-input-group').style.display = 'none';
        document.getElementById('opt-images-group').style.display = 'none';
    } else {
        document.getElementById('input-title').textContent = 'Enter Competitor Content';
        document.getElementById('url-input-group').style.display = 'block';
        document.getElementById('opt-images-group').style.display = 'block';
    }
    
    // Scroll to input
    document.getElementById('input-section').scrollIntoView({ behavior: 'smooth' });
}

// Scrape URL content
async function scrapeUrl() {
    const url = document.getElementById('competitor-url').value;
    
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }
    
    // Show loading
    document.getElementById('scrape-btn-text').style.display = 'none';
    document.getElementById('scrape-spinner').style.display = 'inline-block';
    
    try {
        const response = await API.post('/optimize/scrape', { url });
        
        if (response.success) {
            document.getElementById('content-input').value = response.data.content;
            updateContentStats();
            showNotification('Content scraped successfully', 'success');
        } else {
            showNotification(response.error || 'Failed to scrape content', 'error');
        }
    } catch (error) {
        console.error('Scrape error:', error);
        showNotification('Failed to scrape content', 'error');
    } finally {
        document.getElementById('scrape-btn-text').style.display = 'inline';
        document.getElementById('scrape-spinner').style.display = 'none';
    }
}

// Update content statistics
function updateContentStats() {
    const content = document.getElementById('content-input').value;
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    
    document.getElementById('word-count').textContent = `${words} words`;
    document.getElementById('char-count').textContent = `${chars} characters`;
}

// Listen for content changes
document.addEventListener('DOMContentLoaded', () => {
    const contentInput = document.getElementById('content-input');
    if (contentInput) {
        contentInput.addEventListener('input', updateContentStats);
    }
});

// Start optimization process
async function startOptimization() {
    const content = document.getElementById('content-input').value;
    const keywords = document.getElementById('target-keywords').value;
    
    if (!content.trim()) {
        showNotification('Please enter content to optimize', 'error');
        return;
    }
    
    if (!currentMode) {
        showNotification('Please select an optimization mode', 'error');
        return;
    }
    
    // Get optimization options
    const options = {
        mode: currentMode,
        content: content,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        seo: document.getElementById('opt-seo').checked,
        readability: document.getElementById('opt-readability').checked,
        eeat: document.getElementById('opt-eeat').checked,
        generateImages: currentMode === 'rewrite' && document.getElementById('opt-images').checked
    };
    
    // Store original content
    originalContent = content;
    
    // Show results section
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('progress-card').style.display = 'block';
    document.getElementById('comparison-card').style.display = 'none';
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    
    // Show loading
    document.getElementById('optimize-btn-text').style.display = 'none';
    document.getElementById('optimize-spinner').style.display = 'inline-block';
    
    try {
        // Simulate progress
        updateProgress(10, 'Analyzing content structure...');
        
        // Call API
        const response = await API.post('/optimize/process', options);
        
        if (response.success) {
            updateProgress(50, 'Optimizing content...');
            
            // Simulate more progress
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateProgress(80, 'Generating improvements...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateProgress(100, 'Complete!');
            
            // Store results
            optimizationResults = response.data;
            optimizedContent = response.data.optimizedContent;
            
            // Show results
            displayResults();
        } else {
            showNotification(response.error || 'Optimization failed', 'error');
            document.getElementById('results-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Optimization error:', error);
        showNotification('Optimization failed. Please try again.', 'error');
        document.getElementById('results-section').style.display = 'none';
    } finally {
        document.getElementById('optimize-btn-text').style.display = 'inline';
        document.getElementById('optimize-spinner').style.display = 'none';
    }
}

// Update progress bar
function updateProgress(percent, text) {
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = text;
}

// Display optimization results
function displayResults() {
    // Hide progress, show comparison
    document.getElementById('progress-card').style.display = 'none';
    document.getElementById('comparison-card').style.display = 'block';
    document.getElementById('export-card').style.display = 'block';
    
    // Update scores
    const scoreBefore = optimizationResults.scoreBefore || 65;
    const scoreAfter = optimizationResults.scoreAfter || 88;
    const scoreDelta = scoreAfter - scoreBefore;
    
    document.getElementById('score-before').textContent = scoreBefore;
    document.getElementById('score-after').textContent = scoreAfter;
    document.getElementById('score-delta').textContent = `+${scoreDelta}`;
    
    // Display content
    document.getElementById('original-content').innerHTML = formatContent(originalContent);
    document.getElementById('optimized-content').innerHTML = formatContent(optimizedContent);
    
    // Display changes
    displayChanges();
}

// Format content for display
function formatContent(content) {
    // Convert markdown-style formatting to HTML
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// Display changes summary
function displayChanges() {
    const changes = optimizationResults.changes || [];
    const changesList = document.getElementById('changes-list');
    
    if (changes.length === 0) {
        changesList.innerHTML = '<p class="text-muted">No specific changes tracked</p>';
        return;
    }
    
    let html = '<ul class="changes-list">';
    changes.forEach(change => {
        html += `<li class="change-item">
            <span class="change-type">${change.type}</span>
            <span class="change-description">${change.description}</span>
        </li>`;
    });
    html += '</ul>';
    
    changesList.innerHTML = html;
}

// Toggle between side-by-side and diff view
function toggleView(view) {
    if (view === 'side-by-side') {
        document.getElementById('side-by-side-view').style.display = 'grid';
        document.getElementById('diff-view').style.display = 'none';
    } else {
        document.getElementById('side-by-side-view').style.display = 'none';
        document.getElementById('diff-view').style.display = 'block';
        generateDiff();
    }
}

// Generate diff view
function generateDiff() {
    const diffContent = document.getElementById('diff-content');
    
    // Simple diff implementation
    const originalLines = originalContent.split('\n');
    const optimizedLines = optimizedContent.split('\n');
    
    let html = '<div class="diff-container">';
    
    const maxLines = Math.max(originalLines.length, optimizedLines.length);
    for (let i = 0; i < maxLines; i++) {
        const origLine = originalLines[i] || '';
        const optLine = optimizedLines[i] || '';
        
        if (origLine !== optLine) {
            if (origLine) {
                html += `<div class="diff-line diff-removed">- ${escapeHtml(origLine)}</div>`;
            }
            if (optLine) {
                html += `<div class="diff-line diff-added">+ ${escapeHtml(optLine)}</div>`;
            }
        } else {
            html += `<div class="diff-line">${escapeHtml(origLine)}</div>`;
        }
    }
    
    html += '</div>';
    diffContent.innerHTML = html;
}

// Export content
function exportContent() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Export Options</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <button class="btn btn-secondary btn-block" onclick="exportAs('html')">Export as HTML</button>
                <button class="btn btn-secondary btn-block" onclick="exportAs('markdown')">Export as Markdown</button>
                <button class="btn btn-secondary btn-block" onclick="exportAs('text')">Export as Plain Text</button>
                <button class="btn btn-secondary btn-block" onclick="exportAs('json')">Export as JSON</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Export as specific format
function exportAs(format) {
    let content, filename, mimeType;
    
    switch (format) {
        case 'html':
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Optimized Content</title>
</head>
<body>
    ${formatContent(optimizedContent)}
</body>
</html>`;
            filename = 'optimized-content.html';
            mimeType = 'text/html';
            break;
            
        case 'markdown':
            content = optimizedContent;
            filename = 'optimized-content.md';
            mimeType = 'text/markdown';
            break;
            
        case 'text':
            content = optimizedContent;
            filename = 'optimized-content.txt';
            mimeType = 'text/plain';
            break;
            
        case 'json':
            content = JSON.stringify(optimizationResults, null, 2);
            filename = 'optimization-results.json';
            mimeType = 'application/json';
            break;
    }
    
    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Exported as ${format.toUpperCase()}`, 'success');
    
    // Close modal if open
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

// Publish to platform
async function publishTo(platform) {
    showNotification(`Publishing to ${platform}...`, 'info');
    
    try {
        const response = await API.post(`/integrations/${platform}/publish`, {
            content: optimizedContent,
            title: 'Optimized Content',
            status: 'draft'
        });
        
        if (response.success) {
            showNotification(`Published to ${platform} successfully`, 'success');
        } else {
            showNotification(response.error || `Failed to publish to ${platform}`, 'error');
        }
    } catch (error) {
        console.error('Publish error:', error);
        showNotification(`Failed to publish to ${platform}`, 'error');
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Show notification
function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}