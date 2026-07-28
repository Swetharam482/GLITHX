/* RetailVision AI - Drill-Down Details Panel Controller */

const DetailsPage = {
    activeChart: null,
    regionType: '',

    init(regionType) {
        this.regionType = regionType;
        this.bindModalActions();
        this.renderRegionCharts('daily');
    },

    bindModalActions() {
        // Time filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const timeframe = btn.getAttribute('data-timeframe');
                this.renderRegionCharts(timeframe);
            });
        });

        // Export PDF
        const btnPdf = document.getElementById('modal-export-pdf');
        if (btnPdf) {
            btnPdf.addEventListener('click', () => {
                window.open(ApiService.getReportDownloadUrl('pdf'));
            });
        }

        // Export CSV
        const btnCsv = document.getElementById('modal-export-csv');
        if (btnCsv) {
            btnCsv.addEventListener('click', () => {
                window.open(ApiService.getReportDownloadUrl('tracking_csv'));
            });
        }

        // Print page
        const btnPrint = document.getElementById('modal-print');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                window.print();
            });
        }
    },

    renderRegionCharts(timeframe) {
        if (this.activeChart) {
            this.activeChart.destroy();
            this.activeChart = null;
        }

        const canvasId = 'modal-details-chart';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Custom time-series datasets based on active region type and filters
        let labels = [];
        let dataset1 = [];
        let dataset2 = [];
        let label1 = '';
        let label2 = '';

        if (this.regionType === 'high_traffic_region_analysis') {
            label1 = 'Aisle Traffic Count';
            label2 = 'Shelf B Occupancy Rate (%)';
            if (timeframe === 'daily') {
                labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
                dataset1 = [45, 80, 110, 150, 184, 160, 95, 30];
                dataset2 = [20, 35, 60, 85, 88, 70, 45, 15];
            } else if (timeframe === 'weekly') {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                dataset1 = [820, 950, 890, 920, 1150, 1420, 1280];
                dataset2 = [65, 70, 68, 72, 85, 92, 88];
            } else {
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                dataset1 = [3200, 3500, 4100, 3800];
                dataset2 = [72, 75, 84, 78];
            }
            this.activeChart = Charts.createLineChart(canvasId, labels, dataset1, dataset2, label1, label2, '#ef4444', '#3b82f6');

        } else if (this.regionType === 'low_traffic_region_analysis') {
            label1 = 'Idle Period (min)';
            if (timeframe === 'daily') {
                labels = ['Shelf C Aisle', 'Rear Corridor', 'Entrance Corner', 'Checkout Queue Left'];
                dataset1 = [45, 85, 30, 20];
            } else if (timeframe === 'weekly') {
                labels = ['Shelf C Aisle', 'Rear Corridor', 'Entrance Corner', 'Checkout Queue Left'];
                dataset1 = [310, 520, 210, 150];
            } else {
                labels = ['Shelf C Aisle', 'Rear Corridor', 'Entrance Corner', 'Checkout Queue Left'];
                dataset1 = [1200, 2100, 850, 620];
            }
            this.activeChart = Charts.createBarChart(canvasId, labels, dataset1, label1, '#64748b');

        } else if (this.regionType === 'underperforming_shelf_analysis') {
            label1 = 'Interactions Rate (%)';
            label2 = 'Average Dwell (sec)';
            if (timeframe === 'daily') {
                labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
                dataset1 = [15, 22, 24, 28, 24, 20, 18, 12];
                dataset2 = [40, 55, 60, 65, 62, 58, 48, 30];
            } else if (timeframe === 'weekly') {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                dataset1 = [18, 20, 21, 24, 26, 28, 25];
                dataset2 = [50, 52, 55, 60, 68, 72, 65];
            } else {
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                dataset1 = [20, 23, 25, 22];
                dataset2 = [55, 62, 64, 58];
            }
            this.activeChart = Charts.createLineChart(canvasId, labels, dataset1, dataset2, label1, label2, '#f59e0b', '#8b5cf6');

        } else if (this.regionType === 'dwell_time_analytics') {
            label1 = 'Shelf B Dwell (min)';
            label2 = 'Shelf A Dwell (min)';
            if (timeframe === 'daily') {
                labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
                dataset1 = [1.8, 2.4, 2.9, 3.2, 3.0, 2.8, 2.1, 1.2];
                dataset2 = [1.2, 1.8, 2.1, 2.3, 2.5, 2.1, 1.8, 0.9];
            } else if (timeframe === 'weekly') {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                dataset1 = [2.2, 2.6, 2.8, 3.1, 3.4, 3.9, 3.6];
                dataset2 = [1.5, 1.9, 2.1, 2.4, 2.6, 3.0, 2.8];
            } else {
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                dataset1 = [2.8, 3.0, 3.5, 3.2];
                dataset2 = [2.0, 2.2, 2.6, 2.4];
            }
            this.activeChart = Charts.createLineChart(canvasId, labels, dataset1, dataset2, label1, label2, '#8b5cf6', '#3b82f6');

        } else if (this.regionType === 'traffic_distribution_&_layout_analysis') {
            label1 = 'Transition Rate (%)';
            if (timeframe === 'daily') {
                labels = ['Aisle A to D', 'Aisle B to C', 'Aisle A to Checkout', 'Aisle D to Checkout'];
                dataset1 = [42, 25, 68, 85];
            } else if (timeframe === 'weekly') {
                labels = ['Aisle A to D', 'Aisle B to C', 'Aisle A to Checkout', 'Aisle D to Checkout'];
                dataset1 = [45, 28, 62, 80];
            } else {
                labels = ['Aisle A to D', 'Aisle B to C', 'Aisle A to Checkout', 'Aisle D to Checkout'];
                dataset1 = [40, 22, 65, 82];
            }
            this.activeChart = Charts.createBarChart(canvasId, labels, dataset1, label1, '#06b6d4');
        }
    },

    // Modal Content Templates
    getHighTrafficTemplate() {
        return `
            <div class="detail-filters">
                <button class="filter-btn active" data-timeframe="daily">Daily</button>
                <button class="filter-btn" data-timeframe="weekly">Weekly</button>
                <button class="filter-btn" data-timeframe="monthly">Monthly</button>
            </div>
            
            <div class="detail-chart-wrapper">
                <canvas id="modal-details-chart"></canvas>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top:10px;">
                <div class="stat-item">
                    <label>Zone Name</label>
                    <span>Shelf B Beverages Center</span>
                </div>
                <div class="stat-item">
                    <label>Visits Today</label>
                    <span>184 Shoppers</span>
                </div>
                <div class="stat-item">
                    <label>Congestion Risk</label>
                    <span style="color:var(--yellow)">Moderate (42s Queue)</span>
                </div>
            </div>

            <div style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239,68,68,0.2); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#e2e8f0;">
                <strong style="color:var(--red); display:block; margin-bottom:6px;"><i class="fa-solid fa-triangle-exclamation"></i> Analytics Observations</strong>
                Beverages and snacks corridors experience path friction. The walking velocity drops to 0.4 m/s in front of Shelf B during peak hours (14:00 - 15:00) due to customer browsing overlaps. Open auxiliary checkout lanes to disperse crowds.
            </div>

            <div class="detail-grid-actions">
                <button class="btn-secondary" id="modal-print"><i class="fa-solid fa-print"></i> Print Chart</button>
                <button class="btn-secondary" id="modal-export-csv"><i class="fa-solid fa-file-csv"></i> Export CSV Data</button>
                <button class="btn-primary" id="modal-export-pdf"><i class="fa-solid fa-file-pdf"></i> Download PDF Report</button>
            </div>
        `;
    },

    getLowTrafficTemplate() {
        return `
            <div class="detail-filters">
                <button class="filter-btn active" data-timeframe="daily">Daily</button>
                <button class="filter-btn" data-timeframe="weekly">Weekly</button>
                <button class="filter-btn" data-timeframe="monthly">Monthly</button>
            </div>
            
            <div class="detail-chart-wrapper">
                <canvas id="modal-details-chart"></canvas>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top:10px;">
                <div class="stat-item">
                    <label>Bypassed Zone</label>
                    <span>Shelf C Produce Corner</span>
                </div>
                <div class="stat-item">
                    <label>Dwell Impact</label>
                    <span style="color:var(--red)">-84.2% vs Shelf B</span>
                </div>
                <div class="stat-item">
                    <label>Idle Percentage</label>
                    <span>85.0% of Day Empty</span>
                </div>
            </div>

            <div style="background:rgba(255, 255, 255, 0.02); border:1px solid var(--border-card); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#cbd5e1;">
                <strong style="color:var(--cyan); display:block; margin-bottom:6px;"><i class="fa-solid fa-circle-info"></i> Layout Insights</strong>
                Customer flow charts indicate shoppers walk directly from snacks to checkout, skipping the Produce section. Relocate seasonal promotions or visual signage tags onto the Shelf C pillar to attract density.
            </div>

            <div class="detail-grid-actions">
                <button class="btn-secondary" id="modal-print"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn-secondary" id="modal-export-csv"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                <button class="btn-primary" id="modal-export-pdf"><i class="fa-solid fa-file-pdf"></i> Download PDF Report</button>
            </div>
        `;
    },

    getUnderperformTemplate() {
        return `
            <div class="detail-filters">
                <button class="filter-btn active" data-timeframe="daily">Daily</button>
                <button class="filter-btn" data-timeframe="weekly">Weekly</button>
                <button class="filter-btn" data-timeframe="monthly">Monthly</button>
            </div>
            
            <div class="detail-chart-wrapper">
                <canvas id="modal-details-chart"></canvas>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top:10px;">
                <div class="stat-item">
                    <label>Shelf Under Review</label>
                    <span>Shelf C (Produce)</span>
                </div>
                <div class="stat-item">
                    <label>Interaction rate</label>
                    <span style="color:var(--red)">24.1% Today</span>
                </div>
                <div class="stat-item">
                    <label>Avg Browse Period</label>
                    <span>42 Seconds</span>
                </div>
            </div>

            <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245,158,11,0.25); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#cbd5e1;">
                <strong style="color:var(--yellow); display:block; margin-bottom:6px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Optimization Recommendation</strong>
                Visits to Shelf C produce area are brief, and customer conversion rates remain low (25%). Cross-merchandise promotional discount signs from snacks or baked goods to attract visitors.
            </div>

            <div class="detail-grid-actions">
                <button class="btn-secondary" id="modal-print"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn-secondary" id="modal-export-csv"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                <button class="btn-primary" id="modal-export-pdf"><i class="fa-solid fa-file-pdf"></i> Download Report</button>
            </div>
        `;
    },

    getDwellTimeTemplate() {
        return `
            <div class="detail-filters">
                <button class="filter-btn active" data-timeframe="daily">Daily</button>
                <button class="filter-btn" data-timeframe="weekly">Weekly</button>
                <button class="filter-btn" data-timeframe="monthly">Monthly</button>
            </div>
            
            <div class="detail-chart-wrapper">
                <canvas id="modal-details-chart"></canvas>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top:10px;">
                <div class="stat-item">
                    <label>Highest Shelf Dwell</label>
                    <span>Shelf B (3.2 min)</span>
                </div>
                <div class="stat-item">
                    <label>Second Shelf Dwell</label>
                    <span>Shelf A (2.4 min)</span>
                </div>
                <div class="stat-item">
                    <label>Queue Delay Impact</label>
                    <span>Checkout Lane: 4.2 min</span>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.01); border:1px solid var(--border-card); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#cbd5e1;">
                <strong style="color:var(--purple); display:block; margin-bottom:6px;"><i class="fa-solid fa-clock"></i> Temporal Analytics Summary</strong>
                Shoppers are spending the longest duration reviewing beverages and snack varieties, suggesting wide product varieties stimulate browse actions. Layout remains functional with normal queueing times.
            </div>

            <div class="detail-grid-actions">
                <button class="btn-secondary" id="modal-print"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn-secondary" id="modal-export-csv"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                <button class="btn-primary" id="modal-export-pdf"><i class="fa-solid fa-file-pdf"></i> Download PDF Report</button>
            </div>
        `;
    },

    getDistributionTemplate() {
        return `
            <div class="detail-filters">
                <button class="filter-btn active" data-timeframe="daily">Daily</button>
                <button class="filter-btn" data-timeframe="weekly">Weekly</button>
                <button class="filter-btn" data-timeframe="monthly">Monthly</button>
            </div>
            
            <div class="detail-chart-wrapper">
                <canvas id="modal-details-chart"></canvas>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top:10px;">
                <div class="stat-item">
                    <label>Entrance to Aisle A rate</label>
                    <span>68.0% (Snacks Preferred)</span>
                </div>
                <div class="stat-item">
                    <label>Entrance to Aisle C rate</label>
                    <span>22.0% (Produce Avoided)</span>
                </div>
                <div class="stat-item">
                    <label>Aisle D to Checkout</label>
                    <span>85.0% Conversion Path</span>
                </div>
            </div>

            <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#cbd5e1;">
                <strong style="color:var(--cyan); display:block; margin-bottom:6px;"><i class="fa-solid fa-route"></i> Store Flow Path Observations</strong>
                Shopper flow highlights indicate customers preferred traversing counter-clockwise from Entrance -> Snacks -> Beverages -> Checkout. Adjust promotional racks inside snacks aisle to steer shopper density vectors clockwise.
            </div>

            <div class="detail-grid-actions">
                <button class="btn-secondary" id="modal-print"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn-secondary" id="modal-export-csv"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                <button class="btn-primary" id="modal-export-pdf"><i class="fa-solid fa-file-pdf"></i> Download PDF Report</button>
            </div>
        `;
    },

    destroy() {
        if (this.activeChart) {
            this.activeChart.destroy();
            this.activeChart = null;
        }
    }
};
