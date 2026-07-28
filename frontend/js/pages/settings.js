/* RetailVision AI - Configuration Settings Page View */

const SettingsPage = {
    render() {
        return `
            <div class="settings-wrapper glass-card" style="padding:30px;">
                <div style="border-bottom:1px solid var(--border-card); padding-bottom:15px; margin-bottom:25px;">
                    <h3 style="font-size:18px; font-family:var(--font-heading); color:#fff;"><i class="fa-solid fa-sliders text-cyan"></i> Platform Configurations</h3>
                    <p style="font-size:12px; color:var(--slate);">Configure YOLOv8 AI models, ByteTrack sensitivities, camera triggers, and store layouts.</p>
                </div>

                <form id="settings-form" style="display:flex; flex-direction:column; gap:20px;">
                    <!-- Row 1: AI Model Configuration -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="setting-model-size">AI Detection Model Size</label>
                            <select class="form-control" id="setting-model-size">
                                <option value="yolov8n">YOLOv8 Nano (Default - 6.2MB, Fast CPU)</option>
                                <option value="yolov8s">YOLOv8 Small (22.5MB, Recommended GPU)</option>
                                <option value="yolov8m">YOLOv8 Medium (52.0MB, Advanced Accuracy)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="setting-confidence">Detection Confidence Threshold</label>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <input type="range" class="form-control" style="flex:1; padding:0; height:8px;" id="setting-confidence" min="10" max="95" value="50">
                                <span id="conf-val" style="font-size:13px; font-weight:700; color:var(--cyan); width:35px;">0.50</span>
                            </div>
                        </div>
                    </div>

                    <!-- Row 2: Tracking Configuration -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="setting-track-fps">ByteTrack Processing FPS Target</label>
                            <select class="form-control" id="setting-track-fps">
                                <option value="15">15 FPS (Resource Optimized)</option>
                                <option value="30" selected>30 FPS (Fluid Visual Tracking)</option>
                                <option value="60">60 FPS (Ultra Performance)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="setting-dwell-threshold">Dwell Time Event Threshold</label>
                            <select class="form-control" id="setting-dwell-threshold">
                                <option value="5">5 Seconds (Quick Browse)</option>
                                <option value="10" selected>10 Seconds (Standard Browse)</option>
                                <option value="30">30 Seconds (Engaged Shopping)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Layout and Mapping Configuration -->
                    <div class="form-group">
                        <label>Active Cameras to Monitor</label>
                        <div style="display:flex; flex-direction:column; gap:10px; margin-top:6px; background:rgba(0,0,0,0.15); padding:15px; border-radius:8px; border:1px solid var(--border-card);">
                            <label style="display:flex; align-items:center; gap:10px; font-size:13px; cursor:pointer;">
                                <input type="checkbox" checked style="accent-color:var(--cyan);"> CAM-01: Rear Shelf C Produce Section
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; font-size:13px; cursor:pointer;">
                                <input type="checkbox" checked style="accent-color:var(--cyan);"> CAM-02: Shelf A Snacks / Shelf D Bakery Corridor
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; font-size:13px; cursor:pointer;">
                                <input type="checkbox" checked style="accent-color:var(--cyan);"> CAM-03: Central Aisle / Shelf B Beverages (Main Core)
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; font-size:13px; cursor:pointer;">
                                <input type="checkbox" checked style="accent-color:var(--cyan);"> CAM-04: Checkout lanes & Cash Registers
                            </label>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border-card); padding-top:20px; margin-top:10px;">
                        <button type="button" class="btn-secondary" id="btn-reset-settings">Reset Defaults</button>
                        <button type="submit" class="btn-primary">Save Settings Configuration</button>
                    </div>
                </form>
            </div>
        `;
    },

    async init() {
        this.bindEvents();
    },

    bindEvents() {
        const confSlider = document.getElementById('setting-confidence');
        const confVal = document.getElementById('conf-val');
        
        confSlider.addEventListener('input', (e) => {
            const v = (e.target.value / 100).toFixed(2);
            confVal.textContent = v;
        });

        const form = document.getElementById('settings-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Configurations saved successfully! Backend service re-indexing filters.');
        });

        const resetBtn = document.getElementById('btn-reset-settings');
        resetBtn.addEventListener('click', () => {
            confSlider.value = 50;
            confVal.textContent = '0.50';
            document.getElementById('setting-model-size').value = 'yolov8n';
            document.getElementById('setting-track-fps').value = '30';
            document.getElementById('setting-dwell-threshold').value = '10';
            alert('Settings restored to factory defaults.');
        });
    },

    destroy() {}
};
