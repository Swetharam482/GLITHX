/* RetailVision AI - Heatmap Floor-Plan Page View */

const HeatmapPage = {
    pollingInterval: null,
    canvas: null,
    ctx: null,
    animationFrameId: null,
    shoppers: [],
    selectedShelf: 'Shelf B',
    zones: {
        'Shelf A': { x1: 150, y1: 150, x2: 450, y2: 250, name: 'Shelf A (Snacks)', color: '#8b5cf6' },
        'Shelf B': { x1: 550, y1: 150, x2: 850, y2: 250, name: 'Shelf B (Beverages)', color: '#3b82f6' },
        'Shelf C': { x1: 150, y1: 350, x2: 450, y2: 450, name: 'Shelf C (Produce)', color: '#06b6d4' },
        'Shelf D': { x1: 550, y1: 350, x2: 850, y2: 450, name: 'Shelf D (Bakery)', color: '#f59e0b' },
        'Checkout': { x1: 950, y1: 250, x2: 1150, y2: 450, name: 'Checkout Counter', color: '#ec4899' }
    },
    // Trails storage: {id: [{x, y}]}
    trails: {},

    render() {
        return `
            <div class="heatmap-wrapper">
                <!-- Interactive Blueprint Card -->
                <div class="glass-card blueprint-card">
                    <div class="card-header" style="padding:0 0 15px 0; border-bottom:1px solid var(--border-card)">
                        <h3 style="font-size:16px"><i class="fa-solid fa-map text-cyan"></i> ShopSpatial Live Floor Plan Tracker</h3>
                    </div>
                    
                    <div class="canvas-blueprint-container" id="canvas-container">
                        <canvas class="floorplan-canvas" id="floorplan-canvas"></canvas>
                    </div>

                    <!-- Legend Panel -->
                    <div class="heatmap-legend">
                        <div class="legend-item"><span class="legend-color color-high"></span> <span>Red: High Traffic</span></div>
                        <div class="legend-item"><span class="legend-color color-medium"></span> <span>Yellow: Medium Traffic</span></div>
                        <div class="legend-item"><span class="legend-color color-low"></span> <span>Green: Low Traffic</span></div>
                        <div class="legend-item"><span class="legend-color color-blind"></span> <span>Grey: Blind Spots</span></div>
                        <div class="legend-item"><span class="legend-color color-underperform"></span> <span>Purple: Underperforming Shelves</span></div>
                        <div class="legend-item"><span class="legend-color color-best"></span> <span>Dark Green: Best Shelves</span></div>
                    </div>
                </div>

                <!-- Analysis Sidebar Drawer -->
                <div class="heatmap-drawer stats-panel">
                    <!-- Dynamic Shelf Details Card -->
                    <div class="glass-card" style="padding:20px;">
                        <div class="drawer-header">
                            <h4 id="drawer-shelf-title">Shelf B Analysis</h4>
                            <small style="color:var(--slate);">Interactive Object Collision Details</small>
                        </div>
                        
                        <div style="margin-top:15px; display:flex; flex-direction:column; gap:12px; font-size:13px;" id="drawer-shelf-stats">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Shelf ID</span>
                                <span id="ds-id" style="font-weight:700;">Shelf B (Beverages)</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Customer Visits</span>
                                <span id="ds-count" style="font-weight:700; color:#fff;">48</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Avg Dwell Time</span>
                                <span id="ds-dwell" style="font-weight:700; color:var(--cyan);">3.2 min</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Max Dwell Time</span>
                                <span id="ds-max" style="font-weight:700; color:#fff;">15.4 min</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Products Viewed</span>
                                <span id="ds-viewed" style="font-weight:700; color:#fff;">144</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Products Purchased</span>
                                <span id="ds-purchased" style="font-weight:700; color:#fff;">36</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Conversion Rate</span>
                                <span id="ds-conversion" style="font-weight:700; color:var(--green);">25.0%</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Engagement Score</span>
                                <span id="ds-engage" style="font-weight:700; color:var(--cyan);">55/100</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Heatmap Density Score</span>
                                <span id="ds-heatmap" style="font-weight:700; color:var(--red);">88%</span>
                            </div>
                        </div>

                        <!-- Recommendations list inside drawer -->
                        <div style="margin-top:20px; border-top:1px solid var(--border-card); padding-top:15px;">
                            <h5 style="color:var(--cyan); font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-lightbulb text-yellow"></i> AI Store Suggestion</h5>
                            <p id="ds-rec" style="font-size:12px; color:var(--slate); line-height:1.5;">
                                Increase spacing of products and ensure top-selling lines are placed at eye level.
                            </p>
                        </div>
                    </div>

                    <!-- Highlight Regions Box -->
                    <div class="glass-card" style="padding:20px;">
                        <h4 style="font-size:14px; font-family:var(--font-heading); color:var(--cyan); margin-bottom:12px; border-bottom:1px solid var(--border-card); padding-bottom:8px;">
                            Store Diagnostics Summary
                        </h4>
                        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">High Traffic Hotspot</span>
                                <span style="color:var(--red); font-weight:600;">Beverages / Checkout</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Neglected Coldspots</span>
                                <span style="color:var(--yellow); font-weight:600;">Produce Corner</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Blind Spot Footprint</span>
                                <span style="color:var(--slate); font-weight:600;">Back Wall Corridor</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--slate);">Underperforming Shelf</span>
                                <span style="color:var(--purple); font-weight:600;">Shelf C (Produce)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        this.canvas = document.getElementById('floorplan-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        this.bindClicks();
        this.startDrawLoop();
        this.startPolling();
        
        // Load default shelf analysis
        this.selectShelf(this.selectedShelf);
    },

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        if (container && this.canvas) {
            const rect = container.getBoundingClientRect();
            // Store size ratios
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    },

    bindClicks() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Map clicks back to the coordinates base (1280x720 scale)
            const scaleX = 1280 / this.canvas.width;
            const scaleY = 720 / this.canvas.height;
            const refX = clickX * scaleX;
            const refY = clickY * scaleY;
            
            // Check collision with shelves
            for (const [key, zone] of Object.entries(this.zones)) {
                if (zone.x1 <= refX && refX <= zone.x2 && zone.y1 <= refY && refY <= zone.y2) {
                    this.selectShelf(key);
                    break;
                }
            }
        });
    },

    async selectShelf(shelfId) {
        this.selectedShelf = shelfId;
        const cleanId = shelfId.replace('Shelf ', '');
        
        const data = await ApiService.getShelfDetails(cleanId);
        if (data) {
            document.getElementById('drawer-shelf-title').textContent = `${shelfId} Analytics`;
            document.getElementById('ds-id').textContent = data.shelf_id;
            document.getElementById('ds-count').textContent = data.customer_count;
            document.getElementById('ds-dwell').textContent = `${data.avg_dwell_time} min`;
            document.getElementById('ds-max').textContent = `${data.max_dwell_time} min`;
            document.getElementById('ds-viewed').textContent = data.products_viewed;
            document.getElementById('ds-purchased').textContent = data.products_purchased;
            document.getElementById('ds-conversion').textContent = `${data.conversion_rate}%`;
            document.getElementById('ds-engage').textContent = `${data.engagement_score}/100`;
            document.getElementById('ds-heatmap').textContent = `${data.heatmap_score || 70}%`;
            document.getElementById('ds-rec').textContent = data.ai_recommendations[0];
        }
    },

    startDrawLoop() {
        const draw = () => {
            if (!this.ctx || !this.canvas) return;
            
            const w = this.canvas.width;
            const h = this.canvas.height;
            
            // Scale factors
            const sx = w / 1280;
            const sy = h / 720;
            
            this.ctx.clearRect(0, 0, w, h);
            
            // 1. Draw grid background
            this.ctx.strokeStyle = 'rgba(255,255,255,0.02)';
            this.ctx.lineWidth = 1;
            const g = 30;
            for(let x = 0; x < w; x += g) {
                this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); this.ctx.stroke();
            }
            for(let y = 0; y < h; y += g) {
                this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
            }
            
            // 2. Draw layout zones
            // Entrance
            this.ctx.fillStyle = 'rgba(16,185,129,0.15)';
            this.ctx.fillRect(30*sx, 50*sy, 120*sx, 80*sy);
            this.ctx.strokeStyle = '#10b981';
            this.ctx.strokeRect(30*sx, 50*sy, 120*sx, 80*sy);
            this.ctx.fillStyle = '#10b981';
            this.ctx.font = '10px Inter';
            this.ctx.fillText('ENTRANCE', 45*sx, 95*sy);

            // Exit
            this.ctx.fillStyle = 'rgba(239,68,68,0.15)';
            this.ctx.fillRect(30*sx, 550*sy, 120*sx, 80*sy);
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.strokeRect(30*sx, 550*sy, 120*sx, 80*sy);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillText('EXIT', 70*sx, 595*sy);

            // Shelves outline
            for (const [key, zone] of Object.entries(this.zones)) {
                const zx1 = zone.x1 * sx;
                const zy1 = zone.y1 * sy;
                const zw = (zone.x2 - zone.x1) * sx;
                const zh = (zone.y2 - zone.y1) * sy;
                
                const isSelected = key === this.selectedShelf;
                
                this.ctx.fillStyle = isSelected ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.03)';
                this.ctx.fillRect(zx1, zy1, zw, zh);
                
                this.ctx.strokeStyle = isSelected ? '#06b6d4' : zone.color;
                this.ctx.lineWidth = isSelected ? 2 : 1;
                this.ctx.strokeRect(zx1, zy1, zw, zh);
                
                // Labels
                this.ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
                this.ctx.font = isSelected ? 'bold 11px Inter' : '10px Inter';
                this.ctx.fillText(zone.name, zx1 + 10, zy1 - 6);
                
                if (isSelected) {
                    // Glow active shelf indicator
                    this.ctx.shadowColor = '#06b6d4';
                    this.ctx.shadowBlur = 10;
                    this.ctx.strokeRect(zx1, zy1, zw, zh);
                    this.ctx.shadowBlur = 0; // reset
                }
            }

            // 3. Draw walking customer circles with paths/trails
            this.shoppers.forEach(shopper => {
                const cx = shopper.x * sx;
                const cy = shopper.y * sy;
                
                // Initialize/Update trails array
                if (!this.trails[shopper.id]) {
                    this.trails[shopper.id] = [];
                }
                this.trails[shopper.id].push({ x: cx, y: cy });
                // Keep trail length to last 20 coordinates
                if (this.trails[shopper.id].length > 20) {
                    this.trails[shopper.id].shift();
                }

                // Draw trail lines
                const history = this.trails[shopper.id];
                if (history.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(history[0].x, history[0].y);
                    for (let i = 1; i < history.length; i++) {
                        this.ctx.lineTo(history[i].x, history[i].y);
                    }
                    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
                    this.ctx.lineWidth = 2.5;
                    this.ctx.stroke();
                }

                // Draw shopper avatar dot
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#06b6d4';
                this.ctx.shadowColor = '#06b6d4';
                this.ctx.shadowBlur = 8;
                this.ctx.fill();
                this.ctx.shadowBlur = 0; // reset
                
                // Draw label above dot
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Inter';
                this.ctx.fillText(`Customer #${shopper.id}`, cx - 28, cy - 12);
            });

            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    },

    startPolling() {
        const poll = async () => {
            const data = await ApiService.getHeatmapStats();
            if (data && data.active_agents) {
                this.shoppers = data.active_agents;
                
                // Clean up trails of shoppers that are no longer active
                const activeIds = data.active_agents.map(a => a.id);
                for (const trailId in this.trails) {
                    if (!activeIds.includes(parseInt(trailId))) {
                        delete this.trails[trailId];
                    }
                }
            }
        };

        poll();
        this.pollingInterval = setInterval(poll, 1000); // Poll coordinates faster (every 1s) for smoother sync
    },

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
};
