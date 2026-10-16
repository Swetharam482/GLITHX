/* RetailVision AI - Application & Pipeline Settings Module */

const SettingsPage = {
    render() {
        return `
            <div class="glass-card" style="padding: 18px 24px; margin-bottom: 24px;">
                <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-sliders text-orange"></i> Computer Vision & System Settings
                </h4>
                <small style="color: var(--text-muted);">
                    Adjust detection confidence, multi-object tracking stride, and retail store camera metadata.
                </small>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Pipeline Configurations -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-microchip text-orange"></i> AI Detection & Tracking Parameters</h3>
                    </div>
                    <div class="card-body">
                        <form id="settings-form">
                            <div class="form-group">
                                <label for="settings-model">Person Detection Model</label>
                                <select class="form-control" id="settings-model">
                                    <option value="yolov8n.pt" selected>Ultralytics YOLOv8n (Pretrained Nano CPU - Fast)</option>
                                    <option value="yolo26n.pt">Ultralytics YOLO26n (Local Weights)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="settings-conf">Detection Confidence Threshold: <strong id="conf-val-label" style="color: var(--primary-orange);">25%</strong></label>
                                <input type="range" class="form-control" id="settings-conf" min="10" max="80" value="25" style="padding: 0;">
                            </div>

                            <div class="form-group">
                                <label for="settings-stride">Video Processing Frame Stride (Downsampling factor)</label>
                                <select class="form-control" id="settings-stride">
                                    <option value="1">1 (Every frame - Maximum accuracy, slower)</option>
                                    <option value="2" selected>2 (Sample every 2nd frame - Recommended)</option>
                                    <option value="3">3 (Sample every 3rd frame - Ultra fast)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="settings-device">Inference Hardware Acceleration</label>
                                <input type="text" class="form-control" value="CPU (Intel / AMD AVX2 Optimized)" disabled style="background: #F8FAFC;">
                            </div>

                            <button type="submit" class="btn-primary" style="margin-top: 10px;">
                                <i class="fa-solid fa-floppy-disk"></i> Save Pipeline Settings
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Store & Camera Information -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-store text-orange"></i> Store & Surveillance Metadata</h3>
                    </div>
                    <div class="card-body">
                        <form id="store-meta-form">
                            <div class="form-group">
                                <label for="settings-store-name">Retail Store Facility Name</label>
                                <input type="text" class="form-control" id="settings-store-name" value="Rehana Retail Store - Central CCTV View">
                            </div>

                            <div class="form-group">
                                <label for="settings-camera-id">Monitored Camera Identification</label>
                                <input type="text" class="form-control" id="settings-camera-id" value="CAM-01 (Ceiling High-Angle)">
                            </div>

                            <div class="form-group">
                                <label>Ground Plane Coordinate Resolution</label>
                                <input type="text" class="form-control" value="1280 x 720 Standardized Aspect" disabled style="background: #F8FAFC;">
                            </div>

                            <div style="background: var(--orange-light); border: 1px solid var(--orange-border); border-radius: var(--radius-md); padding: 14px; font-size: 12.5px; color: var(--dark-orange); margin-top: 18px;">
                                <i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i>
                                All metadata adjustments are instantly reflected across header tags and executive exports.
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        const settings = await ApiService.getSettings();
        if (settings) {
            const modelEl = document.getElementById('settings-model');
            if (modelEl && settings.model_name) modelEl.value = settings.model_name;

            const confEl = document.getElementById('settings-conf');
            const confLabel = document.getElementById('conf-val-label');
            if (confEl && settings.confidence_threshold) {
                confEl.value = Math.round(settings.confidence_threshold * 100);
                if (confLabel) confLabel.textContent = `${confEl.value}%`;
            }

            const strideEl = document.getElementById('settings-stride');
            if (strideEl && settings.frame_stride) strideEl.value = settings.frame_stride;

            const storeEl = document.getElementById('settings-store-name');
            if (storeEl && settings.store_name) storeEl.value = settings.store_name;

            const camEl = document.getElementById('settings-camera-id');
            if (camEl && settings.camera_id) camEl.value = settings.camera_id;
        }

        const confEl = document.getElementById('settings-conf');
        const confLabel = document.getElementById('conf-val-label');
        if (confEl && confLabel) {
            confEl.addEventListener('input', () => {
                confLabel.textContent = `${confEl.value}%`;
            });
        }

        const form = document.getElementById('settings-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const model_name = document.getElementById('settings-model').value;
                const confidence_threshold = parseFloat(document.getElementById('settings-conf').value) / 100.0;
                const frame_stride = parseInt(document.getElementById('settings-stride').value);
                const store_name = document.getElementById('settings-store-name').value;
                const camera_id = document.getElementById('settings-camera-id').value;

                const res = await ApiService.updateSettings({
                    model_name,
                    confidence_threshold,
                    frame_stride,
                    store_name,
                    camera_id
                });

                if (res && res.status === 'success') {
                    alert('Settings updated successfully!');
                } else {
                    alert(res.message || 'Error saving settings.');
                }
            });
        }
    }
};
