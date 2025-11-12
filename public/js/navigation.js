/**
 * Navigation Management Module
 * Handles navigation state, active links, and routing
 */

class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.navigationItems = [
            { href: 'dashboard.html', icon: '📊', label: 'Dashboard', id: 'dashboard' },
            { href: 'audit.html', icon: '🔍', label: 'New Audit', id: 'audit' },
            { href: 'serp-analysis.html', icon: '🎯', label: 'SERP Analysis', id: 'serp' },
            { href: 'competitor-mode.html', icon: '✨', label: 'Content Generator', id: 'generator' },
            { href: 'self-audit.html', icon: '🔧', label: 'Self-Audit & Fix', id: 'self-audit' },
            { href: 'monitor.html', icon: '🔍', label: 'Content Monitor', id: 'monitor' },
            { href: 'auto-update.html', icon: '🔄', label: 'Auto-Update', id: 'auto-update' },
            { href: 'link-building.html', icon: '🔗', label: 'Link Building', id: 'link-building' },
            { href: '#', icon: '📁', label: 'My Projects', id: 'projects', disabled: true },
            { href: '#', icon: '📈', label: 'Analytics', id: 'analytics', disabled: true },
            { href: 'settings.html', icon: '⚙️', label: 'Settings', id: 'settings' }
        ];
    }

    /**
     * Get current page from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    /**
     * Check if a navigation item is active
     */
    isActive(item) {
        const itemPage = item.href.replace('.html', '');
        return this.currentPage === itemPage || 
               (this.currentPage === 'index' && itemPage === 'dashboard');
    }

    /**
     * Initialize navigation on page load
     */
    init() {
        this.updateActiveStates();
        this.attachEventListeners();
        console.log('✅ Navigation initialized for page:', this.currentPage);
    }

    /**
     * Update active states for all navigation links
     */
    updateActiveStates() {
        const navLinks = document.querySelectorAll('.sidebar-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkPage = href ? href.replace('.html', '') : '';
            
            // Remove active class from all
            link.classList.remove('active');
            
            // Add active class to current page
            if (this.currentPage === linkPage || 
                (this.currentPage === 'index' && linkPage === 'dashboard')) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Attach event listeners for navigation
     */
    attachEventListeners() {
        // Handle navigation clicks
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Prevent navigation for disabled links
                if (href === '#' || link.classList.contains('disabled')) {
                    e.preventDefault();
                    this.showComingSoon(link.textContent.trim());
                }
            });
        });

        // Handle mobile menu toggle if exists
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    /**
     * Show coming soon message for disabled features
     */
    showComingSoon(feature) {
        const message = `${feature} is coming soon! 🚀`;
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    }

    /**
     * Navigate to a specific page
     */
    navigateTo(page) {
        window.location.href = page;
    }

    /**
     * Get breadcrumb for current page
     */
    getBreadcrumb() {
        const breadcrumbs = {
            'dashboard': ['Dashboard'],
            'audit': ['Dashboard', 'New Audit'],
            'serp': ['Dashboard', 'SERP Analysis'],
            'generator': ['Dashboard', 'Content Generator'],
            'self-audit': ['Dashboard', 'Self-Audit & Fix'],
            'monitor': ['Dashboard', 'Content Monitor'],
            'auto-update': ['Dashboard', 'Auto-Update'],
            'link-building': ['Dashboard', 'Link Building'],
            'settings': ['Dashboard', 'Settings']
        };
        
        return breadcrumbs[this.currentPage] || ['Dashboard'];
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb(container) {
        if (!container) return;
        
        const breadcrumb = this.getBreadcrumb();
        const html = breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'active' : ''}">
                    ${item}
                </span>
                ${!isLast ? '<span class="breadcrumb-separator">›</span>' : ''}
            `;
        }).join('');
        
        container.innerHTML = html;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .breadcrumb-item {
        color: #666;
        font-size: 0.875rem;
    }
    
    .breadcrumb-item.active {
        color: #667eea;
        font-weight: 600;
    }
    
    .breadcrumb-separator {
        margin: 0 0.5rem;
        color: #ccc;
    }
    
    /* Mobile menu styles */
    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .sidebar.mobile-open {
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Create and export singleton instance
const navigationManager = new NavigationManager();

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        navigationManager.init();
    });
} else {
    navigationManager.init();
}

// Export for use in other modules
export default navigationManager;
export { NavigationManager };
