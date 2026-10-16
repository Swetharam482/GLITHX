/* RetailVision AI - Reports & Data Export Module */

const ReportsPage = {
    render() {
        return `
            <div class="glass-card" style="padding: 18px 24px; margin-bottom: 24px;">
                <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-file-invoice text-orange"></i> Analytical Reports & Raw Data Exports
                </h4>
                <small style="color: var(--text-muted);">
                    Export genuine computer vision analytics, customer trajectory coordinates, and visual heatmaps generated from the active CCTV analysis.
                </small>
            </div>

            <!-- Export Cards Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <!-- Trajectory CSV -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-file-csv"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Shopper Trajectories (CSV)</strong>
                                <small style="display: block; color: var(--text-muted);">Raw (x, y) coordinates & frames</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            Complete time-indexed ground plane coordinates for every tracked person identity observed during video playback.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=tracking_csv" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Export Trajectories CSV
                    </a>
                </div>

                <!-- Shelf Analytics CSV -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-table"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Shelf Analytics (CSV)</strong>
                                <small style="display: block; color: var(--text-muted);">Visitors, dwell times, scores</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            Aggregated visitation metrics, average and maximum recorded dwell durations for each configured shelf region.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=shelf_csv" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Export Shelf Analytics CSV
                    </a>
                </div>

                <!-- Dwell Times CSV -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-stopwatch"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Dwell Times Log (CSV)</strong>
                                <small style="display: block; color: var(--text-muted);">Per-visit duration records</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            Individual session dwell records classifying shopper engagement between passing transit and active browsing.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=dwell_csv" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Export Dwell Times CSV
                    </a>
                </div>

                <!-- Annotated Output Video -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-film"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Annotated Video (MP4)</strong>
                                <small style="display: block; color: var(--text-muted);">Bounding boxes, IDs, trails</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            The full 1280x720 annotated surveillance video with persistent ByteTrack tracking boxes, velocity labels, and trails.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=video" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Download Video (MP4)
                    </a>
                </div>

                <!-- Movement Heatmap PNG -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-fire"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Movement Heatmap (PNG)</strong>
                                <small style="display: block; color: var(--text-muted);">High-resolution density map</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            Publication-grade 2D Gaussian density map overlaid on the store camera layout with density colorbar.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=heatmap" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Download Heatmap PNG
                    </a>
                </div>

                <!-- Blind Zone Spatial Grid PNG -->
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div class="kpi-icon"><i class="fa-solid fa-eye-slash"></i></div>
                            <div>
                                <strong style="font-size: 14px; color: var(--text-primary);">Blind Zone Grid (PNG)</strong>
                                <small style="display: block; color: var(--text-muted);">16x9 spatial coverage map</small>
                            </div>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
                            Visual spatial occupancy map highlighting low-traffic walkway grid blocks and coverage percentage.
                        </p>
                    </div>
                    <a href="${API_BASE_URL}/report?type=blind_zone" class="btn-primary" style="justify-content: center; text-decoration: none;" download>
                        <i class="fa-solid fa-download"></i> Download Grid PNG
                    </a>
                </div>
            </div>

            <!-- Executive Printable Report Card -->
            <div class="glass-card" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                            <i class="fa-solid fa-print text-orange" style="margin-right: 8px;"></i> Executive Intelligence Summary
                        </h4>
                        <p style="margin: 4px 0 0 0; font-size: 12.5px; color: var(--text-secondary);">
                            Print or export a formatted physical briefing document summarizing active CCTV performance metrics.
                        </p>
                    </div>
                    <button class="btn-primary" onclick="window.print()">
                        <i class="fa-solid fa-print"></i> Print Executive Briefing
                    </button>
                </div>
            </div>
        `;
    },

    async init() {
        // Ready
    }
};
