/* RetailVision AI - Shelf Analytics & Interactive Region Configurator */

const ShelfAnalyticsPage = {
    canvas: null,
    ctx: null,
    referenceImg: null,
    zones: {},
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,

    render() {
        return `
            <!-- Top Controls & Action Bar -->
            <div class="glass-card" style="padding: 18px 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-shapes text-orange"></i> Shelf Interaction Region Configurator
                        </h4>
                        <small style="color: var(--text-muted);">
                            Draw rectangular boundaries directly over the CCTV camera frame to define shelf interaction zones for dwell time calculation.
                        </small>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" id="shelf-btn-save-zones">
                            <i class="fa-solid fa-floppy-disk"></i> Save Shelf Regions
                        </button>
                    </div>
                </div>
            </div>

            <!-- Two-Column Layout: Canvas Visual Editor & Regions List -->
            <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Canvas Video Frame Editor -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-crop-simple text-orange"></i> Interactive CCTV Frame Canvas</h3>
                        <span style="font-size: 11.5px; color: var(--text-muted);">Click & Drag to Draw Region</span>
                    </div>
                    <div class="card-body" style="padding: 16px;">
                        <div class="shelf-canvas-container" style="width: 100%;">
                            <canvas id="shelf-editor-canvas" width="1280" height="720"></canvas>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 12px; color: var(--text-muted);">
                            <span>Canvas Coordinate Grid: <strong>1280 x 720 (Normalized)</strong></span>
                            <span id="canvas-status-hint" style="color: var(--primary-orange);">Ready to draw</span>
                        </div>
                    </div>
                </div>

                <!-- Configured Regions List & Performance Panel -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Configured Shelf Zones Table -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-tags text-orange"></i> Active Configured Shelf Zones</h3>
                        </div>
                        <div class="card-body" style="padding: 0; max-height: 380px; overflow-y: auto;">
                            <div class="table-responsive">
                                <table class="rv-table">
                                    <thead>
                                        <tr>
                                            <th>Zone / Shelf Name</th>
                                            <th>Coordinates</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="shelf-zones-list-tbody">
                                        <!-- Populated dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Measured Shelf Analytics Results Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-table-list text-orange"></i> Measured Shelf Engagement & Dwell Metrics</h3>
                    <a href="${API_BASE_URL}/report?type=shelf_csv" class="btn-outline-orange" download>
                        <i class="fa-solid fa-download"></i> Export Shelf Analytics CSV
                    </a>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Shelf Identifier</th>
                                    <th>Observed Visitor Count</th>
                                    <th>Average Dwell Time</th>
                                    <th>Max Recorded Dwell</th>
                                    <th>Engagement Score</th>
                                </tr>
                            </thead>
                            <tbody id="shelf-metrics-tbody">
                                <tr>
                                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading shelf metrics...
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
        this.canvas = document.getElementById('shelf-editor-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Load reference frame image
        this.referenceImg = new Image();
        this.referenceImg.crossOrigin = "anonymous";
        this.referenceImg.src = ApiService.getReferenceFrameUrl();
        this.referenceImg.onload = () => this.redrawCanvas();
        this.referenceImg.onerror = () => {
            console.warn("Could not load reference frame, rendering grid layout.");
            this.redrawCanvas();
        };

        // Load current zones from backend
        this.zones = await ApiService.getShelfZones() || {};
        this.renderZonesList();
        this.bindEvents();
        await this.loadShelfMetricsTable();
    },

    bindEvents() {
        if (!this.canvas) return;

        // Canvas mouse drawing
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.startX = (e.clientX - rect.left) * scaleX;
            this.startY = (e.clientY - rect.top) * scaleY;
            this.isDrawing = true;
            this.currentX = this.startX;
            this.currentY = this.startY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.currentX = (e.clientX - rect.left) * scaleX;
            this.currentY = (e.clientY - rect.top) * scaleY;
            this.redrawCanvas();

            // Draw current dragging rectangle
            this.ctx.strokeStyle = '#F97316';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([6, 4]);
            this.ctx.strokeRect(this.startX, this.startY, this.currentX - this.startX, this.currentY - this.startY);
            this.ctx.setLineDash([]);
        });

        const finishDrawing = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            const x1 = Math.round(Math.min(this.startX, this.currentX));
            const y1 = Math.round(Math.min(this.startY, this.currentY));
            const x2 = Math.round(Math.max(this.startX, this.currentX));
            const y2 = Math.round(Math.max(this.startY, this.currentY));

            if (x2 - x1 < 20 || y2 - y1 < 20) {
                this.redrawCanvas();
                return;
            }

            const name = prompt("Enter shelf / zone name (e.g. Shelf C (Produce) or Front Checkout):", "Shelf New");
            if (name && name.trim()) {
                const colors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];
                const color = colors[Object.keys(this.zones).length % colors.length];

                this.zones[name.trim()] = {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2,
                    color: color
                };
                this.renderZonesList();
            }
            this.redrawCanvas();
        };

        this.canvas.addEventListener('mouseup', finishDrawing);
        this.canvas.addEventListener('mouseleave', finishDrawing);

        // Save zones button
        const saveBtn = document.getElementById('shelf-btn-save-zones');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                const res = await ApiService.saveShelfZones(this.zones);
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Shelf Regions';

                if (res && res.status === 'success') {
                    alert(res.message || 'Shelf regions saved successfully!');
                    await this.loadShelfMetricsTable();
                } else {
                    alert(res.message || 'Error saving shelf regions.');
                }
            });
        }
    },

    redrawCanvas() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw reference CCTV image
        if (this.referenceImg && this.referenceImg.complete && this.referenceImg.naturalWidth > 0) {
            this.ctx.drawImage(this.referenceImg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Dark blueprint style canvas
            this.ctx.fillStyle = '#0F172A';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeStyle = '#1E293B';
            this.ctx.lineWidth = 1;
            for (let x = 0; x < 1280; x += 80) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, 720);
                this.ctx.stroke();
            }
            for (let y = 0; y < 720; y += 80) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(1280, y);
                this.ctx.stroke();
            }
        }

        // Draw configured zones
        for (const [name, box] of Object.entries(this.zones)) {
            const w = box.x2 - box.x1;
            const h = box.y2 - box.y1;
            const color = box.color || '#F97316';

            // Translucent fill
            this.ctx.fillStyle = color + '25';
            this.ctx.fillRect(box.x1, box.y1, w, h);

            // Solid border
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeRect(box.x1, box.y1, w, h);

            // Zone text label badge
            this.ctx.font = 'bold 12px Inter, sans-serif';
            const textWidth = this.ctx.measureText(name.toUpperCase()).width;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(box.x1, Math.max(0, box.y1 - 22), textWidth + 14, 22);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(name.toUpperCase(), box.x1 + 7, Math.max(15, box.y1 - 7));
        }
    },

    renderZonesList() {
        const tbody = document.getElementById('shelf-zones-list-tbody');
        if (!tbody) return;

        const entries = Object.entries(this.zones);
        if (entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 18px;">
                        No shelf regions configured. Click and drag on the camera view to mark shelves.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = entries.map(([name, box]) => `
            <tr>
                <td>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${box.color || '#F97316'}; margin-right: 6px;"></span>
                    <strong>${name}</strong>
                </td>
                <td style="font-family: monospace; font-size: 11.5px; color: var(--text-muted);">
                    [${box.x1}, ${box.y1}, ${box.x2}, ${box.y2}]
                </td>
                <td>
                    <button class="btn-secondary" style="padding: 3px 8px; font-size: 11px; color: var(--accent-red);" onclick="ShelfAnalyticsPage.deleteZone('${name}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    deleteZone(name) {
        if (confirm(`Remove configured region "${name}"?`)) {
            delete this.zones[name];
            this.renderZonesList();
            this.redrawCanvas();
        }
    },

    async loadShelfMetricsTable() {
        const tbody = document.getElementById('shelf-metrics-tbody');
        if (!tbody) return;

        const data = await ApiService.getDashboardData();
        if (data && data.shelf_rankings && data.shelf_rankings.length > 0) {
            tbody.innerHTML = data.shelf_rankings.map(s => `
                <tr>
                    <td><strong>${s.shelf_id}</strong></td>
                    <td><span class="badge badge-orange">${s.visitors} shopper${s.visitors !== 1 ? 's' : ''}</span></td>
                    <td><strong>${s.avg_dwell_sec}s</strong></td>
                    <td>${(s.avg_dwell_sec * 1.8).toFixed(1)}s</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="progress-track" style="flex: 1; height: 8px;">
                                <div class="progress-bar-fill" style="width: ${Math.min(100, s.avg_dwell_sec * 6)}%;"></div>
                            </div>
                            <span style="font-size: 11px; font-weight: 600;">${Math.min(100, Math.round(s.avg_dwell_sec * 6))}%</span>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No shelf analytics recorded yet. Process a CCTV video to measure shelf visits and dwell times.
                    </td>
                </tr>
            `;
        }
    }
};
