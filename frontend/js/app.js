/* RetailVision AI - Core SPA Controller & Router */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    activePage: 'dashboard',
    pollingInterval: null,
    clockInterval: null,
    lastUpdateTimestamp: Date.now(),

    init() {
        this.bindEvents();
        this.startClock();
        this.navigateTo(this.activePage);
        this.startPolling();
    },

    bindEvents() {
        // Navigation sidebar clicks
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.getAttribute('data-page');
                
                // Update active state in sidebar UI
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                this.navigateTo(targetPage);
            });
        });

        // Close Modal events
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('details-modal');
            if (e.target === modal) {
                this.hideModal();
            }
        });
    },

    startClock() {
        const clockEl = document.getElementById('live-clock');
        const updateClock = () => {
            const now = new Date();
            if (clockEl) {
                clockEl.textContent = now.toLocaleTimeString();
            }
        };
        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    },

    startPolling() {
        const lastUpdatedEl = document.getElementById('last-updated');
        
        const poll = async () => {
            const data = await ApiService.getDashboardData();
            if (data) {
                // Update header metrics
                document.getElementById('store-id').textContent = `Store: ${data.store_id}`;
                document.getElementById('cams-count').textContent = `Cameras: ${data.connected_cameras} Connected`;
                
                // Update active page metrics if method exists
                const currentPageModule = this.getCurrentPageModule();
                if (currentPageModule && typeof currentPageModule.update === 'function') {
                    currentPageModule.update(data);
                }
                
                this.lastUpdateTimestamp = Date.now();
                if (lastUpdatedEl) lastUpdatedEl.textContent = "Just now";
            }
        };
        
        poll();
        this.pollingInterval = setInterval(poll, 2000);

        // Update elapsed timer since last pull
        setInterval(() => {
            const elapsed = Math.round((Date.now() - this.lastUpdateTimestamp) / 1000);
            if (lastUpdatedEl && elapsed > 0) {
                lastUpdatedEl.textContent = `${elapsed}s ago`;
            }
        }, 1000);
    },

    getCurrentPageModule() {
        switch(this.activePage) {
            case 'dashboard': return DashboardPage;
            case 'detection': return DetectionPage;
            case 'tracking': return TrackingPage;
            case 'heatmap': return HeatmapPage;
            case 'suggestions': return SuggestionsPage;
            case 'settings': return SettingsPage;
            default: return null;
        }
    },

    async navigateTo(pageId) {
        // Clean up previous view if necessary
        const prevPage = this.getCurrentPageModule();
        if (prevPage && typeof prevPage.destroy === 'function') {
            prevPage.destroy();
        }

        this.activePage = pageId;
        const pageContentEl = document.getElementById('page-content');
        
        // Show loader spinner briefly
        pageContentEl.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-circle-notch fa-spin text-cyan fa-2xl"></i>
                <p>Retrieving AI analytics state...</p>
            </div>
        `;

        const targetModule = this.getCurrentPageModule();
        if (targetModule) {
            // Render basic HTML template
            pageContentEl.innerHTML = targetModule.render();
            // Initialize charts and event list bindings
            await targetModule.init();
            
            // Sync with current dashboard metrics immediately
            const cachedData = await ApiService.getDashboardData();
            if (cachedData && typeof targetModule.update === 'function') {
                targetModule.update(cachedData);
            }
        } else {
            pageContentEl.innerHTML = `<div><h3>Page "${pageId}" not found.</h3></div>`;
        }
    },

    showModal(regionBadge, regionTitle, innerHtmlMarkup) {
        const modal = document.getElementById('details-modal');
        const badgeEl = document.getElementById('modal-region-badge');
        const titleEl = document.getElementById('modal-region-title');
        const bodyEl = modal.querySelector('.modal-body');

        badgeEl.textContent = regionBadge.toUpperCase();
        titleEl.textContent = regionTitle;
        bodyEl.innerHTML = innerHtmlMarkup;
        
        // Set badge colors based on severity
        badgeEl.className = 'modal-badge';
        if (regionBadge.toLowerCase().includes('high') || regionBadge.toLowerCase().includes('underperforming')) {
            badgeEl.classList.add('bg-danger');
        } else if (regionBadge.toLowerCase().includes('low') || regionBadge.toLowerCase().includes('blind')) {
            badgeEl.classList.add('bg-warning');
        } else {
            badgeEl.classList.add('bg-primary');
        }

        modal.classList.add('active');
        
        // Let DetailsPage bind behaviors inside modal
        DetailsPage.init(regionTitle.toLowerCase().replace(/ /g, '_'));
    },

    hideModal() {
        const modal = document.getElementById('details-modal');
        if (modal) {
            modal.classList.remove('active');
            DetailsPage.destroy();
        }
    }
};
