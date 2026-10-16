/* RetailVision AI - Core SPA Controller, Router, & Stable State Manager */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    activePage: 'dashboard',
    pollingInterval: null,
    clockInterval: null,
    
    // Auth Session States
    isLoggedIn: false,
    userRole: null, // "ADMIN", "STORE MANAGER", "MARKETING MANAGER", "RELATIONSHIP MANAGER"
    userName: null,
    userTitle: null,

    // Stable Analytics Timestamps (Fix for repeated 'Updated 1s ago')
    lastKnownAnalyzedAt: null,

    init() {
        this.checkAuth();
        this.bindEvents();
        this.startClock();
    },

    checkAuth() {
        const storedUser = localStorage.getItem('retailvision_user');
        const token = localStorage.getItem('retailvision_token');
        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                this.loginUser(user);
            } catch (e) {
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    },

    showLoginScreen() {
        this.isLoggedIn = false;
        const loginOverlay = document.getElementById('login-overlay');
        const appContainer = document.getElementById('app-container');
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        this.stopPolling();
    },

    loginUser(user) {
        this.isLoggedIn = true;
        this.userRole = (user.role || 'ADMIN').toUpperCase();
        this.userName = user.name || 'User';
        this.userTitle = user.title || this.userRole;
        
        localStorage.setItem('retailvision_user', JSON.stringify(user));
        
        // Hide overlay, display app shell
        const loginOverlay = document.getElementById('login-overlay');
        const appContainer = document.getElementById('app-container');
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        
        // Populate profile and badge
        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        const badgeEl = document.getElementById('sidebar-portal-badge');

        if (nameEl) nameEl.textContent = this.userName;
        if (roleEl) roleEl.textContent = this.userRole;
        if (badgeEl) {
            if (this.userRole.includes('ADMIN') || this.userRole.includes('OWNER')) badgeEl.textContent = 'Super Admin / Owner Portal';
            else if (this.userRole === 'STORE MANAGER') badgeEl.textContent = 'Store Manager Portal';
            else if (this.userRole === 'MARKETING MANAGER') badgeEl.textContent = 'Marketing Portal';
            else if (this.userRole === 'OPERATIONS MANAGER') badgeEl.textContent = 'Operations Portal';
            else badgeEl.textContent = `${this.userRole} Portal`;
        }
        
        // Render dynamic role-specific sidebar
        this.renderSidebar();
        
        // Default page navigation
        this.navigateTo('dashboard');
        this.startAdaptivePolling();
    },

    logout() {
        ApiService.logout();
        localStorage.removeItem('retailvision_user');
        localStorage.removeItem('retailvision_token');
        this.showLoginScreen();
    },

    renderSidebar() {
        const menuList = document.getElementById('sidebar-menu-list');
        if (!menuList) return;

        // Exactly 4 roles: Super Admin / Owner, Store Manager, Marketing Manager, Operations Manager
        const menus = {
            "SUPER ADMIN / OWNER": [
                { id: "dashboard", label: "Dashboard", icon: "fa-gauge" },
                { id: "video_analysis", label: "Video Analysis", icon: "fa-film" },
                { id: "detection", label: "Customer Detection", icon: "fa-person-rays" },
                { id: "tracking", label: "Customer Tracking", icon: "fa-user-tag" },
                { id: "customer_journey", label: "Customer Journey", icon: "fa-route" },
                { id: "heatmap", label: "Heatmap Analytics", icon: "fa-fire" },
                { id: "shelf_analytics", label: "Shelf Analytics", icon: "fa-shapes" },
                { id: "blind_zone", label: "Blind Zone Detection", icon: "fa-eye-slash" },
                { id: "recommendations", label: "AI Recommendations", icon: "fa-wand-magic-sparkles" },
                { id: "reports", label: "Reports", icon: "fa-file-invoice" },
                { id: "settings", label: "Settings", icon: "fa-sliders" },
                { id: "user_management", label: "User Management", icon: "fa-users-gear" }
            ],
            "ADMIN": [
                { id: "dashboard", label: "Dashboard", icon: "fa-gauge" },
                { id: "video_analysis", label: "Video Analysis", icon: "fa-film" },
                { id: "detection", label: "Customer Detection", icon: "fa-person-rays" },
                { id: "tracking", label: "Customer Tracking", icon: "fa-user-tag" },
                { id: "customer_journey", label: "Customer Journey", icon: "fa-route" },
                { id: "heatmap", label: "Heatmap Analytics", icon: "fa-fire" },
                { id: "shelf_analytics", label: "Shelf Analytics", icon: "fa-shapes" },
                { id: "blind_zone", label: "Blind Zone Detection", icon: "fa-eye-slash" },
                { id: "recommendations", label: "AI Recommendations", icon: "fa-wand-magic-sparkles" },
                { id: "reports", label: "Reports", icon: "fa-file-invoice" },
                { id: "settings", label: "Settings", icon: "fa-sliders" },
                { id: "user_management", label: "User Management", icon: "fa-users-gear" }
            ],
            "STORE MANAGER": [
                { id: "dashboard", label: "Dashboard", icon: "fa-gauge" },
                { id: "video_analysis", label: "Video Analysis", icon: "fa-film" },
                { id: "detection", label: "Customer Detection", icon: "fa-person-rays" },
                { id: "tracking", label: "Customer Tracking", icon: "fa-user-tag" },
                { id: "customer_journey", label: "Customer Journey", icon: "fa-route" },
                { id: "heatmap", label: "Heatmap Analytics", icon: "fa-fire" },
                { id: "shelf_analytics", label: "Shelf Analytics", icon: "fa-shapes" },
                { id: "blind_zone", label: "Blind Zone Detection", icon: "fa-eye-slash" },
                { id: "recommendations", label: "Store Recommendations", icon: "fa-wand-magic-sparkles" },
                { id: "reports", label: "Store Reports", icon: "fa-file-invoice" }
            ],
            "MARKETING MANAGER": [
                { id: "dashboard", label: "Dashboard", icon: "fa-gauge" },
                { id: "customer_journey", label: "Customer Journey", icon: "fa-route" },
                { id: "heatmap", label: "Heatmap Analytics", icon: "fa-fire" },
                { id: "shelf_analytics", label: "Shelf Analytics", icon: "fa-shapes" },
                { id: "blind_zone", label: "Blind Zone Detection", icon: "fa-eye-slash" },
                { id: "recommendations", label: "Marketing Insights", icon: "fa-lightbulb" },
                { id: "reports", label: "Marketing Reports", icon: "fa-file-invoice" }
            ],
            "OPERATIONS MANAGER": [
                { id: "dashboard", label: "Dashboard", icon: "fa-gauge" },
                { id: "video_analysis", label: "Video Analysis", icon: "fa-film" },
                { id: "tracking", label: "Customer Traffic", icon: "fa-user-tag" },
                { id: "customer_journey", label: "Customer Flow", icon: "fa-route" },
                { id: "heatmap", label: "Heatmap Density", icon: "fa-fire" },
                { id: "shelf_analytics", label: "Zone Traffic", icon: "fa-shapes" },
                { id: "recommendations", label: "Operational Insights", icon: "fa-wand-magic-sparkles" },
                { id: "reports", label: "Operations Reports", icon: "fa-file-invoice" }
            ]
        };

        const activeMenu = menus[this.userRole] || menus["SUPER ADMIN / OWNER"] || menus["ADMIN"];
        
        menuList.innerHTML = activeMenu.map(item => `
            <li class="nav-item ${item.id === this.activePage ? 'active' : ''}" data-page="${item.id}">
                <a href="#${item.id}"><i class="fa-solid ${item.icon}"></i> <span>${item.label}</span></a>
            </li>
        `).join('');

        // Bind clicks
        const navItems = menuList.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.getAttribute('data-page');
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                this.navigateTo(targetPage);
            });
        });
    },

    bindEvents() {
        // Quick role pills in login modal
        const rolePills = document.querySelectorAll('.role-pill-btn');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        rolePills.forEach(pill => {
            pill.addEventListener('click', () => {
                rolePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const u = pill.getAttribute('data-username');
                if (usernameInput) usernameInput.value = u;
                if (passwordInput) passwordInput.value = 'password';
            });
        });

        // Login Submit
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = usernameInput ? usernameInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value.trim() : '';
                
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                }

                const res = await ApiService.login(username, password);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Enter Intelligence Portal';
                }

                if (res && res.status === 'success') {
                    this.loginUser(res.user);
                } else {
                    alert(res.message || 'Authentication failed. Please verify credentials.');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal Close Button
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideModal());
        }
        
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('details-modal');
            if (e.target === modal) this.hideModal();
        });
    },

    startClock() {
        const clockEl = document.getElementById('live-clock');
        const updateClock = () => {
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleTimeString();
            }
        };
        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    },

    // ---------------- STABLE POLLING & TIMESTAMP FIX ----------------
    startAdaptivePolling() {
        this.stopPolling();
        
        const pollStatus = async () => {
            if (!this.isLoggedIn) return;
            const data = await ApiService.getDashboardData();
            if (data) {
                // Update header tags
                const lastUpdatedEl = document.getElementById('last-updated');
                if (lastUpdatedEl && data.last_analyzed_at) {
                    lastUpdatedEl.textContent = `Last Analyzed: ${data.last_analyzed_at}`;
                }

                const statusLabel = document.getElementById('status-label');
                const statusDot = document.getElementById('status-indicator-dot');
                if (data.status === 'PROCESSING') {
                    if (statusLabel) statusLabel.textContent = `Processing Video...`;
                    if (statusDot) statusDot.className = 'status-dot orange animate-blink';
                } else {
                    if (statusLabel) statusLabel.textContent = `Live: Connected`;
                    if (statusDot) statusDot.className = 'status-dot green animate-blink';
                }

                // If currently on dashboard, update metrics without full page reload
                if (this.activePage === 'dashboard' && typeof DashboardPage.update === 'function') {
                    DashboardPage.update(data);
                }
            }
        };

        pollStatus();
        // Stable background interval (20s) - prevents repeated "1s ago" reset loops
        this.pollingInterval = setInterval(pollStatus, 20000);
    },

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },

    // ---------------- PAGE ROUTING & NAVIGATION ----------------
    navigateTo(pageId) {
        this.activePage = pageId;

        // Update active class in sidebar
        const navItems = document.querySelectorAll('#sidebar-menu-list .nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === pageId) item.classList.add('active');
            else item.classList.remove('active');
        });

        const pageContent = document.getElementById('page-content');
        const headerTitle = document.getElementById('header-page-title');
        const headerSubtitle = document.getElementById('header-page-subtitle');

        const pageModule = this.getPageModule(pageId);
        if (!pageModule) {
            pageContent.innerHTML = `
                <div class="glass-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <h3>Page Under Construction</h3>
                    <p>The requested module (${pageId}) is not available.</p>
                </div>
            `;
            return;
        }

        // Update header titles
        const titles = {
            dashboard: { title: "Executive Retail Intelligence", subtitle: "Real-time CCTV Person Tracking, Dwell Times & Blind Spot Detection" },
            video_analysis: { title: "CCTV Video Dataset & Upload Analysis", subtitle: "Inspect raw CCTV footage and run the YOLOv8 tracking pipeline" },
            detection: { title: "Customer Person Detection", subtitle: "Ultralytics YOLOv8 Person Bounding Box Localization" },
            tracking: { title: "Multi-Object Customer Tracking", subtitle: "ByteTrack Persistent Identity Trails & Speed Estimation" },
            customer_journey: { title: "Customer Journey & Navigation Sequences", subtitle: "Zone traversal pathways from entrance to aisle perimeters" },
            heatmap: { title: "Customer Movement Density Heatmap", subtitle: "Full ground-plane density aggregation from recorded trajectories" },
            shelf_analytics: { title: "Shelf Interaction Region Configurator", subtitle: "Interactive boundary canvas editor and measured shelf analytics" },
            blind_zone: { title: "Spatial Coverage & Blind Zone Detection", subtitle: "144-cell spatial binning isolating unvisited store sectors" },
            recommendations: { title: "AI Merchandising Recommendations", subtitle: "Transparent rules citing measured visitor count and dwell evidence" },
            reports: { title: "Reports & Data Export Center", subtitle: "Export trajectory CSVs, shelf analytics, videos, and executive summaries" },
            settings: { title: "Computer Vision & System Settings", subtitle: "Detection confidence, sampling stride, and camera metadata" },
            user_management: { title: "User & Role Management (RBAC)", subtitle: "System administrator access control and permissions matrix" }
        };

        const pageInfo = titles[pageId] || { title: "RetailVision AI", subtitle: "Intelligence Platform" };
        if (headerTitle) headerTitle.textContent = pageInfo.title;
        if (headerSubtitle) headerSubtitle.textContent = pageInfo.subtitle;

        // Render page HTML
        pageContent.innerHTML = pageModule.render();

        // Initialize module
        if (typeof pageModule.init === 'function') {
            pageModule.init();
        }
    },

    getPageModule(pageId) {
        switch(pageId) {
            case 'dashboard': return DashboardPage;
            case 'video_analysis': return VideoAnalysisPage;
            case 'detection': return DetectionPage;
            case 'tracking': return TrackingPage;
            case 'customer_journey': return CustomerJourneyPage;
            case 'heatmap': return HeatmapPage;
            case 'shelf_analytics': return ShelfAnalyticsPage;
            case 'blind_zone': return BlindZonePage;
            case 'recommendations': return RecommendationsPage;
            case 'reports': return ReportsPage;
            case 'settings': return SettingsPage;
            case 'user_management': return UserManagementPage;
            default: return null;
        }
    },

    showModal(title, contentHtml) {
        const modal = document.getElementById('details-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body-content');
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = contentHtml;
            modal.style.display = 'flex';
        }
    },

    hideModal() {
        const modal = document.getElementById('details-modal');
        if (modal) modal.style.display = 'none';
    }
};
