/**
 * RankSmart 2.0 - API Client
 * Handles all API communication with backend
 */

const API = {
    baseUrl: '/api',
    
    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        // Add auth token if available
        const token = RankSmart.storage.get('authToken');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // ===== Auth Endpoints =====
    
    /**
     * Login user
     */
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    },
    
    /**
     * Signup user
     */
    async signup(email, password, name) {
        return this.post('/auth/signup', { email, password, name });
    },
    
    /**
     * Logout user
     */
    async logout() {
        RankSmart.storage.remove('authToken');
        window.location.href = '/';
    },
    
    // ===== Audit Endpoints =====
    
    /**
     * Create new audit
     */
    async createAudit(url) {
        return this.post('/audit/scan', { url });
    },
    
    /**
     * Get audit by ID
     */
    async getAudit(id) {
        return this.get(`/audit/${id}`);
    },
    
    /**
     * Get recent audits
     */
    async getRecentAudits(limit = 10) {
        return this.get(`/audit/recent?limit=${limit}`);
    },
    
    /**
     * Get audit report
     */
    async getAuditReport(id) {
        return this.get(`/audit/${id}/report`);
    },
    
    /**
     * Analyze page for E-E-A-T
     */
    async analyzeEEAT(url) {
        return this.post('/audit/analyze', { url });
    },
    
    /**
     * Get SERP analysis
     */
    async getSERPAnalysis(url, keyword) {
        return this.post('/audit/serp', { url, keyword });
    },
    
    // ===== Optimization Endpoints =====
    
    /**
     * Fix article (Mode A)
     */
    async fixArticle(content, issues) {
        return this.post('/optimize/fix', { content, issues });
    },
    
    /**
     * Rewrite content (Mode B)
     */
    async rewriteContent(url, keyword) {
        return this.post('/optimize/rewrite', { url, keyword });
    },
    
    /**
     * Generate AI images
     */
    async generateImages(prompt, count = 1) {
        return this.post('/optimize/images', { prompt, count });
    },
    
    // ===== User Endpoints =====
    
    /**
     * Get user profile
     */
    async getProfile() {
        return this.get('/user/profile');
    },
    
    /**
     * Update user profile
     */
    async updateProfile(data) {
        return this.put('/user/profile', data);
    },
    
    /**
     * Get user stats
     */
    async getStats() {
        return this.get('/user/stats');
    },
    
    /**
     * Get usage data
     */
    async getUsage() {
        return this.get('/user/usage');
    },
    
    // ===== Integration Endpoints =====
    
    /**
     * Connect WordPress
     */
    async connectWordPress(siteUrl, username, password) {
        return this.post('/integrations/wordpress/connect', {
            siteUrl,
            username,
            password,
        });
    },
    
    /**
     * Publish to WordPress
     */
    async publishToWordPress(content, title, status = 'draft') {
        return this.post('/integrations/wordpress/publish', {
            content,
            title,
            status,
        });
    },
    
    /**
     * Connect Webflow
     */
    async connectWebflow(apiKey, siteId) {
        return this.post('/integrations/webflow/connect', {
            apiKey,
            siteId,
        });
    },
    
    /**
     * Setup webhook
     */
    async setupWebhook(service, webhookUrl) {
        return this.post('/integrations/webhooks', {
            service,
            webhookUrl,
        });
    },
};

// Export API client
window.API = API;