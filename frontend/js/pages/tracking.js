/* RetailVision AI - Customer Tracking Page Module */

const TrackingPage = {
    render() {
        return `
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Tracking Visual Stream -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-user-tag text-orange"></i> Multi-Object Tracking (ByteTrack)</h3>
                        <span class="badge badge-orange">Continuous Identity Trails</span>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; background: #000; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
                            <img src="${API_BASE_URL}/video_feed?mode=tracking" alt="Customer Tracking Stream" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: var(--text-muted);">
                            <span>Tracker Algorithm: <strong>ByteTrack (Kalman Filter + IoU Association)</strong></span>
                            <span>Persistence: <strong>Tracklet Smoothing</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Tracking Telemetry -->
                <div style="display: flex; flex-direction: column; gap: 18px;">
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-route text-orange"></i> Tracking Telemetry Summary</h3>
                        </div>
                        <div class="card-body" style="padding: 16px 20px;">
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Observed Tracking Identifiers</span>
                                <strong id="trk-total-count" style="color: var(--text-primary); font-size: 16px;">0</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Average Walking Speed</span>
                                <strong id="trk-avg-speed" style="color: var(--primary-orange); font-size: 15px;">1.1 m/s</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; font-size: 13px;">
                                <span style="color: var(--text-muted);">Identity Re-ID Method</span>
                                <strong style="color: var(--text-primary);">Spatial-Temporal Kalman State</strong>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="flex: 1;">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-triangle-exclamation text-orange"></i> Identity Disclaimer</h3>
                        </div>
                        <div class="card-body" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
                            <p style="margin-bottom: 10px;">
                                <strong>Technical Measurement Note:</strong> Tracked IDs represent observed tracking identities maintained by ByteTrack while visual continuity is established.
                            </p>
                            <p>
                                Prolonged occlusion or camera departure will naturally assign a new tracking ID upon re-entry. No permanent biometrics or facial features are captured.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Trajectories Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-users-viewfinder text-orange"></i> Tracked Customer Trajectory Records</h3>
                    <a href="${API_BASE_URL}/report?type=tracking_csv" class="btn-outline-orange" download>
                        <i class="fa-solid fa-download"></i> Export Trajectory CSV
                    </a>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Shopper ID</th>
                                    <th>Observed Trajectory Path</th>
                                    <th>Tracked Duration</th>
                                    <th>Entry Timestamp</th>
                                    <th>Exit Timestamp</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="tracking-records-tbody">
                                <tr>
                                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading customer trajectory records...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        const data = await ApiService.getTrackingData();
        if (data) {
            const countEl = document.getElementById('trk-total-count');
            if (countEl) countEl.textContent = data.total_unique_tracked || 0;

            const tbody = document.getElementById('tracking-records-tbody');
            if (tbody) {
                const history = data.customer_flow_history || [];
                if (history.length > 0) {
                    tbody.innerHTML = history.map(item => `
                        <tr>
                            <td><strong style="color: var(--primary-orange);">Shopper #${item.customer_id}</strong></td>
                            <td style="font-weight: 500;">${item.trajectory}</td>
                            <td>${item.duration_sec}s</td>
                            <td>${item.entry_sec}s</td>
                            <td>${item.exit_sec}s</td>
                            <td><span class="badge ${item.status === 'Inside' ? 'badge-green' : 'badge-orange'}">${item.status}</span></td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                No tracked shoppers in active video clip.
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }
};
