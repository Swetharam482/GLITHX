/* RetailVision AI - Role-Adaptive Executive Dashboard (Session-Aware & Real Analytics) */

const DashboardPage = {
    trafficChart: null,
    dwellChart: null,
    opsTimelineChart: null,
    currentSessionId: null,

    render() {
        const role = (App.userRole || 'SUPER ADMIN / OWNER').toUpperCase();

        if (role === 'STORE MANAGER') {
            return this.renderStoreManagerView();
        } else if (role === 'MARKETING MANAGER') {
            return this.renderMarketingManagerView();
        } else if (role === 'OPERATIONS MANAGER') {
            return this.renderOperationsManagerView();
        } else {
            // Default: SUPER ADMIN / OWNER or ADMIN
            return this.renderSuperAdminView();
        }
    },

    // ---------------- COMMON TOP SESSION STRIP ----------------
    renderSessionSelectorStrip(roleTitle) {
        return `
            <div class="glass-card" style="padding: 16px 22px; margin-bottom: 22px; border: 1px solid var(--border-color); background: #FFFFFF;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="badge badge-orange" style="font-size: 11px; font-weight: 700;">${roleTitle.toUpperCase()}</span>
                            <span class="badge badge-blue" id="db-session-active-pill" style="font-size: 11px;">Active Session</span>
                        </div>
                        <h4 style="margin: 4px 0 2px 0; font-size: 15.5px; font-weight: 700; color: var(--text-primary);" id="db-active-video-title">
                            Loading Active Analysis Session...
                        </h4>
                        <small style="color: var(--text-muted); font-size: 12px;" id="db-session-meta-sub">
                            All metrics on this dashboard are strictly derived from this single analyzed session.
                        </small>
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 0;">Switch Session:</label>
                        <select class="form-control" id="db-session-switcher" style="min-width: 240px; font-size: 12.5px; padding: 6px 12px;">
                            <option value="" disabled selected>Loading session history...</option>
                        </select>
                        <button class="btn-primary" onclick="App.navigateTo('video_analysis')" style="font-size: 12.5px; padding: 7px 14px;">
                            <i class="fa-solid fa-film"></i> Analyze Video
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ---------------- ROLE 1: STORE MANAGER VIEW ----------------
    renderStoreManagerView() {
        return `
            ${this.renderSessionSelectorStrip("Store Manager Portal")}

            <!-- Notice on Tracking IDs Limitation -->
            <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 10px 16px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 12.5px; color: #92400E;">
                <i class="fa-solid fa-circle-info text-orange"></i>
                <strong>Notice:</strong> Customer tracking IDs are tracker IDs assigned locally within this analyzed video clip, not verified biometric or real-world identities across camera streams.
            </div>

            <!-- Store Manager KPI Grid -->
            <div class="kpi-grid">
                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Total Unique Tracked Shoppers</span><div class="kpi-icon"><i class="fa-solid fa-users"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-total-customers">0</span>
                        <span class="kpi-trend stable">Observed in Clip</span>
                    </div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Monitored Shelf Zones</span><div class="kpi-icon"><i class="fa-solid fa-shapes"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-configured-shelves">0</span>
                        <span class="kpi-trend up"><i class="fa-solid fa-check"></i> Configured</span>
                    </div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Average Dwell Time</span><div class="kpi-icon"><i class="fa-solid fa-stopwatch"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-dwell-time">0.0s</span>
                        <span class="kpi-trend stable">Per Shelf Interaction</span>
                    </div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Camera Blind Spot %</span><div class="kpi-icon"><i class="fa-solid fa-eye-slash"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-blind-spot">0.0%</span>
                        <span class="kpi-trend down">Unvisited Spatial Cells</span>
                    </div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Most Visited Zone</span><div class="kpi-icon"><i class="fa-solid fa-trophy text-orange"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-most-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Least Visited Zone</span><div class="kpi-icon"><i class="fa-solid fa-arrow-down-short-wide"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-least-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Peak Concurrent Occupancy</span><div class="kpi-icon"><i class="fa-solid fa-building-user"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-occupancy">0</span>
                        <span class="kpi-trend stable">Shoppers in Frame</span>
                    </div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Session Status</span><div class="kpi-icon"><i class="fa-solid fa-server"></i></div></div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-processing-status" style="font-size: 16px;">READY</span>
                        <span class="badge badge-green" id="kpi-status-badge">Completed</span>
                    </div>
                </div>
            </div>

            <!-- Main Layout: Video + Heatmap -->
            <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-video text-orange"></i> Annotated Store Surveillance Playback</h3>
                        <a href="${API_BASE_URL}/report?type=video" class="btn-outline-orange" style="font-size: 11.5px; padding: 4px 10px; text-decoration: none;" download>
                            <i class="fa-solid fa-download"></i> Download Video
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; background: #000; position: relative; aspect-ratio: 16/9;">
                            <img id="dashboard-video-stream" src="${API_BASE_URL}/video_feed?mode=tracking" alt="CCTV Tracking Feed" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-fire text-orange"></i> Shopper Movement Density Heatmap</h3>
                        <a href="#heatmap" onclick="App.navigateTo('heatmap')" class="btn-outline-orange" style="font-size: 11.5px; padding: 4px 10px; text-decoration: none;">
                            Full Heatmap <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #F8FAFC;">
                            <img id="dashboard-heatmap-img" src="${API_BASE_URL.replace('/api', '')}/static/store_heatmap.png" alt="Heatmap" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section: Dwell Time by Shelf & Zone Visits -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-chart-column text-orange"></i> Shelf Visit Distribution</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;"><canvas id="shelf-visits-chart"></canvas></div>
                </div>

                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left text-orange"></i> Average Dwell Time by Zone (Seconds)</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;"><canvas id="shelf-dwell-chart"></canvas></div>
                </div>
            </div>

            <!-- Recommendations for Store Manager -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-wand-magic-sparkles text-orange"></i> Store Operations & Merchandising Recommendations</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr><th>Zone</th><th>Priority</th><th>Measured Evidence</th><th>Proposed Action</th></tr>
                            </thead>
                            <tbody id="dashboard-recommendations-tbody">
                                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading recommendations...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // ---------------- ROLE 2: MARKETING MANAGER VIEW ----------------
    renderMarketingManagerView() {
        return `
            ${this.renderSessionSelectorStrip("Marketing Manager Portal")}

            <!-- Marketing CCTV Disclaimer -->
            <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 10px 16px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 12.5px; color: #1E40AF;">
                <i class="fa-solid fa-circle-info" style="color: #3B82F6;"></i>
                <strong>Marketing Note:</strong> CCTV metrics measure physical shopper traffic, dwell times, and shelf interaction density. Surveillance analytics alone cannot verify basket checkouts or individual product purchase transactions.
            </div>

            <!-- Marketing KPIs -->
            <div class="kpi-grid">
                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Audience Footfall</span><div class="kpi-icon"><i class="fa-solid fa-users"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-total-customers">0</span><span class="kpi-trend stable">Total Shoppers</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Average Dwell Time</span><div class="kpi-icon"><i class="fa-solid fa-stopwatch"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-dwell-time">0.0s</span><span class="kpi-trend up">Browsing Interest</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Prime Traffic Zone</span><div class="kpi-icon"><i class="fa-solid fa-trophy text-orange"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-most-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Opportunity Zone</span><div class="kpi-icon"><i class="fa-solid fa-compass"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-least-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>
            </div>

            <!-- Zone Rankings Table & Dwell Chart -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-ranking-star text-orange"></i> Zone Visit Rankings & Shopper Interaction Density</h3></div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="rv-table">
                                <thead>
                                    <tr><th>Rank</th><th>Shelf / Display Zone</th><th>Visitors</th><th>Traffic Share</th><th>Avg Dwell</th></tr>
                                </thead>
                                <tbody id="marketing-rankings-tbody">
                                    <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading rankings...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left text-orange"></i> Shelf Dwell Time Comparison</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;"><canvas id="shelf-dwell-chart"></canvas></div>
                </div>
            </div>

            <!-- Heatmap & Merchandising Insights -->
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px;">
                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-fire text-orange"></i> Shopper Physical Attention Heatmap</h3></div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #F8FAFC;">
                            <img id="dashboard-heatmap-img" src="${API_BASE_URL.replace('/api', '')}/static/store_heatmap.png" alt="Heatmap" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-lightbulb text-orange"></i> Product Placement Recommendations</h3></div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="rv-table">
                                <thead>
                                    <tr><th>Shelf</th><th>Priority</th><th>Measured Evidence</th><th>Proposed Merchandising</th></tr>
                                </thead>
                                <tbody id="dashboard-recommendations-tbody">
                                    <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading merchandising insights...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ---------------- ROLE 3: OPERATIONS MANAGER VIEW ----------------
    renderOperationsManagerView() {
        return `
            ${this.renderSessionSelectorStrip("Operations Manager Portal")}

            <!-- Operations Disclaimer -->
            <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 10px 16px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 12.5px; color: #065F46;">
                <i class="fa-solid fa-circle-check" style="color: #10B981;"></i>
                <strong>Operations Note:</strong> Traffic timeline metrics reflect offline CCTV playback analysis intervals. These metrics demonstrate peak traffic periods and aisle congestion during recorded video hours.
            </div>

            <!-- Operations KPIs -->
            <div class="kpi-grid">
                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Peak Concurrent Occupancy</span><div class="kpi-icon"><i class="fa-solid fa-users-viewfinder"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-occupancy">0</span><span class="kpi-trend stable">Max In-Frame</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Total Observed Shoppers</span><div class="kpi-icon"><i class="fa-solid fa-people-arrows"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-total-customers">0</span><span class="kpi-trend up">Unique Trajectories</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Walking Aisle Congestion %</span><div class="kpi-icon"><i class="fa-solid fa-arrows-split-up-and-left"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-aisle-share">42.5%</span><span class="kpi-trend stable">Transit Share</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Unvisited Store Sectors</span><div class="kpi-icon"><i class="fa-solid fa-triangle-exclamation"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-blind-spot">0.0%</span><span class="kpi-trend down">Zero Footfall</span></div>
                </div>
            </div>

            <!-- Customer Flow Timeline & Blind Zone Coverage -->
            <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-chart-line text-orange"></i> Customer Traffic Flow Over Video Time</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;">
                        <canvas id="ops-timeline-chart"></canvas>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-eye-slash text-orange"></i> Spatial Grid Coverage & Blind Zones</h3></div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #F8FAFC;">
                            <img id="dashboard-blindzone-img" src="${API_BASE_URL.replace('/api', '')}/static/blind_zone.png" alt="Blind Zone" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Operations Recommendations -->
            <div class="glass-card">
                <div class="card-header"><h3><i class="fa-solid fa-clipboard-check text-orange"></i> Operational Recommendations</h3></div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr><th>Zone / Pathway</th><th>Priority</th><th>Observed Evidence</th><th>Staffing / Flow Action</th></tr>
                            </thead>
                            <tbody id="dashboard-recommendations-tbody">
                                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading operational insights...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // ---------------- ROLE 4: SUPER ADMIN / OWNER VIEW ----------------
    renderSuperAdminView() {
        return `
            ${this.renderSessionSelectorStrip("Super Admin / Owner Portal")}

            <!-- Executive 8 KPI Cards Grid -->
            <div class="kpi-grid">
                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Total Unique Shoppers</span><div class="kpi-icon"><i class="fa-solid fa-users"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-total-customers">0</span><span class="kpi-trend stable">Observed in Session</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Configured Shelves</span><div class="kpi-icon"><i class="fa-solid fa-layer-group"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-configured-shelves">0</span><span class="kpi-trend up"><i class="fa-solid fa-check"></i> Monitored</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Average Dwell Time</span><div class="kpi-icon"><i class="fa-solid fa-stopwatch"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-dwell-time">0.0s</span><span class="kpi-trend stable">Per Interaction</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Spatial Blind Spot %</span><div class="kpi-icon"><i class="fa-solid fa-eye-slash"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-blind-spot">0.0%</span><span class="kpi-trend down">Unvisited Cells</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Most Visited Zone</span><div class="kpi-icon"><i class="fa-solid fa-trophy text-orange"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-most-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Least Visited Zone</span><div class="kpi-icon"><i class="fa-solid fa-arrow-down-short-wide"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-least-visited" style="font-size: 15px; text-transform: uppercase;">--</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Peak Concurrent Occupancy</span><div class="kpi-icon"><i class="fa-solid fa-building-user"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-occupancy">0</span><span class="kpi-trend stable">Shoppers in Frame</span></div>
                </div>

                <div class="glass-card kpi-card">
                    <div class="kpi-header"><span>Pipeline Status</span><div class="kpi-icon"><i class="fa-solid fa-server"></i></div></div>
                    <div class="kpi-body"><span class="kpi-number" id="kpi-processing-status" style="font-size: 16px;">COMPLETED</span><span class="badge badge-green" id="kpi-status-badge">Ready</span></div>
                </div>
            </div>

            <!-- Video Player + Heatmap -->
            <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-video text-orange"></i> Annotated CCTV Person Tracking Output</h3>
                        <a href="${API_BASE_URL}/report?type=video" class="btn-outline-orange" style="text-decoration: none; font-size: 11.5px; padding: 4px 10px;" download>
                            <i class="fa-solid fa-download"></i> Download Video
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; background: #000; position: relative; aspect-ratio: 16/9;">
                            <img id="dashboard-video-stream" src="${API_BASE_URL}/video_feed?mode=tracking" alt="CCTV Feed" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-fire text-orange"></i> Customer Movement Density Heatmap</h3>
                        <a href="#heatmap" onclick="App.navigateTo('heatmap')" class="btn-outline-orange" style="text-decoration: none; font-size: 11.5px; padding: 4px 10px;">
                            Full Heatmap <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #F8FAFC;">
                            <img id="dashboard-heatmap-img" src="${API_BASE_URL.replace('/api', '')}/static/store_heatmap.png" alt="Heatmap" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts: Shelf Visitation & Dwell Times -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-chart-column text-orange"></i> Shelf Visitation Frequency</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;"><canvas id="shelf-visits-chart"></canvas></div>
                </div>

                <div class="glass-card">
                    <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left text-orange"></i> Average Dwell Time by Shelf (Seconds)</h3></div>
                    <div class="card-body" style="height: 280px; position: relative;"><canvas id="shelf-dwell-chart"></canvas></div>
                </div>
            </div>

            <!-- Lower Section: Blind Zone & Actionable Recommendations -->
            <div style="display: grid; grid-template-columns: 1fr 1.25fr; gap: 24px; margin-bottom: 24px;">
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-map-location-dot text-orange"></i> Store Blind Zone Spatial Map</h3>
                        <a href="#blind_zone" onclick="App.navigateTo('blind_zone')" class="btn-outline-orange" style="text-decoration: none; font-size: 11.5px; padding: 4px 10px;">
                            Analysis Details <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #F8FAFC;">
                            <img id="dashboard-blindzone-img" src="${API_BASE_URL.replace('/api', '')}/static/blind_zone.png" alt="Blind Zone" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-wand-magic-sparkles text-orange"></i> Measured Actionable Recommendations</h3>
                        <a href="#recommendations" onclick="App.navigateTo('recommendations')" class="btn-outline-orange" style="text-decoration: none; font-size: 11.5px; padding: 4px 10px;">
                            View All <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="rv-table">
                                <thead>
                                    <tr><th>Shelf / Zone</th><th>Priority</th><th>Measured Evidence</th><th>Proposed Action</th></tr>
                                </thead>
                                <tbody id="dashboard-recommendations-tbody">
                                    <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading recommendations...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Processed Sessions History Table for Super Admin -->
            <div class="glass-card">
                <div class="card-header">
                    <div>
                        <h3 style="margin: 0;"><i class="fa-solid fa-database text-orange"></i> Processed Video Sessions Storage</h3>
                        <small style="color: var(--text-muted); font-size: 12px;">Switch between completed analysis runs stored in backend/data/processed/.</small>
                    </div>
                    <button class="btn-secondary" onclick="DashboardPage.loadSessionsList()" style="font-size: 12px; padding: 5px 12px;">
                        <i class="fa-solid fa-rotate-right"></i> Refresh
                    </button>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr><th>Session ID</th><th>Video Name</th><th>Analyzed At</th><th>Shoppers</th><th>Avg Dwell</th><th>Blind %</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody id="db-sessions-table-tbody">
                                <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading sessions...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadSessionsList();
        await this.loadAnalyticsData();
        this.bindEvents();
    },

    bindEvents() {
        const switcher = document.getElementById('db-session-switcher');
        if (switcher) {
            switcher.addEventListener('change', async (e) => {
                const targetSession = e.target.value;
                if (!targetSession) return;
                await ApiService.setActiveSession(targetSession);
                await this.loadAnalyticsData(targetSession);
                await this.loadSessionsList();
            });
        }
    },

    async loadSessionsList() {
        const data = await ApiService.getProcessedSessions();
        const sessions = data && data.sessions ? data.sessions : [];
        const activeId = data ? data.active_session_id : null;

        // Populate dropdown switcher
        const switcher = document.getElementById('db-session-switcher');
        if (switcher) {
            if (sessions.length === 0) {
                switcher.innerHTML = '<option value="" disabled selected>No completed sessions</option>';
            } else {
                switcher.innerHTML = sessions.map(s => `
                    <option value="${s.session_id}" ${s.session_id === activeId ? 'selected' : ''}>
                        ${s.session_id === activeId ? '★ ' : ''}${s.original_filename} (${s.completion_time || s.start_time || 'Done'})
                    </option>
                `).join('');
            }
        }

        // Populate table if present (Admin view)
        const tbody = document.getElementById('db-sessions-table-tbody');
        if (tbody) {
            if (sessions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No processed sessions found.</td></tr>`;
                return;
            }
            tbody.innerHTML = sessions.map(s => `
                <tr style="${s.session_id === activeId ? 'background: #FFF7ED; font-weight: 600;' : ''}">
                    <td style="font-family: monospace; font-size: 11.5px;">${s.session_id}</td>
                    <td><strong>${s.original_filename}</strong></td>
                    <td style="font-size: 12px; color: var(--text-muted);">${s.completion_time || s.start_time || '--'}</td>
                    <td><span class="badge badge-orange">${s.total_customers || 0}</span></td>
                    <td>${s.avg_dwell_time_sec ? s.avg_dwell_time_sec + 's' : '0.0s'}</td>
                    <td>${s.blind_spot_percentage ? s.blind_spot_percentage + '%' : '0.0%'}</td>
                    <td><span class="badge ${s.status === 'completed' ? 'badge-green' : 'badge-red'}">${(s.status || 'completed').toUpperCase()}</span></td>
                    <td>
                        <button class="btn-primary" style="font-size: 11px; padding: 4px 10px;" onclick="DashboardPage.switchSession('${s.session_id}')">
                            <i class="fa-solid fa-arrow-pointer"></i> Select
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    },

    async switchSession(sessionId) {
        await ApiService.setActiveSession(sessionId);
        await this.loadAnalyticsData(sessionId);
        await this.loadSessionsList();
    },

    async loadAnalyticsData(sessionId = null) {
        const data = await ApiService.getDashboardData(sessionId);
        if (!data) return;

        this.currentSessionId = data.active_session;
        this.update(data);

        // Load session-specific recommendations
        const recs = await ApiService.getRecommendations(this.currentSessionId);
        this.renderRecommendationsTable(recs);

        // Load Operations timeline if on Operations view
        if (document.getElementById('ops-timeline-chart')) {
            const detectData = await ApiService.getPersonDetection(this.currentSessionId);
            this.renderOperationsTimeline(detectData);
        }
    },

    update(data) {
        if (!data) return;

        // Top session header details
        const titleEl = document.getElementById('db-active-video-title');
        const metaSub = document.getElementById('db-session-meta-sub');
        const sessionPill = document.getElementById('db-session-active-pill');

        if (data.status === "NO_ANALYSIS") {
            if (titleEl) titleEl.textContent = "No Completed Video Analysis";
            if (metaSub) metaSub.textContent = "Please select a video from the Available Videos library or upload a clip, then click 'Analyze Video'.";
            if (sessionPill) { sessionPill.className = "badge badge-orange"; sessionPill.textContent = "NO SESSION"; }
        } else {
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-file-video text-orange"></i> ${data.active_video || 'CCTV Video'}`;
            if (metaSub) metaSub.innerHTML = `Session ID: <code>${data.active_session || 'N/A'}</code> | Analyzed At: <strong>${data.last_analyzed_at || 'Recently'}</strong>`;
            if (sessionPill) { sessionPill.className = "badge badge-blue"; sessionPill.textContent = `Session: ${data.active_session || 'Active'}`; }
        }

        // App header sync
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `Analyzed: ${data.last_analyzed_at || 'Not Yet'}`;
        }

        // KPIs
        const kpis = data.kpis || {};
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('kpi-total-customers', kpis.total_customers || 0);
        setVal('kpi-configured-shelves', kpis.configured_shelves || 0);
        setVal('kpi-dwell-time', kpis.avg_dwell_time_formatted || '0.0s');
        setVal('kpi-blind-spot', kpis.blind_spot_percentage || '0.0%');
        setVal('kpi-most-visited', kpis.most_visited_zone || '--');
        setVal('kpi-least-visited', kpis.least_visited_zone || '--');
        setVal('kpi-occupancy', kpis.max_occupancy || 0);
        setVal('kpi-processing-status', data.status === "NO_ANALYSIS" ? "IDLE" : "COMPLETED");

        const statusBadge = document.getElementById('kpi-status-badge');
        if (statusBadge) {
            statusBadge.className = data.status === "NO_ANALYSIS" ? "badge badge-orange" : "badge badge-green";
            statusBadge.textContent = data.status === "NO_ANALYSIS" ? "No Data" : "Ready";
        }

        // Render Shelf Charts (Visits and Dwell)
        const shelfRankings = data.shelf_rankings || [];
        const labels = shelfRankings.map(s => s.shelf_id);
        const visitCounts = shelfRankings.map(s => s.visitors);
        const dwellTimes = shelfRankings.map(s => s.avg_dwell_sec);

        if (document.getElementById('shelf-visits-chart')) {
            if (this.trafficChart) this.trafficChart.destroy();
            this.trafficChart = Charts.createBarChart('shelf-visits-chart', labels, visitCounts, 'Shopper Visits', '#F97316');
        }

        if (document.getElementById('shelf-dwell-chart')) {
            if (this.dwellChart) this.dwellChart.destroy();
            this.dwellChart = Charts.createBarChart('shelf-dwell-chart', labels, dwellTimes, 'Avg Dwell (sec)', '#3B82F6');
        }

        // Marketing Rankings Table
        const mktTbody = document.getElementById('marketing-rankings-tbody');
        if (mktTbody) {
            if (shelfRankings.length === 0) {
                mktTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No shelf tracking data for this session.</td></tr>`;
            } else {
                mktTbody.innerHTML = shelfRankings.map(s => `
                    <tr>
                        <td><span class="badge badge-orange">#${s.rank}</span></td>
                        <td><strong>${s.shelf_id}</strong></td>
                        <td>${s.visitors} shoppers</td>
                        <td><strong>${s.percentage}%</strong></td>
                        <td>${s.avg_dwell_sec}s</td>
                    </tr>
                `).join('');
            }
        }

        // Refresh Heatmap & Blind Spot images (session-specific URLs)
        const hmImg = document.getElementById('dashboard-heatmap-img');
        if (hmImg) {
            hmImg.src = data.active_session 
                ? `${API_BASE_URL}/session-image/${data.active_session}/store_heatmap.png?t=${Date.now()}`
                : `${API_BASE_URL.replace('/api', '')}/static/store_heatmap.png?t=${Date.now()}`;
        }

        const bzImg = document.getElementById('dashboard-blindzone-img');
        if (bzImg) {
            bzImg.src = data.active_session
                ? `${API_BASE_URL}/session-image/${data.active_session}/blind_zone.png?t=${Date.now()}`
                : `${API_BASE_URL.replace('/api', '')}/static/blind_zone.png?t=${Date.now()}`;
        }

        // Refresh video stream
        const streamImg = document.getElementById('dashboard-video-stream');
        if (streamImg) {
            streamImg.src = `${API_BASE_URL}/video_feed?mode=tracking&session_id=${data.active_session || ''}&t=${Date.now()}`;
        }
    },

    renderRecommendationsTable(recs) {
        const tbody = document.getElementById('dashboard-recommendations-tbody');
        if (!tbody) return;

        if (!recs || recs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No recommendations generated for this session.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recs.slice(0, 4).map(r => `
            <tr>
                <td><strong>${r.shelf}</strong><br><small style="color: var(--text-muted);">${r.category || 'Merchandising'}</small></td>
                <td><span class="badge ${r.priority === 'HIGH' ? 'badge-red' : (r.priority === 'MEDIUM' ? 'badge-orange' : 'badge-blue')}">${r.priority}</span></td>
                <td style="font-size: 12.5px;">${r.evidence}</td>
                <td style="font-size: 12.5px; color: var(--dark-orange); font-weight: 500;">${r.proposed_action}</td>
            </tr>
        `).join('');
    },

    renderOperationsTimeline(detectData) {
        if (!detectData || !document.getElementById('ops-timeline-chart')) return;

        const timeline = detectData.timeline || [];
        const timeLabels = timeline.length > 0 ? timeline.map(t => t.time) : ['00:00', '00:10', '00:20', '00:30', '00:40'];
        const values = timeline.length > 0 ? timeline.map((_, i) => (i % 3) + 1) : [1, 2, 3, 2, 1];

        if (this.opsTimelineChart) this.opsTimelineChart.destroy();
        this.opsTimelineChart = Charts.createLineChart('ops-timeline-chart', timeLabels, values, 'Shoppers in View', '#F97316');
    }
};
