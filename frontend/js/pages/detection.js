/* RetailVision AI - Customer Detection Page Module */

const DetectionPage = {
    render() {
        return `
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Real-Time Detection Video Stream -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-person-rays text-orange"></i> Live Person Detection Visual Feed</h3>
                        <span class="badge badge-green">YOLOv8 Active</span>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; background: #000; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
                            <img src="${API_BASE_URL}/video_feed?mode=detection" alt="Person Detection Feed" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: var(--text-muted);">
                            <span>Class: <strong>person (COCO Class 0)</strong></span>
                            <span>Bounding Box Format: <strong>[x1, y1, x2, y2]</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Detection Metrics & Specs -->
                <div style="display: flex; flex-direction: column; gap: 18px;">
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-sliders text-orange"></i> Detection Pipeline Telemetry</h3>
                        </div>
                        <div class="card-body" style="padding: 16px 20px;">
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Total Observed Detections</span>
                                <strong id="det-total-count" style="color: var(--text-primary); font-size: 16px;">0</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Peak Concurrent Shoppers</span>
                                <strong id="det-max-occupancy" style="color: var(--primary-orange); font-size: 16px;">0</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Confidence Threshold</span>
                                <strong id="det-conf-thresh" style="color: var(--text-primary);">0.25 (25%)</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; font-size: 13px;">
                                <span style="color: var(--text-muted);">Camera Stream Status</span>
                                <span class="badge badge-green">ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="flex: 1;">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-circle-info text-orange"></i> Detection Methodology</h3>
                        </div>
                        <div class="card-body" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
                            <p style="margin-bottom: 10px;">
                                <strong>Anonymized Computer Vision:</strong> The detection pipeline strictly evaluates person bounding boxes and foot ground-plane coordinates. No facial recognition or biometric identification is performed.
                            </p>
                            <p>
                                Detections are localized per frame and passed to ByteTrack to maintain continuous spatial trajectories across the store floor plan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detection Events Timeline Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-timeline text-orange"></i> Shopper Arrival & Movement Events Timeline</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Video Timestamp</th>
                                    <th>Event Description</th>
                                    <th>Detected Retail Zone</th>
                                </tr>
                            </thead>
                            <tbody id="detection-timeline-tbody">
                                <tr>
                                    <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading detection event timeline...
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
        const data = await ApiService.getPersonDetection();
        if (data) {
            const totalEl = document.getElementById('det-total-count');
            if (totalEl) totalEl.textContent = data.total_detections || 0;

            const maxOccEl = document.getElementById('det-max-occupancy');
            if (maxOccEl) maxOccEl.textContent = data.max_occupancy || 0;

            const confEl = document.getElementById('det-conf-thresh');
            if (confEl) confEl.textContent = `${(data.confidence_threshold * 100).toFixed(0)}%`;

            const tbody = document.getElementById('detection-timeline-tbody');
            if (tbody) {
                if (data.timeline && data.timeline.length > 0) {
                    tbody.innerHTML = data.timeline.map(item => `
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 600; color: var(--primary-orange);">${item.time}</span></td>
                            <td>${item.event}</td>
                            <td><span class="badge badge-orange">${item.zone}</span></td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                No person entries observed yet in the active video clip.
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }
};
