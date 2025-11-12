/**
 * Dashboard Data Service
 * Handles all dashboard data fetching and management
 */

class DashboardService {
    constructor() {
        this.baseURL = '/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get dashboard statistics
     */
    async getStats() {
        const cacheKey = 'dashboard-stats';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            // Placeholder: Replace with actual API call
            const stats = {
                totalAudits: 24,
                avgScore: 87,
                issuesFixed: 156,
                scansRemaining: 176,
                scansTotal: 200,
                monthlyChange: {
                    audits: 12,
                    score: 15,
                    issues: 23
                }
            };

            this.setCache(cacheKey, stats);
            return stats;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    /**
     * Get recent audits
     */
    async getRecentAudits(limit = 10) {
        const cacheKey = `recent-audits-${limit}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            // Placeholder: Replace with actual API call
            const audits = [
                {
                    id: 1,
                    url: 'example.com/best-casinos',
                    title: 'Best Online Casinos 2025',
                    score: 92,
                    issues: {
                        total: 3,
                        fixed: 3,
                        pending: 0
                    },
                    status: 'complete',
                    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    url: 'example.com/poker-guide',
                    title: 'Poker Strategy Guide',
                    score: 76,
                    issues: {
                        total: 8,
                        fixed: 0,
                        pending: 8
                    },
                    status: 'in_progress',
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    url: 'example.com/betting-tips',
                    title: 'Sports Betting Tips',
                    score: 64,
                    issues: {
                        total: 12,
                        fixed: 0,
                        pending: 12
                    },
                    status: 'pending',
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                }
            ];

            this.setCache(cacheKey, audits);
            return audits;
        } catch (error) {
            console.error('Error fetching recent audits:', error);
            throw error;
        }
    }

    /**
     * Get E-E-A-T progress data
     */
    async getEEATProgress() {
        const cacheKey = 'eeat-progress';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const progress = {
                experience: { current: 82, change: 18 },
                expertise: { current: 88, change: 24 },
                authoritativeness: { current: 79, change: 15 },
                trustworthiness: { current: 91, change: 21 }
            };

            this.setCache(cacheKey, progress);
            return progress;
        } catch (error) {
            console.error('Error fetching E-E-A-T progress:', error);
            throw error;
        }
    }

    /**
     * Get technical SEO health data
     */
    async getTechnicalSEOHealth() {
        const cacheKey = 'technical-seo-health';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const health = {
                metaTags: 95,
                headings: 88,
                images: 92,
                internalLinks: 85
            };

            this.setCache(cacheKey, health);
            return health;
        } catch (error) {
            console.error('Error fetching technical SEO health:', error);
            throw error;
        }
    }

    /**
     * Get user activity timeline
     */
    async getActivityTimeline(limit = 5) {
        const cacheKey = `activity-timeline-${limit}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const activities = [
                {
                    type: 'audit',
                    message: 'Completed audit for Best Online Casinos 2025',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    icon: '🔍'
                },
                {
                    type: 'fix',
                    message: 'Fixed 3 SEO issues',
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                    icon: '🔧'
                },
                {
                    type: 'content',
                    message: 'Generated new content for Poker Guide',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    icon: '✨'
                }
            ];

            this.setCache(cacheKey, activities);
            return activities;
        } catch (error) {
            console.error('Error fetching activity timeline:', error);
            throw error;
        }
    }

    /**
     * Format relative time
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    /**
     * Get score badge class
     */
    getScoreBadgeClass(score) {
        if (score >= 80) return 'score-high';
        if (score >= 60) return 'score-medium';
        return 'score-low';
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const statusMap = {
            'complete': 'badge-success',
            'in_progress': 'badge-warning',
            'pending': 'badge-gray',
            'failed': 'badge-error'
        };
        return statusMap[status] || 'badge-gray';
    }

    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labelMap = {
            'complete': 'Complete',
            'in_progress': 'In Progress',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        return labelMap[status] || 'Unknown';
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Refresh all dashboard data
     */
    async refreshAll() {
        this.clearCache();
        
        try {
            const [stats, audits, eeatProgress, seoHealth] = await Promise.all([
                this.getStats(),
                this.getRecentAudits(),
                this.getEEATProgress(),
                this.getTechnicalSEOHealth()
            ]);

            return {
                stats,
                audits,
                eeatProgress,
                seoHealth
            };
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
            throw error;
        }
    }

    /**
     * Export data for reporting
     */
    async exportData(format = 'json') {
        try {
            const data = await this.refreshAll();
            
            if (format === 'json') {
                return JSON.stringify(data, null, 2);
            }
            
            // Add CSV export if needed
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const dashboardService = new DashboardService();

export default dashboardService;
export { DashboardService };
