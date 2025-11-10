/**
 * Link Building Dashboard JavaScript
 * Week 12 Day 6
 */

// State management
let currentScan = null;
let suggestions = [];
let filteredSuggestions = [];
let selectedSuggestions = new Set();
let currentPage = 1;
const itemsPerPage = 10;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadLatestScan();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Start scan button
    document.getElementById('startScanBtn').addEventListener('click', openScanModal);
    
    // Scan form
    document.getElementById('scanForm').addEventListener('submit', handleScanSubmit);
    document.getElementById('scanType').addEventListener('change', handleScanTypeChange);
    
    // Filters
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('confidenceFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    
    // Bulk actions
    document.getElementById('selectAllBtn').addEventListener('click', toggleSelectAll);
    document.getElementById('approveSelectedBtn').addEventListener('click', () => bulkAction('approve'));
    document.getElementById('rejectSelectedBtn').addEventListener('click', () => bulkAction('reject'));
    
    // Pagination
    document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));
}

/**
 * Load latest scan data
 */
async function loadLatestScan() {
    try {
        showLoading();
        
        // TODO: Replace with actual API call
        const userId = 'demo-user-id'; // Get from auth
        
        const response = await fetch(`/api/linkbuilding/suggestions?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            suggestions = data.suggestions || [];
            currentScan = data.scan;
            updateStats();
            applyFilters();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading scan:', error);
        showEmptyState();
    }
}

/**
 * Update statistics cards
 */
function updateStats() {
    const total = suggestions.length;
    const approved = suggestions.filter(s => s.status === 'approved').length;
    const pending = suggestions.filter(s => s.status === 'pending' || s.status === 'ready_for_review').length;
    const avgConfidence = total > 0 
        ? Math.round(suggestions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / total * 100)
        : 0;
    
    document.getElementById('totalSuggestions').textContent = total;
    document.getElementById('approvedLinks').textContent = approved;
    document.getElementById('pendingReview').textContent = pending;
    document.getElementById('avgConfidence').textContent = `${avgConfidence}%`;
}

/**
 * Apply filters to suggestions
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const confidenceFilter = document.getElementById('confidenceFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredSuggestions = suggestions.filter(suggestion => {
        // Status filter
        if (statusFilter !== 'all' && suggestion.status !== statusFilter) {
            return false;
        }
        
        // Confidence filter
        if (confidenceFilter !== 'all') {
            const confidence = suggestion.confidence_score || 0;
            if (confidenceFilter === 'high' && confidence < 0.8) return false;
            if (confidenceFilter === 'medium' && (confidence < 0.6 || confidence >= 0.8)) return false;
            if (confidenceFilter === 'low' && confidence >= 0.6) return false;
        }
        
        // Search filter
        if (searchTerm) {
            const searchableText = `
                ${suggestion.anchor_text || ''}
                ${suggestion.source_page_url || ''}
                ${suggestion.target_page_url || ''}
            `.toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderSuggestions();
}

/**
 * Render suggestions list
 */
function renderSuggestions() {
    const container = document.getElementById('suggestionsList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    loadingState.style.display = 'none';
    
    if (filteredSuggestions.length === 0) {
        emptyState.style.display = 'block';
        container.innerHTML = '';
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredSuggestions.slice(startIndex, endIndex);
    
    // Render cards
    container.innerHTML = pageItems.map(suggestion => createSuggestionCard(suggestion)).join('');
    
    // Update pagination
    updatePagination();
    
    // Add event listeners to cards
    pageItems.forEach(suggestion => {
        const card = document.getElementById(`suggestion-${suggestion.id}`);
        if (card) {
            card.querySelector('.checkbox-input').addEventListener('change', (e) => {
                handleCheckboxChange(suggestion.id, e.target.checked);
            });
            
            card.querySelector('.btn-view-details').addEventListener('click', () => {
                showDetailModal(suggestion);
            });
            
            card.querySelector('.btn-approve').addEventListener('click', () => {
                approveSuggestion(suggestion.id);
            });
            
            card.querySelector('.btn-reject').addEventListener('click', () => {
                rejectSuggestion(suggestion.id);
            });
        }
    });
}

/**
 * Create suggestion card HTML
 */
function createSuggestionCard(suggestion) {
    const confidence = Math.round((suggestion.confidence_score || 0) * 100);
    const confidenceClass = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
    const isSelected = selectedSuggestions.has(suggestion.id);
    
    return `
        <div class="suggestion-card ${isSelected ? 'selected' : ''}" id="suggestion-${suggestion.id}">
            <div class="suggestion-header">
                <div class="suggestion-info">
                    <div class="suggestion-title">
                        <input type="checkbox" class="checkbox-input" ${isSelected ? 'checked' : ''}>
                        ${suggestion.anchor_text || 'Untitled'}
                    </div>
                    <div class="suggestion-meta">
                        <span class="confidence-badge confidence-${confidenceClass}">
                            ${confidence}% Confidence
                        </span>
                        <span class="status-badge status-${suggestion.status}">
                            ${formatStatus(suggestion.status)}
                        </span>
                        <span>📄 ${truncateUrl(suggestion.source_page_url)}</span>
                        <span>🎯 ${truncateUrl(suggestion.target_page_url)}</span>
                    </div>
                </div>
                <div class="suggestion-actions">
                    <button class="btn-secondary btn-view-details">View Details</button>
                    ${suggestion.status === 'pending' || suggestion.status === 'ready_for_review' ? `
                        <button class="btn-success btn-approve">✓ Approve</button>
                        <button class="btn-danger btn-reject">✗ Reject</button>
                    ` : ''}
                </div>
            </div>
            <div class="suggestion-body">
                <div class="anchor-preview">
                    <div class="anchor-text">"${suggestion.anchor_text}"</div>
                    <div class="target-info">
                        → Links to: ${suggestion.target_page_title || suggestion.target_page_url}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Show suggestion detail modal
 */
function showDetailModal(suggestion) {
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    const confidence = Math.round((suggestion.confidence_score || 0) * 100);
    const relevance = Math.round((suggestion.relevance_score || 0) * 100);
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h4>Anchor Text</h4>
            <p class="anchor-text">"${suggestion.anchor_text}"</p>
        </div>
        
        <div class="detail-section">
            <h4>Source Page</h4>
            <p><a href="${suggestion.source_page_url}" target="_blank">${suggestion.source_page_url}</a></p>
            <p><strong>Title:</strong> ${suggestion.source_page_title || 'N/A'}</p>
        </div>
        
        <div class="detail-section">
            <h4>Target Page</h4>
            <p><a href="${suggestion.target_page_url}" target="_blank">${suggestion.target_page_url}</a></p>
            <p><strong>Title:</strong> ${suggestion.target_page_title || 'N/A'}</p>
        </div>
        
        <div class="detail-section">
            <h4>Scores</h4>
            <p><strong>Confidence:</strong> ${confidence}%</p>
            <p><strong>Relevance:</strong> ${relevance}%</p>
        </div>
        
        ${suggestion.rewritten_content && suggestion.rewritten_content.length > 0 ? `
            <div class="detail-section">
                <h4>Content Variations</h4>
                ${suggestion.rewritten_content.map((variation, index) => `
                    <div class="variation-card">
                        <h5>Variation ${index + 1} (Quality: ${Math.round(variation.quality_score)}%)</h5>
                        <p>${variation.rewritten_content}</p>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
}

/**
 * Close detail modal
 */
function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

/**
 * Handle checkbox change
 */
function handleCheckboxChange(suggestionId, checked) {
    if (checked) {
        selectedSuggestions.add(suggestionId);
    } else {
        selectedSuggestions.delete(suggestionId);
    }
    
    updateBulkActionButtons();
}

/**
 * Toggle select all
 */
function toggleSelectAll() {
    const allSelected = selectedSuggestions.size === filteredSuggestions.length;
    
    if (allSelected) {
        selectedSuggestions.clear();
    } else {
        filteredSuggestions.forEach(s => selectedSuggestions.add(s.id));
    }
    
    renderSuggestions();
    updateBulkActionButtons();
}

/**
 * Update bulk action buttons
 */
function updateBulkActionButtons() {
    const hasSelection = selectedSuggestions.size > 0;
    document.getElementById('approveSelectedBtn').disabled = !hasSelection;
    document.getElementById('rejectSelectedBtn').disabled = !hasSelection;
}

/**
 * Bulk action (approve/reject)
 */
async function bulkAction(action) {
    if (selectedSuggestions.size === 0) return;
    
    const confirmMsg = `Are you sure you want to ${action} ${selectedSuggestions.size} suggestion(s)?`;
    if (!confirm(confirmMsg)) return;
    
    try {
        const suggestionIds = Array.from(selectedSuggestions);
        
        // TODO: Replace with actual API call
        const response = await fetch(`/api/linkbuilding/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestionIds })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Successfully ${action}ed ${suggestionIds.length} suggestion(s)`);
            selectedSuggestions.clear();
            loadLatestScan();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error(`Error ${action}ing suggestions:`, error);
        alert(`Failed to ${action} suggestions`);
    }
}

/**
 * Approve single suggestion
 */
async function approveSuggestion(suggestionId) {
    selectedSuggestions.clear();
    selectedSuggestions.add(suggestionId);
    await bulkAction('approve');
}

/**
 * Reject single suggestion
 */
async function rejectSuggestion(suggestionId) {
    selectedSuggestions.clear();
    selectedSuggestions.add(suggestionId);
    await bulkAction('reject');
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredSuggestions.length / itemsPerPage);
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    document.getElementById('pagination').style.display = totalPages > 1 ? 'flex' : 'none';
}

/**
 * Change page
 */
function changePage(delta) {
    currentPage += delta;
    renderSuggestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Open scan modal
 */
function openScanModal() {
    document.getElementById('scanModal').classList.add('active');
}

/**
 * Close scan modal
 */
function closeScanModal() {
    document.getElementById('scanModal').classList.remove('active');
    document.getElementById('scanForm').reset();
}

/**
 * Handle scan type change
 */
function handleScanTypeChange(e) {
    const specificPagesGroup = document.getElementById('specificPagesGroup');
    specificPagesGroup.style.display = e.target.value === 'specific' ? 'block' : 'none';
}

/**
 * Handle scan form submit
 */
async function handleScanSubmit(e) {
    e.preventDefault();
    
    const siteDomain = document.getElementById('siteDomain').value;
    const scanType = document.getElementById('scanType').value;
    const pageUrls = document.getElementById('pageUrls').value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    try {
        closeScanModal();
        showLoading();
        
        // TODO: Replace with actual API call
        const userId = 'demo-user-id';
        
        const response = await fetch('/api/linkbuilding/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                siteDomain,
                scanType,
                pages: scanType === 'specific' ? pageUrls : undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Scan started successfully! This may take a few minutes.');
            // Poll for results
            pollScanStatus(data.scan_id);
        } else {
            alert(`Error: ${data.error}`);
            loadLatestScan();
        }
    } catch (error) {
        console.error('Error starting scan:', error);
        alert('Failed to start scan');
        loadLatestScan();
    }
}

/**
 * Poll scan status
 */
async function pollScanStatus(scanId) {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;
    
    const interval = setInterval(async () => {
        attempts++;
        
        try {
            const response = await fetch(`/api/linkbuilding/scan-status?scanId=${scanId}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                loadLatestScan();
            } else if (data.status === 'failed' || attempts >= maxAttempts) {
                clearInterval(interval);
                alert('Scan failed or timed out');
                loadLatestScan();
            }
        } catch (error) {
            console.error('Error polling scan status:', error);
        }
    }, 5000);
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('suggestionsList').innerHTML = '';
}

/**
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('suggestionsList').innerHTML = '';
}

/**
 * Utility: Format status
 */
function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'ready_for_review': 'Ready for Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'applied': 'Applied'
    };
    return statusMap[status] || status;
}

/**
 * Utility: Truncate URL
 */
function truncateUrl(url, maxLength = 50) {
    if (!url) return 'N/A';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}
