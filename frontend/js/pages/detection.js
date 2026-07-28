/* RetailVision AI - Person Detection Page View */

const DetectionPage = {
    pollingInterval: null,
    isStreaming: false,

    render() {
        const streamUrl = ApiService.getVideoFeedUrl('detection');
        return `
            <div class="video-analytics-wrapper">
                <!-- Video Player Card -->
                <div class="glass-card player-card">
                    <div class="card-header" style="padding:0 0 15px 0; border-bottom:1px solid var(--border-card)">
                        <h3 style="font-size:16px"><i class="fa-solid fa-person-rays text-green"></i> Live Camera Detection Feed</h3>
                    </div>
                    
                    <div class="video-player-container" id="video-container">
                        <span class="live-badge" id="detection-live-badge" style="display:none; background:rgba(16,185,129,0.85)">
                            <span class="status-dot green animate-blink"></span>LIVE
                        </span>
                        <!-- Default placeholder before start -->
                        <img id="detection-feed" src="http://127.0.0.1:5000/static/blind_zone.png" style="opacity: 0.45; object-fit: contain;" alt="Click Start Detection to begin stream">
                        
                        <!-- File Upload Overlay Indicator -->
                        <div id="upload-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); flex-direction:column; align-items:center; justify-content:center; gap:10px; z-index:10;">
                            <i class="fa-solid fa-spinner fa-spin text-cyan fa-2xl"></i>
                            <p id="upload-status-text" style="font-size:14px; font-weight:600;">Processing uploaded CCTV video footage (0%)...</p>
                        </div>
                    </div>

                    <!-- Video Controls -->
                    <div class="video-controls">
                        <button class="btn-primary" id="btn-start-det"><i class="fa-solid fa-play"></i> Start Detection</button>
                        <button class="btn-danger" id="btn-stop-det" disabled><i class="fa-solid fa-stop"></i> Stop Detection</button>
                        
                        <input type="file" id="video-file-input" accept="video/mp4, video/avi" style="display:none;">
                        <button class="btn-secondary" id="btn-browse-det"><i class="fa-solid fa-folder-open"></i> Browse Video</button>
                    </div>

                    <!-- Timeline Indicator -->
                    <div class="timeline-slider-container">
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--slate); margin-bottom:6px;">
                            <span>CCTV Recording Timeline</span>
                            <span id="timeline-time">00:00:00</span>
                        </div>
                        <input type="range" class="video-timeline" id="detection-timeline" min="0" max="100" value="0">
                    </div>
                </div>

                <!-- Statistics Side Panel -->
                <div class="stats-panel">
                    <!-- Metrics Card -->
                    <div class="glass-card" style="padding:20px;">
                        <h4 style="font-size:14px; font-family:var(--font-heading); color:var(--cyan); margin-bottom:15px; border-bottom:1px solid var(--border-card); padding-bottom:8px;">
                            Live Detection Stats
                        </h4>
                        <div style="display:flex; flex-direction:column; gap:14px;">
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Current Persons</span>
                                <span style="font-weight:700; color:#ffffff;" id="det-current-count">0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Detection Accuracy</span>
                                <span style="font-weight:700; color:var(--green);" id="det-accuracy">94.8%</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Inference Speed</span>
                                <span style="font-weight:700; color:var(--cyan);" id="det-speed">5.4 ms</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Frame Rate</span>
                                <span style="font-weight:700; color:#ffffff;" id="det-fps">30.0 FPS</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Frames Processed</span>
                                <span style="font-weight:700; color:#ffffff;" id="det-frames">0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:13px;">
                                <span style="color:var(--slate);">Camera Status</span>
                                <span style="font-weight:700; color:var(--green);" id="det-status">ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Live Events Card -->
                    <div class="glass-card" style="padding:20px; flex:1; display:flex; flex-direction:column; overflow:hidden;">
                        <h4 style="font-size:14px; font-family:var(--font-heading); color:var(--cyan); margin-bottom:15px; border-bottom:1px solid var(--border-card); padding-bottom:8px;">
                            Active Camera Logs
                        </h4>
                        <div class="logs-list" id="detection-logs" style="flex:1;">
                            <!-- Populated dynamically -->
                        </div>
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
        const startBtn = document.getElementById('btn-start-det');
        const stopBtn = document.getElementById('btn-stop-det');
        const browseBtn = document.getElementById('btn-browse-det');
        const fileInput = document.getElementById('video-file-input');
        const feedImg = document.getElementById('detection-feed');
        const liveBadge = document.getElementById('detection-live-badge');

        startBtn.addEventListener('click', async () => {
            const res = await ApiService.startDetection();
            if (res && !res.error) {
                this.isStreaming = true;
                feedImg.src = ApiService.getVideoFeedUrl('detection');
                feedImg.style.opacity = "1";
                feedImg.style.objectFit = "cover";
                liveBadge.style.display = "flex";
                startBtn.disabled = true;
                stopBtn.disabled = false;
            }
        });

        stopBtn.addEventListener('click', async () => {
            const res = await ApiService.stopDetection();
            if (res && !res.error) {
                this.isStreaming = false;
                feedImg.src = "http://127.0.0.1:5000/static/blind_zone.png";
                feedImg.style.opacity = "0.45";
                feedImg.style.objectFit = "contain";
                liveBadge.style.display = "none";
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        });

        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show upload loading overlay
            const overlay = document.getElementById('upload-overlay');
            const statusText = document.getElementById('upload-status-text');
            overlay.style.display = 'flex';
            statusText.textContent = `Uploading ${file.name} to AI processing pipeline...`;

            const res = await ApiService.uploadVideo(file);
            if (res && res.status) {
                // Video process in backend background thread
                // Monitor status
                this.monitorProcessing();
            } else {
                overlay.style.display = 'none';
                alert('Error uploading video file.');
            }
        });

        // Simulate timeline sliding
        const timeline = document.getElementById('detection-timeline');
        const timeLabel = document.getElementById('timeline-time');
        setInterval(() => {
            if (this.isStreaming) {
                let currentVal = parseInt(timeline.value);
                currentVal = (currentVal + 1) % 100;
                timeline.value = currentVal;
                
                const now = new Date();
                timeLabel.textContent = now.toLocaleTimeString();
            }
        }, 1000);
    },

    monitorProcessing() {
        const overlay = document.getElementById('upload-overlay');
        const statusText = document.getElementById('upload-status-text');
        
        let simProgress = 0;
        const interval = setInterval(async () => {
            // Mock dynamic loading since Flask executes in a background thread
            simProgress += 10;
            if (statusText) statusText.textContent = `Analyzing CCTV video frames with YOLOv8 (${simProgress}%)...`;
            
            if (simProgress >= 100) {
                clearInterval(interval);
                overlay.style.display = 'none';
                
                // Automatically switch stream to detection mode
                this.isStreaming = true;
                const feedImg = document.getElementById('detection-feed');
                feedImg.src = ApiService.getVideoFeedUrl('detection');
                feedImg.style.opacity = "1";
                feedImg.style.objectFit = "cover";
                
                document.getElementById('btn-start-det').disabled = true;
                document.getElementById('btn-stop-det').disabled = false;
                document.getElementById('detection-live-badge').style.display = "flex";
            }
        }, 1200);
    },

    startPolling() {
        const poll = async () => {
            if (!this.isStreaming) return;
            const data = await ApiService.getPersonDetectionStats();
            if (data) {
                document.getElementById('det-current-count').textContent = data.current_person_count;
                document.getElementById('det-accuracy').textContent = data.detection_accuracy;
                document.getElementById('det-speed').textContent = data.inference_time;
                document.getElementById('det-fps').textContent = `${data.fps.toFixed(1)} FPS`;
                document.getElementById('det-frames').textContent = data.frames_processed.toLocaleString();
                document.getElementById('det-status').textContent = data.camera_status;

                // Update logs list
                const logsList = document.getElementById('detection-logs');
                if (logsList) {
                    logsList.innerHTML = data.timeline.map(log => `
                        <div class="log-item">
                            <span class="log-time">${log.time}</span>
                            <span class="log-text">${log.event}</span>
                        </div>
                    `).join('');
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
