/* RetailVision AI - Dashboard Page View */

const DashboardPage = {
    doughnutChart: null,

    render() {
        return `
            <!-- 6 KPI Grid Cards -->
            <div class="kpi-grid">
                <!-- KPI 1: Customers -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>TOTAL CUSTOMERS</span>
                        <div class="kpi-icon"><i class="fa-solid fa-users"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-total-customers">0</span>
                        <span class="kpi-trend up" id="trend-total-customers"><i class="fa-solid fa-arrow-trend-up"></i> +0.0%</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-total-customers"></canvas>
                    </div>
                </div>

                <!-- KPI 2: Dwell Time -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>AVG DWELL TIME</span>
                        <div class="kpi-icon"><i class="fa-solid fa-user-clock"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-dwell-time">0.0 min</span>
                        <span class="kpi-trend up" id="trend-dwell-time"><i class="fa-solid fa-arrow-trend-up"></i> +0.0%</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-dwell-time"></canvas>
                    </div>
                </div>

                <!-- KPI 3: Shelf Engagement -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>SHELF ENGAGEMENT</span>
                        <div class="kpi-icon"><i class="fa-solid fa-hand-pointer"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-shelf-engagement">0.0%</span>
                        <span class="kpi-trend up" id="trend-shelf-engagement"><i class="fa-solid fa-arrow-trend-up"></i> +0.0%</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-shelf-engagement"></canvas>
                    </div>
                </div>

                <!-- KPI 4: Blind Spot Footprint -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>BLIND SPOT %</span>
                        <div class="kpi-icon"><i class="fa-solid fa-eye-slash"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-blind-spot">0.0%</span>
                        <span class="kpi-trend down" id="trend-blind-spot"><i class="fa-solid fa-arrow-trend-down"></i> -0.0%</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-blind-spot"></canvas>
                    </div>
                </div>

                <!-- KPI 5: Conversion Rate -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>CONVERSION RATE</span>
                        <div class="kpi-icon"><i class="fa-solid fa-cart-shopping"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-conversion-rate">0.0%</span>
                        <span class="kpi-trend up" id="trend-conversion-rate"><i class="fa-solid fa-arrow-trend-up"></i> +0.0%</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-conversion-rate"></canvas>
                    </div>
                </div>

                <!-- KPI 6: Active Cameras -->
                <div class="glass-card kpi-card">
                    <div class="kpi-header">
                        <span>ACTIVE CAMERAS</span>
                        <div class="kpi-icon"><i class="fa-solid fa-video"></i></div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-number" id="kpi-active-cameras">0</span>
                        <span class="kpi-trend stable" id="trend-active-cameras">Stable</span>
                    </div>
                    <div class="kpi-footer">
                        <canvas class="sparkline-canvas" id="spark-active-cameras"></canvas>
                    </div>
                </div>
            </div>

            <!-- 5 Large Analytics Cards -->
            <div class="analytics-grid">
                <!-- Card 1: High Traffic -->
                <div class="glass-card analytics-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-fire text-red"></i> High Traffic Region</h3>
                    </div>
                    <div class="card-body">
                        <div class="live-preview-container">
                            <span class="live-badge"><span class="status-dot green animate-blink" style="background:#fff"></span>CAM-03 LIVE</span>
                            <img src="http://127.0.0.1:5000/api/video_feed?mode=tracking" alt="CCTV Central camera stream">
                        </div>
                        <div class="stats-box">
                            <div class="stat-item">
                                <label>Active Customers</label>
                                <span id="high-traffic-count">184 Today</span>
                            </div>
                            <div class="stat-item">
                                <label>Peak Traffic Hour</label>
                                <span id="high-traffic-peak">14:00 - 15:00</span>
                            </div>
                            <div class="stat-item">
                                <label>Traffic Density</label>
                                <span id="high-traffic-density">High (88%)</span>
                            </div>
                            <div class="stat-item">
                                <label>Most Visited Shelf</label>
                                <span id="high-traffic-shelf" class="text-cyan">Shelf B</span>
                            </div>
                        </div>
                        <p class="summary-desc" id="high-traffic-desc">
                            The central aisle shows high density. Beverages & Snacks shelves see constant visits.
                        </p>
                    </div>
                    <div class="card-action-bar">
                        <button class="btn-details" id="btn-details-high-traffic">
                            More Details <i class="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>
                </div>

                <!-- Card 2: Low Traffic -->
                <div class="glass-card analytics-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-temperature-empty text-slate"></i> Low Traffic Region</h3>
                    </div>
                    <div class="card-body">
                        <div class="live-preview-container">
                            <span class="live-badge" style="background:rgba(100,116,139,0.85)"><span class="status-dot animate-blink" style="background:#fff"></span>CAM-01 LIVE</span>
                            <img src="http://127.0.0.1:5000/api/video_feed?mode=detection" alt="CCTV Rear camera stream">
                        </div>
                        <div class="stats-box">
                            <div class="stat-item">
                                <label>Active Customers</label>
                                <span id="low-traffic-count">12 Today</span>
                            </div>
                            <div class="stat-item">
                                <label>Idle Percentage</label>
                                <span id="low-traffic-idle">85%</span>
                            </div>
                            <div class="stat-item">
                                <label>Low Engaged Areas</label>
                                <span id="low-traffic-engaged">Shelf C Corner</span>
                            </div>
                            <div class="stat-item">
                                <label>Neglected Regions</label>
                                <span id="low-traffic-neglected" class="text-red">Produce Rear</span>
                            </div>
                        </div>
                        <p class="summary-desc" id="low-traffic-desc">
                            Produce corner exhibits minimal occupancy. Aisle pathways leading to Shelf C show low transition density.
                        </p>
                    </div>
                    <div class="card-action-bar">
                        <button class="btn-details" id="btn-details-low-traffic">
                            More Details <i class="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>
                </div>

                <!-- Card 3: Underperforming Shelf -->
                <div class="glass-card analytics-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-triangle-exclamation text-yellow"></i> Underperforming Shelf</h3>
                    </div>
                    <div class="card-body">
                        <div class="live-preview-container">
                            <span class="live-badge" style="background:rgba(217,119,6,0.85)"><span class="status-dot animate-blink" style="background:#fff"></span>CAM-04 LIVE</span>
                            <!-- Show static blueprint placeholder with overlay highlights -->
                            <img src="http://127.0.0.1:5000/static/blind_zone.png" alt="Shelf camera preview">
                        </div>
                        <div class="stats-box">
                            <div class="stat-item">
                                <label>Shelf Name</label>
                                <span id="underperform-name">Shelf C (Produce)</span>
                            </div>
                            <div class="stat-item">
                                <label>Interactions</label>
                                <span id="underperform-clicks">42 Today</span>
                            </div>
                            <div class="stat-item">
                                <label>Engagement Rate</label>
                                <span id="underperform-rate" class="text-red">24.1%</span>
                            </div>
                            <div class="stat-item">
                                <label>AI Recommendation</label>
                                <span id="underperform-rec" class="text-cyan">Promotions</span>
                            </div>
                        </div>
                        <p class="summary-desc" id="underperform-desc">
                            Dwell times at Shelf C are extremely low. Suggesting rearranging stock layouts.
                        </p>
                    </div>
                    <div class="card-action-bar">
                        <button class="btn-details" id="btn-details-underperform">
                            More Details <i class="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>
                </div>

                <!-- Card 4: Dwell Time Per Shelf -->
                <div class="glass-card analytics-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-hourglass-half text-purple"></i> Dwell Time Per Shelf</h3>
                    </div>
                    <div class="card-body">
                        <div class="live-preview-container">
                            <!-- Matplotlib generated heatmap -->
                            <img src="http://127.0.0.1:5000/static/store_heatmap.png" alt="Heatmap preview">
                        </div>
                        <div class="stats-box">
                            <div class="stat-item">
                                <label>Target Shelf</label>
                                <span id="dwell-shelf-name">Shelf B</span>
                            </div>
                            <div class="stat-item">
                                <label>Avg Dwell Time</label>
                                <span id="dwell-shelf-avg">3.2 min</span>
                            </div>
                            <div class="stat-item">
                                <label>Max Dwell Today</label>
                                <span id="dwell-shelf-max">15.4 min</span>
                            </div>
                            <div class="stat-item">
                                <label>Min Dwell Today</label>
                                <span id="dwell-shelf-min">0.2 min</span>
                            </div>
                        </div>
                        <p class="summary-desc" id="dwell-desc">
                            Shelf B beverages experiences long dwell periods as shoppers choose between energy drinks and soda options.
                        </p>
                    </div>
                    <div class="card-action-bar">
                        <button class="btn-details" id="btn-details-dwell">
                            More Details <i class="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>
                </div>

                <!-- Card 5: Customer Traffic Distribution -->
                <div class="glass-card analytics-card analytics-card-large">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-chart-pie text-cyan"></i> Customer Traffic Distribution</h3>
                    </div>
                    <div class="card-body" style="flex-direction: row; gap: 20px;">
                        <div style="flex: 1.2; position: relative; height: 100%;">
                            <canvas id="distribution-pie-chart"></canvas>
                        </div>
                        <div style="flex: 0.8; display: flex; flex-direction: column; justify-content: center; gap: 14px;">
                            <h4 style="font-size: 13px; color: #94a3b8; font-weight: 500;">Zone-wise Occupancy Ratio</h4>
                            <div style="display: flex; flex-direction: column; gap: 10px;" id="distribution-stats-list">
                                <!-- Populated dynamically -->
                            </div>
                            <p class="summary-desc" style="margin-top: 10px;" id="distribution-desc">
                                Drinks and Snacks sectors represent 65% of customer presence footprint today.
                            </p>
                        </div>
                    </div>
                    <div class="card-action-bar">
                        <button class="btn-details" id="btn-details-distribution">
                            More Details <i class="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        this.bindCardDetails();
    },

    bindCardDetails() {
        // High traffic detailed panel
        document.getElementById('btn-details-high-traffic').addEventListener('click', () => {
            App.showModal('HIGH TRAFFIC', 'High Traffic Region Analysis', DetailsPage.getHighTrafficTemplate());
        });

        // Low traffic detailed panel
        document.getElementById('btn-details-low-traffic').addEventListener('click', () => {
            App.showModal('LOW TRAFFIC', 'Low Traffic Region Analysis', DetailsPage.getLowTrafficTemplate());
        });

        // Underperforming Shelf detailed panel
        document.getElementById('btn-details-underperform').addEventListener('click', () => {
            App.showModal('UNDERPERFORMING', 'Underperforming Shelf Analysis', DetailsPage.getUnderperformTemplate());
        });

        // Dwell Time detailed panel
        document.getElementById('btn-details-dwell').addEventListener('click', () => {
            App.showModal('DWELL TIME', 'Dwell Time Analytics', DetailsPage.getDwellTimeTemplate());
        });

        // Traffic Distribution detailed panel
        document.getElementById('btn-details-distribution').addEventListener('click', () => {
            App.showModal('TRAFFIC FLOW', 'Traffic Distribution & Layout Analysis', DetailsPage.getDistributionTemplate());
        });
    },

    update(data) {
        if (!data) return;

        // 1. Update KPI Card numbers
        this.animateValue('kpi-total-customers', data.kpis.total_customers.value);
        
        document.getElementById('kpi-dwell-time').textContent = data.kpis.avg_dwell_time.value;
        document.getElementById('kpi-shelf-engagement').textContent = data.kpis.shelf_engagement.value;
        document.getElementById('kpi-blind-spot').textContent = data.kpis.blind_spot_percentage.value;
        document.getElementById('kpi-conversion-rate').textContent = data.kpis.conversion_rate.value;
        document.getElementById('kpi-active-cameras').textContent = data.kpis.active_cameras.value;

        // 2. Update trends
        this.updateTrend('trend-total-customers', data.kpis.total_customers);
        this.updateTrend('trend-dwell-time', data.kpis.avg_dwell_time);
        this.updateTrend('trend-shelf-engagement', data.kpis.shelf_engagement);
        this.updateTrend('trend-blind-spot', data.kpis.blind_spot_percentage);
        this.updateTrend('trend-conversion-rate', data.kpis.conversion_rate);

        // 3. Draw Sparklines
        Charts.drawSparkline(document.getElementById('spark-total-customers'), data.kpis.total_customers.sparkline, '#3b82f6');
        Charts.drawSparkline(document.getElementById('spark-dwell-time'), data.kpis.avg_dwell_time.sparkline, '#8b5cf6');
        Charts.drawSparkline(document.getElementById('spark-shelf-engagement'), data.kpis.shelf_engagement.sparkline, '#06b6d4');
        Charts.drawSparkline(document.getElementById('spark-blind-spot'), data.kpis.blind_spot_percentage.sparkline, '#f59e0b');
        Charts.drawSparkline(document.getElementById('spark-conversion-rate'), data.kpis.conversion_rate.sparkline, '#10b981');
        Charts.drawSparkline(document.getElementById('spark-active-cameras'), data.kpis.active_cameras.sparkline, '#64748b');

        // 4. Update Large Cards
        // High Traffic
        document.getElementById('high-traffic-count').textContent = `${data.regions.high_traffic.customers} Customers`;
        document.getElementById('high-traffic-peak').textContent = data.regions.high_traffic.peak_hour;
        document.getElementById('high-traffic-density').textContent = data.regions.high_traffic.density;
        document.getElementById('high-traffic-shelf').textContent = data.regions.high_traffic.most_visited;
        document.getElementById('high-traffic-desc').textContent = data.regions.high_traffic.summary;

        // Low Traffic
        document.getElementById('low-traffic-count').textContent = `${data.regions.low_traffic.customers} Customers`;
        document.getElementById('low-traffic-idle').textContent = data.regions.low_traffic.idle_percentage;
        document.getElementById('low-traffic-engaged').textContent = data.regions.low_traffic.low_engagement_areas;
        document.getElementById('low-traffic-neglected').textContent = data.regions.low_traffic.neglected_regions;
        document.getElementById('low-traffic-desc').textContent = data.regions.low_traffic.summary;

        // Underperforming
        document.getElementById('underperform-name').textContent = data.regions.underperforming_shelf.shelf_number;
        document.getElementById('underperform-clicks').textContent = `${data.regions.underperforming_shelf.customer_interactions} Visits`;
        document.getElementById('underperform-rate').textContent = data.regions.underperforming_shelf.engagement_rate;
        document.getElementById('underperform-rec').textContent = data.regions.underperforming_shelf.recommendation_preview;
        document.getElementById('underperform-desc').textContent = data.regions.underperforming_shelf.summary;

        // Dwell Time
        document.getElementById('dwell-shelf-name').textContent = data.regions.dwell_time_shelf.shelf_name;
        document.getElementById('dwell-shelf-avg').textContent = data.regions.dwell_time_shelf.avg_dwell;
        document.getElementById('dwell-shelf-max').textContent = data.regions.dwell_time_shelf.max_dwell;
        document.getElementById('dwell-shelf-min').textContent = data.regions.dwell_time_shelf.min_dwell;
        document.getElementById('dwell-desc').textContent = data.regions.dwell_time_shelf.summary;

        // 5. Update Distribution Doughnut Chart
        const labels = data.regions.traffic_distribution.zone_distribution.map(d => d.zone);
        const percentages = data.regions.traffic_distribution.zone_distribution.map(d => d.percentage);
        const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'];

        if (!this.doughnutChart) {
            this.doughnutChart = Charts.createDoughnutChart('distribution-pie-chart', labels, percentages, colors);
        } else {
            this.doughnutChart.data.labels = labels;
            this.doughnutChart.data.datasets[0].data = percentages;
            this.doughnutChart.update();
        }

        // Render Sidebar Info list for Doughnut
        const statsList = document.getElementById('distribution-stats-list');
        if (statsList) {
            statsList.innerHTML = data.regions.traffic_distribution.zone_distribution.map((d, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${colors[i]}"></span>
                        <span style="color: #cbd5e1">${d.zone}</span>
                    </div>
                    <span style="font-weight: 700; color: #ffffff">${d.percentage}%</span>
                </div>
            `).join('');
        }
    },

    animateValue(id, targetValue) {
        const el = document.getElementById(id);
        if (!el) return;
        
        const currentValue = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
        if (currentValue === targetValue) return;

        const duration = 800; // ms
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const val = Math.floor(progress * (targetValue - currentValue) + currentValue);
            el.textContent = val.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    },

    updateTrend(id, kpiData) {
        const el = document.getElementById(id);
        if (!el) return;

        el.textContent = ` ${kpiData.trend}`;
        el.className = `kpi-trend ${kpiData.trend_direction}`;

        if (kpiData.trend_direction === 'up') {
            el.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${kpiData.trend}`;
        } else if (kpiData.trend_direction === 'down') {
            el.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> ${kpiData.trend}`;
        } else {
            el.innerHTML = kpiData.trend;
        }
    },

    destroy() {
        if (this.doughnutChart) {
            this.doughnutChart.destroy();
            this.doughnutChart = null;
        }
    }
};
