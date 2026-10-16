/* RetailVision AI - Movement Heatmap Analytics Page */

const HeatmapPage = {
    render() {
        return `
            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Heatmap Display Card -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-fire text-orange"></i> Full Spatial Density Heatmap</h3>
                        <a href="${API_BASE_URL}/report?type=heatmap" class="btn-outline-orange" download>
                            <i class="fa-solid fa-download"></i> Download Heatmap PNG
                        </a>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); aspect-ratio: 16/9; background: #0F172A; display: flex; align-items: center; justify-content: center;">
                            <img id="heatmap-full-img" src="${API_BASE_URL.replace('/api', '')}/static/store_heatmap.png?t=${Date.now()}" alt="Store Heatmap" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="margin-top: 12px; font-size: 12.5px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
                            <span>Density Model: <strong>Gaussian Kernel 2D Density (Actual Foot Coordinates)</strong></span>
                            <span style="color: var(--primary-orange); font-weight: 600;">Dynamic Colormap: Turbo</span>
                        </div>
                    </div>
                </div>

                <!-- Heatmap Interpretation & High-Traffic Hotspots -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-circle-nodes text-orange"></i> Observed Traffic Concentration</h3>
                        </div>
                        <div class="card-body" style="padding: 16px 20px;">
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Highest Density Zone</span>
                                <strong id="hm-hotspot-zone" style="color: var(--primary-orange);">--</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                                <span style="color: var(--text-muted);">Lowest Density Zone</span>
                                <strong id="hm-coldspot-zone" style="color: var(--text-secondary);">--</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px;">
                                <span style="color: var(--text-muted);">Walking Aisle Traffic Share</span>
                                <strong id="hm-aisle-share" style="color: var(--text-primary);">--</strong>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="flex: 1;">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-lightbulb text-orange"></i> Heatmap Methodology</h3>
                        </div>
                        <div class="card-body" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
                            <p style="margin-bottom: 10px;">
                                <strong>True Trajectory Aggregation:</strong> Every point rendered on this heatmap represents the actual contact ground position of a customer detected during video tracking.
                            </p>
                            <p>
                                Areas with warm orange and red clusters indicate high dwell or frequent pedestrian transit, while transparent / blue areas indicate light foot traffic.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        const data = await ApiService.getDashboardData();
        if (data && data.kpis) {
            const hotEl = document.getElementById('hm-hotspot-zone');
            if (hotEl) hotEl.textContent = data.kpis.most_visited_zone || '--';

            const coldEl = document.getElementById('hm-coldspot-zone');
            if (coldEl) coldEl.textContent = data.kpis.least_visited_zone || '--';

            const dist = data.traffic_distribution || [];
            const aisleEl = document.getElementById('hm-aisle-share');
            if (aisleEl) {
                const totalPct = dist.reduce((acc, curr) => acc + curr.percentage, 0);
                aisleEl.textContent = totalPct > 0 ? `${(100 - Math.min(100, totalPct)).toFixed(1)}%` : 'Direct';
            }
        }
    }
};
