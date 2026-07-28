/* RetailVision AI - Multiple Object Tracking Page View */

const TrackingPage = {
    pollingInterval: null,
    isStreaming: false,

    render() {
        return `
            <div class="video-analytics-wrapper">
                <!-- Video Player Card -->
                <div class="glass-card player-card">
                    <div class="card-header" style="padding:0 0 15px 0; border-bottom:1px solid var(--border-card)">
                        <h3 style="font-size:16px"><i class="fa-solid fa-user-tag text-blue"></i> ByteTrack Multiple Object Tracking</h3>
                    </div>
                    
                    <div class="video-player-container" id="tracking-video-container">
                        <span class="live-badge" id="tracking-live-badge" style="display:none; background:rgba(59,130,246,0.85)">
                            <span class="status-dot green animate-blink" style="background:#fff"></span>TRACKING ACTIVE
                        </span>
                        <!-- Default placeholder -->
                        <img id="tracking-feed" src="http://127.0.0.1:5000/static/store_heatmap.png" style="opacity: 0.45; object-fit: cover;" alt="Click Start Tracking to begin stream">
                    </div>

                    <!-- Video Controls -->
                    <div class="video-controls">
                        <button class="btn-primary" style="background:var(--blue); color:#fff;" id="btn-start-track"><i class="fa-solid fa-play"></i> Start Tracking</button>
                        <button class="btn-danger" id="btn-stop-track" disabled><i class="fa-solid fa-stop"></i> Stop Tracking</button>
                    </div>
                </div>

                <!-- Live Tracking Statistics Side Panel -->
                <div class="stats-panel">
                    <div class="glass-card" style="padding:20px;">
                        <h4 style="font-size:14px; font-family:var(--font-heading); color:var(--cyan); margin-bottom:15px; border-bottom:1px solid var(--border-card); padding-bottom:8px;">
                            Tracking Diagnostics
                        </h4>
                        <div style="display:flex; flex-direction:column; gap:14px;">
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Active Customers</span>
                                <span style="font-weight:700; color:#ffffff;" id="track-active-count">0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Total Customers</span>
                                <span style="font-weight:700; color:#ffffff;" id="track-total-count">0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Re-ID Accuracy</span>
                                <span style="font-weight:700; color:var(--green);" id="track-accuracy">98.2%</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Avg Tracking Dwell</span>
                                <span style="font-weight:700; color:var(--cyan);" id="track-dwell">12.8 min</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Tracking Frame Rate</span>
                                <span style="font-weight:700; color:#ffffff;" id="track-fps">30.0 FPS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shopper Trajectory & Flow History Table -->
            <div class="glass-card tracking-table-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-route text-purple"></i> Customer Movement Flow Trajectories</h3>
                </div>
                <div class="card-body">
                    <div class="tracking-table-container">
                        <table class="tracking-table">
                            <thead>
                                <tr>
                                    <th>Customer ID</th>
                                    <th>Trajectory Path Visualization</th>
                                    <th>Walking Speed</th>
                                    <th>Entry Time</th>
                                    <th>Total Dwell</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="tracking-table-rows">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        this.bindEvents();
        this.startPolling();
    },

    bindEvents() {
        const startBtn = document.getElementById('btn-start-track');
        const stopBtn = document.getElementById('btn-stop-track');
        const feedImg = document.getElementById('tracking-feed');
        const liveBadge = document.getElementById('tracking-live-badge');

        startBtn.addEventListener('click', async () => {
            const res = await ApiService.startTracking();
            if (res && !res.error) {
                this.isStreaming = true;
                feedImg.src = ApiService.getVideoFeedUrl('tracking');
                feedImg.style.opacity = "1";
                liveBadge.style.display = "flex";
                startBtn.disabled = true;
                stopBtn.disabled = false;
            }
        });

        stopBtn.addEventListener('click', async () => {
            const res = await ApiService.stopTracking();
            if (res && !res.error) {
                this.isStreaming = false;
                feedImg.src = "http://127.0.0.1:5000/static/store_heatmap.png";
                feedImg.style.opacity = "0.45";
                liveBadge.style.display = "none";
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        });
    },

    startPolling() {
        const poll = async () => {
            const data = await ApiService.getTrackingData();
            if (data) {
                document.getElementById('track-active-count').textContent = data.active_tracked_customers;
                document.getElementById('track-total-count').textContent = data.total_tracked_customers;
                document.getElementById('track-accuracy').textContent = data.reidentification_accuracy;
                document.getElementById('track-dwell').textContent = data.average_tracking_time;
                document.getElementById('track-fps').textContent = `${data.tracking_fps.toFixed(1)} FPS`;

                // Update Trajectories table
                const tableBody = document.getElementById('tracking-table-rows');
                if (tableBody) {
                    tableBody.innerHTML = data.customer_flow_history.map(row => {
                        // Split path to draw pretty arrows and boxes
                        const nodes = row.trajectory.split(' -> ');
                        const pathHtml = nodes.map((n, i) => {
                            let color = 'var(--slate)';
                            if (n.includes('Shelf A')) color = 'var(--purple)';
                            else if (n.includes('Shelf B')) color = 'var(--blue)';
                            else if (n.includes('Shelf C')) color = 'var(--cyan)';
                            else if (n.includes('Shelf D')) color = 'var(--yellow)';
                            else if (n.includes('Checkout')) color = 'var(--red)';
                            else if (n.includes('Entrance') || n.includes('Exit')) color = 'var(--green)';

                            const nodeSpan = `<span class="badge-zone" style="background:${color}20; color:${color}; border:1px solid ${color}40">${n}</span>`;
                            const arrow = i < nodes.length - 1 ? ' <i class="fa-solid fa-chevron-right" style="color:var(--slate); font-size:10px; margin:0 4px"></i> ' : '';
                            return nodeSpan + arrow;
                        }).join('');

                        return `
                            <tr>
                                <td style="font-weight:700; color:var(--cyan)">#${row.customer_id}</td>
                                <td>${pathHtml}</td>
                                <td><i class="fa-solid fa-gauge-high text-slate"></i> ${row.walking_speed}</td>
                                <td>${row.entry_time}</td>
                                <td>${row.dwell_time}</td>
                                <td>
                                    <span class="badge-zone" style="background:rgba(16,185,129,0.15); color:var(--green); border:1px solid rgba(16,185,129,0.25)">
                                        <i class="fa-solid fa-check"></i> ${row.exit_status}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        };

        poll();
        this.pollingInterval = setInterval(poll, 2000);
    },

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
};
