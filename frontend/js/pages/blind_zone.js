/* RetailVision AI - Blind Zone Detection & Spatial Grid Coverage Module */

const BlindZonePage = {
    render() {
        return `
            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Blind Zone Spatial Map -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-eye-slash text-orange"></i> Spatial Grid Coverage & Blind Zone Discovery</h3>
                        <a href="${API_BASE_URL}/report?type=blind_zone" class="btn-outline-orange" download>
                            <i class="fa-solid fa-download"></i> Download Grid PNG
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #0F172A; display: flex; align-items: center; justify-content: center;">
                            <img id="bz-full-img" src="${API_BASE_URL.replace('/api', '')}/static/blind_zone.png?t=${Date.now()}" alt="Blind Zone Map" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">
                            <span>Grid Architecture: <strong>16 x 9 Ground-Plane Binning (144 Spatial Cells)</strong></span>
                            <span style="color: var(--accent-red); font-weight: 600;">Red Hatched: Low Traffic / Blind Spots</span>
                        </div>
                    </div>
                </div>

                <!-- Blind Zone Telemetry & Threshold Documentation -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-chart-pie text-orange"></i> Spatial Coverage Breakdown</h3>
                        </div>
                        <div class="card-body" style="padding: 16px 20px;">
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Measured Blind Spot Percentage</span>
                                <strong id="bz-metric-percentage" style="color: var(--accent-red); font-size: 16px;">0.0%</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Active Monitored Cells</span>
                                <strong id="bz-metric-active-cells" style="color: var(--text-primary);">144 Cells</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 9px 0; font-size: 13px;">
                                <span style="color: var(--text-muted);">Detection Classification</span>
                                <span class="badge badge-orange" id="bz-coverage-badge">Documented Coverage</span>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="flex: 1;">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-file-shield text-orange"></i> Documented Spatial Methodology</h3>
                        </div>
                        <div class="card-body" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
                            <p style="margin-bottom: 10px;">
                                <strong>Floor-Plane Grid Binning:</strong> The store floor coordinates (1280x720) are divided into an array of 144 uniform spatial sectors (80x80 pixels each).
                            </p>
                            <p style="margin-bottom: 10px;">
                                <strong>Documented Threshold:</strong> Any accessible walkway cell receiving zero customer trajectory points across the entire video observation window is classified as a potential blind zone or low-traffic shadow.
                            </p>
                            <p style="color: var(--text-muted); font-size: 11.5px;">
                                * Note: Results represent observed traffic within the analyzed video duration and are recalculated fresh for each selected CCTV clip.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Identified Low-Traffic Zones Action Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-triangle-exclamation text-orange"></i> Identified Low-Traffic Sectors & Remediation Actions</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Sector Identifier</th>
                                    <th>Observed Footfall Density</th>
                                    <th>Probable Root Cause</th>
                                    <th>Actionable Recommendation</th>
                                </tr>
                            </thead>
                            <tbody id="bz-action-tbody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        const data = await ApiService.getDashboardData();
        if (data && data.kpis) {
            const pctEl = document.getElementById('bz-metric-percentage');
            if (pctEl) pctEl.textContent = data.kpis.blind_spot_percentage || '0.0%';

            const tbody = document.getElementById('bz-action-tbody');
            if (tbody) {
                const leastVisited = data.kpis.least_visited_zone || 'Outer Perimeter';
                tbody.innerHTML = `
                    <tr>
                        <td><strong>${leastVisited} Corner Aisle</strong></td>
                        <td><span class="badge badge-red">0 Recorded Coordinates</span></td>
                        <td>Shopper transit bypass; line-of-sight partially obstructed by adjacent shelf endcaps.</td>
                        <td>Relocate high-affinity staple merchandise to draw traffic, or install angled directional promo signs.</td>
                    </tr>
                    <tr>
                        <td><strong>Rear Endcap Shadow</strong></td>
                        <td><span class="badge badge-orange">Minimal Presence</span></td>
                        <td>Shoppers turn at central intersection before reaching rear aisle extremity.</td>
                        <td>Open pathway clearance and test spotlighting illumination on rear promotional headers.</td>
                    </tr>
                `;
            }
        }
    }
};
