/* RetailVision AI - Video Analysis Module (Single Video Selection & Analysis Workflow) */

const VideoAnalysisPage = {
    pollTimer: null,

    render() {
        return `
            <!-- 1. SELECTED VIDEO CONFIRMATION BANNER / WORKFLOW STRIP -->
            <div class="glass-card" style="padding: 20px 24px; margin-bottom: 24px; border: 2px solid var(--primary-orange); background: #FFFBF7;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1; min-width: 300px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                            <span class="badge badge-orange" style="font-size: 11px; text-transform: uppercase; font-weight: 700;">
                                <i class="fa-solid fa-crosshairs"></i> Selected Video for Analysis
                            </span>
                            <span class="badge badge-green" id="va-selection-status-badge" style="font-size: 11px; display: none;">Ready for Processing</span>
                        </div>
                        <h3 id="va-selected-video-filename" style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">
                            No video selected yet
                        </h3>
                        <p style="margin: 0; font-size: 12.5px; color: var(--text-secondary);" id="va-selected-video-meta">
                            Choose one video clip from the Available Videos library below or upload a new file. Only the single selected video will be processed.
                        </p>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <button class="btn-primary" id="va-btn-analyze-video" style="padding: 10px 22px; font-size: 13.5px;" disabled>
                            <i class="fa-solid fa-play"></i> Analyze Video
                        </button>
                    </div>
                </div>

                <!-- Real-Time Processing Progress Container -->
                <div id="va-processing-progress-container" style="display: none; margin-top: 18px; padding-top: 16px; border-top: 1px solid #FED7AA;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                        <span id="va-processing-label" style="font-weight: 600; color: var(--text-primary);">
                            <i class="fa-solid fa-spinner fa-spin text-orange"></i> Analyzing selected video frames with YOLOv8 & ByteTrack...
                        </span>
                        <span id="va-processing-fps" style="font-weight: 600; color: var(--primary-orange);">FPS: --</span>
                    </div>
                    <div class="progress-track" style="height: 10px; background: #FFEDD5;">
                        <div class="progress-bar-fill" id="va-processing-progressbar" style="width: 0%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                        <span id="va-processing-status-sub">Detecting people, assigning tracking IDs, and calculating zone dwell times...</span>
                        <span id="va-processing-percent" style="font-weight: 700; color: var(--text-primary);">0% (0 / 0 frames)</span>
                    </div>
                </div>
            </div>

            <!-- 2. MAIN CCTV VIDEO PLAYER & UPLOAD ROW -->
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- CCTV Annotated Tracking Video Player Card -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-film text-orange"></i> Active Session CCTV Playback Feed</h3>
                        <div style="display: flex; gap: 8px;">
                            <span class="badge badge-orange" id="va-session-badge">ACTIVE ANALYSIS</span>
                        </div>
                    </div>
                    <div class="card-body" style="padding: 18px;">
                        <div style="border-radius: var(--radius-md); overflow: hidden; background: #000; aspect-ratio: 16/9; position: relative;">
                            <img id="va-video-stream" src="${API_BASE_URL}/video_feed?mode=tracking" alt="CCTV Stream" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <small style="color: var(--text-muted); display: block;">Active Processed Video</small>
                                <strong id="va-current-video-name" style="color: var(--text-primary); font-size: 13.5px;">Loading active clip...</strong>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <a href="${API_BASE_URL}/report?type=video" class="btn-primary" download id="va-btn-download-video">
                                    <i class="fa-solid fa-download"></i> Download Annotated Video
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Video Upload & Engine Specs Card -->
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Upload Card -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-cloud-arrow-up text-orange"></i> Upload New CCTV Video</h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 14px;">
                                Select a store surveillance video clip from your machine to add to your video library. Once uploaded, it will be automatically selected for your review.
                            </p>
                            <input type="file" id="va-file-input" accept=".mp4,.avi,.mov,.mkv" style="display: none;">
                            <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 22px; text-align: center; background: #F8FAFC; margin-bottom: 12px; cursor: pointer;" onclick="document.getElementById('va-file-input').click()">
                                <i class="fa-solid fa-video text-orange" style="font-size: 28px; margin-bottom: 8px;"></i>
                                <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);" id="va-upload-label">Click to browse or drop video file</div>
                                <small style="color: var(--text-muted);">Supports MP4, AVI, MOV up to 250 MB</small>
                            </div>
                            <button type="button" class="btn-primary" id="va-btn-upload" style="width: 100%; justify-content: center;">
                                <i class="fa-solid fa-upload"></i> Upload & Select Video
                            </button>
                        </div>
                    </div>

                    <!-- Pipeline Specs -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3><i class="fa-solid fa-microchip text-orange"></i> AI Analysis Engine Specs</h3>
                        </div>
                        <div class="card-body" style="padding: 14px 20px;">
                            <div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--border-color); font-size: 12.5px;">
                                <span style="color: var(--text-muted);">Person Detector</span>
                                <strong style="color: var(--text-primary);">Ultralytics YOLOv8n</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--border-color); font-size: 12.5px;">
                                <span style="color: var(--text-muted);">Identity Tracker</span>
                                <strong style="color: var(--text-primary);">ByteTrack (Video-Local IDs)</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--border-color); font-size: 12.5px;">
                                <span style="color: var(--text-muted);">Resolution Normalization</span>
                                <strong style="color: var(--text-primary);">1280 x 720 Ground Plane</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 7px 0; font-size: 12.5px;">
                                <span style="color: var(--text-muted);">Multi-Video Policy</span>
                                <strong style="color: var(--primary-orange);">Single-Video Isolated Sessions</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. AVAILABLE VIDEOS IN REPOSITORY (SELECTABLE LIBRARY) -->
            <div class="glass-card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <div>
                        <h3 style="margin: 0;"><i class="fa-solid fa-list-check text-orange"></i> Available CCTV Dataset Videos in Repository</h3>
                        <small style="color: var(--text-muted); font-size: 12px;">Select ONE video below. Clicking 'Select Video' marks it for analysis without auto-processing.</small>
                    </div>
                    <button class="btn-secondary" id="va-btn-refresh-list" style="font-size: 12px; padding: 5px 12px;">
                        <i class="fa-solid fa-rotate-right"></i> Refresh List
                    </button>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Select</th>
                                    <th>Source</th>
                                    <th>Video Filename</th>
                                    <th>File Size</th>
                                    <th>Relative Path</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="va-videos-tbody">
                                <tr>
                                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading available CCTV videos...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 4. PROCESSED VIDEOS & ANALYSIS HISTORY -->
            <div class="glass-card">
                <div class="card-header">
                    <div>
                        <h3 style="margin: 0;"><i class="fa-solid fa-clock-rotate-left text-orange"></i> Processed Analysis Sessions (History)</h3>
                        <small style="color: var(--text-muted); font-size: 12px;">All successfully processed videos are preserved in distinct session folders with full metrics.</small>
                    </div>
                    <button class="btn-secondary" id="va-btn-refresh-sessions" style="font-size: 12px; padding: 5px 12px;">
                        <i class="fa-solid fa-rotate-right"></i> Refresh Sessions
                    </button>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Session ID</th>
                                    <th>Video Filename</th>
                                    <th>Analyzed At</th>
                                    <th>Tracked Shoppers</th>
                                    <th>Avg Dwell</th>
                                    <th>Blind Spot %</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="va-sessions-tbody">
                                <tr>
                                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading processed analysis sessions...
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
        this.stopPolling();
        await this.loadSelectedVideo();
        await this.loadVideoTable();
        await this.loadSessionsTable();
        this.bindEvents();

        // Check active session playback
        const activeSess = await ApiService.getActiveSession();
        if (activeSess && activeSess.active_video_name) {
            const el = document.getElementById('va-current-video-name');
            if (el) el.textContent = activeSess.active_video_name;
            const badge = document.getElementById('va-session-badge');
            if (badge) badge.textContent = activeSess.active_session_id || 'ACTIVE';
        }

        // Check if an analysis is currently running
        const status = await ApiService.getProcessingStatus();
        if (status && status.status === 'processing') {
            this.showProcessingUI(status);
            this.startPollingProgress();
        }
    },

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    },

    bindEvents() {
        const fileInput = document.getElementById('va-file-input');
        const uploadLabel = document.getElementById('va-upload-label');
        const uploadBtn = document.getElementById('va-btn-upload');
        const refreshBtn = document.getElementById('va-btn-refresh-list');
        const refreshSessBtn = document.getElementById('va-btn-refresh-sessions');
        const analyzeBtn = document.getElementById('va-btn-analyze-video');

        if (fileInput && uploadLabel) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    uploadLabel.textContent = `${fileInput.files[0].name} (${(fileInput.files[0].size / (1024*1024)).toFixed(1)} MB)`;
                }
            });
        }

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', async () => {
                if (!fileInput.files || fileInput.files.length === 0) {
                    alert('Please select a video file to upload.');
                    return;
                }
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading Video...';
                const res = await ApiService.uploadVideo(fileInput.files[0]);
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload & Select Video';

                if (res && res.status === 'success') {
                    alert(`Video ${res.filename} uploaded and selected for analysis. Review the confirmation banner and click 'Analyze Video'.`);
                    await this.loadSelectedVideo();
                    await this.loadVideoTable();
                } else {
                    alert(res.message || 'Upload failed.');
                }
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadVideoTable());
        }

        if (refreshSessBtn) {
            refreshSessBtn.addEventListener('click', () => this.loadSessionsTable());
        }

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', async () => {
                await this.startAnalysis();
            });
        }
    },

    async loadSelectedVideo() {
        const res = await ApiService.getSelectedVideo();
        const sel = res && res.selected_video ? res.selected_video : null;

        const filenameEl = document.getElementById('va-selected-video-filename');
        const metaEl = document.getElementById('va-selected-video-meta');
        const badgeEl = document.getElementById('va-selection-status-badge');
        const analyzeBtn = document.getElementById('va-btn-analyze-video');

        if (sel) {
            if (filenameEl) filenameEl.innerHTML = `<i class="fa-solid fa-file-video text-orange"></i> ${sel.filename}`;
            if (metaEl) metaEl.innerHTML = `Source: <strong>${(sel.source || 'dataset').toUpperCase()}</strong> | Size: <strong>${sel.size || 'N/A'}</strong> | Path: <code style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">${sel.relative_path}</code>`;
            if (badgeEl) badgeEl.style.display = 'inline-block';
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = `<i class="fa-solid fa-play"></i> Analyze Video (${sel.filename})`;
            }
        } else {
            if (filenameEl) filenameEl.textContent = 'No video selected yet';
            if (metaEl) metaEl.textContent = 'Choose one video clip from the Available Videos library below or upload a new file. Only the single selected video will be processed.';
            if (badgeEl) badgeEl.style.display = 'none';
            if (analyzeBtn) {
                analyzeBtn.disabled = true;
                analyzeBtn.innerHTML = `<i class="fa-solid fa-play"></i> Analyze Video`;
            }
        }
    },

    async loadVideoTable() {
        const tbody = document.getElementById('va-videos-tbody');
        if (!tbody) return;

        const [videos, selRes] = await Promise.all([
            ApiService.getVideos(),
            ApiService.getSelectedVideo()
        ]);

        const selectedPath = selRes && selRes.selected_video ? selRes.selected_video.relative_path : null;

        if (!videos || videos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No supported video files discovered in backend data/videos directory.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = videos.map(v => {
            const isSelected = (selectedPath === v.relative_path);
            const isUpload = (v.source === 'upload');
            return `
                <tr style="${isSelected ? 'background: #FFF7ED; font-weight: 600;' : ''}">
                    <td style="text-align: center;">
                        <input type="radio" name="video_selection_radio" ${isSelected ? 'checked' : ''} onchange="VideoAnalysisPage.selectVideo('${v.relative_path}', '${v.source}')">
                    </td>
                    <td><span class="badge ${isUpload ? 'badge-blue' : 'badge-orange'}">${v.source.toUpperCase()}</span></td>
                    <td>
                        <strong>${v.filename}</strong>
                        ${isSelected ? '<span class="badge badge-green" style="margin-left: 6px; font-size: 10px;">SELECTED</span>' : ''}
                    </td>
                    <td>${v.size}</td>
                    <td style="font-family: monospace; font-size: 12px; color: var(--text-muted);">${v.relative_path}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button class="${isSelected ? 'btn-secondary' : 'btn-primary'}" style="font-size: 11.5px; padding: 4px 12px;" onclick="VideoAnalysisPage.selectVideo('${v.relative_path}', '${v.source}')">
                                <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-hand-pointer'}"></i> ${isSelected ? 'Selected' : 'Select Video'}
                            </button>
                            ${isUpload 
                                ? `<button class="btn-danger" style="font-size: 11.5px; padding: 4px 10px;" onclick="VideoAnalysisPage.promptDeleteVideo('${v.relative_path}', '${v.source}', '${v.filename}', this)" title="Delete uploaded video from server">
                                       <i class="fa-solid fa-trash"></i> Delete
                                   </button>`
                                : `<button class="btn-disabled-muted" style="font-size: 11.5px; padding: 4px 10px;" onclick="VideoAnalysisPage.explainProtectedDataset('${v.filename}')" title="Protected Repository Dataset: Cannot be permanently deleted">
                                       <i class="fa-solid fa-lock text-muted"></i> Delete
                                   </button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadSessionsTable() {
        const tbody = document.getElementById('va-sessions-tbody');
        if (!tbody) return;

        const data = await ApiService.getProcessedSessions();
        const sessions = data && data.sessions ? data.sessions : [];

        if (sessions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No processed analysis sessions found. Select a video above and click 'Analyze Video' to run the pipeline.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sessions.map(s => {
            const isActive = s.is_active;
            const isCompleted = s.status === 'completed';
            return `
                <tr style="${isActive ? 'background: #EFF6FF; font-weight: 600;' : ''}">
                    <td style="font-family: monospace; font-size: 11.5px;">
                        ${s.session_id}
                        ${isActive ? '<span class="badge badge-blue" style="margin-left: 4px; font-size: 10px;">ACTIVE</span>' : ''}
                    </td>
                    <td><strong>${s.original_filename || 'CCTV Video'}</strong></td>
                    <td style="font-size: 12px; color: var(--text-muted);">${s.completion_time || s.start_time || '--'}</td>
                    <td><span class="badge badge-orange">${s.total_customers || 0} shoppers</span></td>
                    <td>${s.avg_dwell_time_sec ? s.avg_dwell_time_sec + 's' : '0.0s'}</td>
                    <td>${s.blind_spot_percentage ? s.blind_spot_percentage + '%' : '0.0%'}</td>
                    <td>
                        <span class="badge ${isCompleted ? 'badge-green' : 'badge-red'}">
                            ${(s.status || 'completed').toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn-primary" style="font-size: 11px; padding: 4px 8px;" onclick="VideoAnalysisPage.viewSession('${s.session_id}')" title="View on Dashboard">
                                <i class="fa-solid fa-chart-line"></i> View
                            </button>
                            <a href="${API_BASE_URL}/report?type=video&session_id=${s.session_id}" class="btn-secondary" style="font-size: 11px; padding: 4px 8px; text-decoration: none;" download title="Download Video">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async selectVideo(relPath, source) {
        const res = await ApiService.selectVideo(relPath, source);
        if (res && res.status === 'success') {
            await this.loadSelectedVideo();
            await this.loadVideoTable();
        } else {
            alert(res.message || 'Error selecting video.');
        }
    },

    promptDeleteVideo(relPath, source, filename, btnEl = null) {
        if (source === 'dataset') {
            this.explainProtectedDataset(filename);
            return;
        }

        const modalHtml = `
            <div style="padding: 10px 0;">
                <p style="font-size: 14.5px; color: var(--text-primary); margin-bottom: 16px; font-weight: 500;">
                    Are you sure you want to delete this video? This action cannot be undone.
                </p>
                <div style="background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #EF4444; padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 22px;">
                    <div style="font-size: 11.5px; color: #991B1B; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Target Video File:</div>
                    <div style="font-size: 13.5px; color: #111827; font-weight: 600; word-break: break-all;">
                        <i class="fa-solid fa-file-video text-orange" style="margin-right: 6px;"></i> ${filename}
                    </div>
                    <small style="color: #64748B; font-size: 11.5px; display: block; margin-top: 4px;">Source: User Upload Directory</small>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="btn-secondary" id="va-cancel-delete-btn" style="padding: 8px 18px;">
                        Cancel
                    </button>
                    <button type="button" class="btn-danger" id="va-confirm-delete-btn" style="padding: 8px 20px;">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;

        App.showModal("Delete Video Confirmation", modalHtml);

        const cancelBtn = document.getElementById('va-cancel-delete-btn');
        const confirmBtn = document.getElementById('va-confirm-delete-btn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                App.hideModal();
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
                if (btnEl) {
                    btnEl.disabled = true;
                    btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                }

                const res = await ApiService.deleteVideo(relPath, source);
                App.hideModal();

                if (res && res.status === 'success') {
                    alert(`Video '${filename}' was deleted successfully.`);
                    // Refresh video list and selected video without reloading whole page
                    await this.loadVideoTable();
                    await this.loadSelectedVideo();
                } else {
                    alert(res.message || 'Failed to delete video.');
                    if (btnEl) {
                        btnEl.disabled = false;
                        btnEl.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
                    }
                }
            });
        }
    },

    explainProtectedDataset(filename) {
        const modalHtml = `
            <div style="padding: 8px 0;">
                <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: var(--radius-sm); margin-bottom: 18px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14.5px; color: #92400E; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-shield-halved text-orange"></i> Protected Repository Dataset File
                    </h4>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #78350F; line-height: 1.45;">
                        <strong>'${filename}'</strong> is an original CCTV benchmark surveillance dataset file provided in the repository.
                    </p>
                    <p style="margin: 0; font-size: 12.5px; color: #78350F; line-height: 1.45;">
                        To protect dataset integrity and ensure standard evaluation benchmarking across all manager roles, repository dataset recordings cannot be deleted from the server. Only custom user-uploaded videos can be permanently deleted.
                    </p>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn-primary" onclick="App.hideModal()" style="padding: 7px 18px;">
                        Understood
                    </button>
                </div>
            </div>
        `;
        App.showModal("Protected Dataset File", modalHtml);
    },

    async startAnalysis() {
        const selRes = await ApiService.getSelectedVideo();
        if (!selRes || !selRes.selected_video) {
            alert('Please select a video from the Available Videos list first.');
            return;
        }

        const videoName = selRes.selected_video.filename;
        if (!confirm(`Confirm: Analyze ONLY ${videoName}?\n\nThis will execute YOLOv8 detection and ByteTrack tracking on this specific file. Other repository videos will remain untouched.`)) {
            return;
        }

        const analyzeBtn = document.getElementById('va-btn-analyze-video');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Pipeline...';
        }

        const res = await ApiService.processVideo();
        if (res && res.status === 'started') {
            this.showProcessingUI({
                video_name: res.video_name,
                progress: 0,
                processed_frames: 0,
                total_frames: 0,
                fps: 0
            });
            this.startPollingProgress();
        } else {
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = `<i class="fa-solid fa-play"></i> Analyze Video`;
            }
            alert(res.message || 'Failed to start video processing.');
        }
    },

    showProcessingUI(status) {
        const container = document.getElementById('va-processing-progress-container');
        const label = document.getElementById('va-processing-label');
        const fpsEl = document.getElementById('va-processing-fps');
        const bar = document.getElementById('va-processing-progressbar');
        const percentEl = document.getElementById('va-processing-percent');

        if (container) container.style.display = 'block';
        if (label) label.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-orange"></i> Analyzing ${status.video_name || 'selected video'}...`;
        if (fpsEl) fpsEl.textContent = `FPS: ${status.fps || 0}`;
        if (bar) bar.style.width = `${status.progress || 0}%`;
        if (percentEl) percentEl.textContent = `${status.progress || 0}% (${status.processed_frames || 0} / ${status.total_frames || 0} frames)`;
    },

    startPollingProgress() {
        this.stopPolling();
        this.pollTimer = setInterval(async () => {
            const status = await ApiService.getProcessingStatus();
            if (!status) return;

            const bar = document.getElementById('va-processing-progressbar');
            const percentEl = document.getElementById('va-processing-percent');
            const fpsEl = document.getElementById('va-processing-fps');

            if (bar) bar.style.width = `${status.progress || 0}%`;
            if (percentEl) percentEl.textContent = `${status.progress || 0}% (${status.processed_frames || 0} / ${status.total_frames || 0} frames)`;
            if (fpsEl) fpsEl.textContent = `FPS: ${status.fps || 0}`;

            if (status.status === 'completed') {
                this.stopPolling();
                const container = document.getElementById('va-processing-progress-container');
                if (container) container.style.display = 'none';

                const analyzeBtn = document.getElementById('va-btn-analyze-video');
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = '<i class="fa-solid fa-play"></i> Analyze Video';
                }

                alert(`Analysis complete for ${status.video_name}! Processed video, tracking data, and metrics saved in structured session storage.`);
                await this.loadSessionsTable();
                await this.loadSelectedVideo();

                // Refresh video feed
                const stream = document.getElementById('va-video-stream');
                if (stream) stream.src = `${API_BASE_URL}/video_feed?mode=tracking&t=${Date.now()}`;
                const currName = document.getElementById('va-current-video-name');
                if (currName) currName.textContent = status.video_name;

            } else if (status.status === 'failed') {
                this.stopPolling();
                const container = document.getElementById('va-processing-progress-container');
                if (container) container.style.display = 'none';

                const analyzeBtn = document.getElementById('va-btn-analyze-video');
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = '<i class="fa-solid fa-play"></i> Analyze Video';
                }
                alert(`Processing failed: ${status.error || 'Unknown error during frame decoding.'}`);
                await this.loadSessionsTable();
            }
        }, 1500);
    },

    async viewSession(sessionId) {
        const res = await ApiService.setActiveSession(sessionId);
        if (res && res.status === 'success') {
            App.navigateTo('dashboard');
        } else {
            alert(res.message || 'Error switching active session.');
        }
    }
};
