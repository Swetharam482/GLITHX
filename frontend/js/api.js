/* RetailVision AI - REST API Service Wrapper with Bearer Auth & Session Support */

const API_BASE_URL = window.location.origin + '/api';

const ApiService = {
    getToken() {
        return localStorage.getItem('retailvision_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('retailvision_token', token);
        } else {
            localStorage.removeItem('retailvision_token');
        }
    },

    getAuthHeaders(extraHeaders = {}) {
        const headers = { ...extraHeaders };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // ---------------- AUTHENTICATION ----------------
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                this.setToken(data.token);
            }
            return data;
        } catch (error) {
            console.error('API Error (login):', error);
            return { status: 'error', message: error.message };
        }
    },

    async logout() {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
        } catch (e) {
            console.warn('Logout API notice:', e);
        } finally {
            this.setToken(null);
        }
    },

    async getMe() {
        try {
            const res = await fetch(`${API_BASE_URL}/me`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return { status: 'error' };
        }
    },

    // ---------------- VIDEO DATASET & SELECTION WORKFLOW ----------------
    async getVideos() {
        try {
            const res = await fetch(`${API_BASE_URL}/videos`, {
                headers: this.getAuthHeaders()
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error('API Error (getVideos):', e);
            return [];
        }
    },

    async uploadVideo(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_BASE_URL}/upload-video`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: formData
            });
            return await res.json();
        } catch (e) {
            console.error('API Error (uploadVideo):', e);
            return { status: 'error', message: e.message };
        }
    },

    async deleteVideo(relativePath, source = 'upload') {
        try {
            const res = await fetch(`${API_BASE_URL}/videos/${encodeURIComponent(relativePath)}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ relative_path: relativePath, source: source })
            });
            return await res.json();
        } catch (e) {
            console.error('API Error (deleteVideo):', e);
            return { status: 'error', message: e.message };
        }
    },

    async selectVideo(relativePath, source = 'dataset') {
        try {
            const res = await fetch(`${API_BASE_URL}/select-video`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ relative_path: relativePath, source: source })
            });
            return await res.json();
        } catch (e) {
            console.error('API Error (selectVideo):', e);
            return { status: 'error', message: e.message };
        }
    },

    async getSelectedVideo() {
        try {
            const res = await fetch(`${API_BASE_URL}/selected-video`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return { selected_video: null };
        }
    },

    async processVideo(relativePath = null, source = null) {
        try {
            const payload = {};
            if (relativePath) payload.relative_path = relativePath;
            if (source) payload.source = source;

            const res = await fetch(`${API_BASE_URL}/process-video`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (e) {
            console.error('API Error (processVideo):', e);
            return { status: 'error', message: e.message };
        }
    },

    async getProcessingStatus(sessionId = null) {
        try {
            const url = sessionId ? `${API_BASE_URL}/processing-status/${sessionId}` : `${API_BASE_URL}/processing-status`;
            const res = await fetch(url, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return { status: 'idle', progress: 0 };
        }
    },

    // ---------------- PROCESSED SESSIONS & ACTIVE SELECTION ----------------
    async getProcessedSessions() {
        try {
            const res = await fetch(`${API_BASE_URL}/processed-sessions`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return { total_sessions: 0, sessions: [] };
        }
    },

    async getActiveSession() {
        try {
            const res = await fetch(`${API_BASE_URL}/active-session`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async setActiveSession(sessionId) {
        try {
            const res = await fetch(`${API_BASE_URL}/active-session`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ session_id: sessionId })
            });
            return await res.json();
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    },

    // ---------------- SESSION-AWARE CORE ANALYTICS ----------------
    async getDashboardData(sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/dashboard${q}`, {
                headers: this.getAuthHeaders()
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('API Error (getDashboardData):', e);
            return null;
        }
    },

    async getPersonDetection(sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/person-detection${q}`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getTrackingData(sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/tracking${q}`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getCustomerProfile(customerId, sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/customer/${customerId}${q}`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getRecommendations(sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/recommendations${q}`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async getShelfDetails(shelfId, sessionId = null) {
        try {
            const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
            const res = await fetch(`${API_BASE_URL}/shelf/${encodeURIComponent(shelfId)}${q}`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    // ---------------- SHELF REGION CONFIGURATION ----------------
    async getShelfZones() {
        try {
            const res = await fetch(`${API_BASE_URL}/shelf-zones`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return {};
        }
    },

    async saveShelfZones(zonesObj) {
        try {
            const res = await fetch(`${API_BASE_URL}/shelf-zones`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(zonesObj)
            });
            return await res.json();
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    },

    getReferenceFrameUrl(sessionId = null) {
        const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}&t=${Date.now()}` : `?t=${Date.now()}`;
        return `${API_BASE_URL}/reference-frame${q}`;
    },

    getVideoFeedUrl(mode = 'tracking', sessionId = null) {
        const token = this.getToken();
        const s = sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : '';
        return `${API_BASE_URL}/video_feed?mode=${mode}&token=${token || ''}${s}&t=${Date.now()}`;
    },

    getReportDownloadUrl(type, sessionId = null) {
        const token = this.getToken();
        const s = sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : '';
        return `${API_BASE_URL}/report?type=${type}&token=${token || ''}${s}`;
    },

    getProcessedVideoUrl(sessionId = null) {
        if (!sessionId) return `${API_BASE_URL}/report?type=video`;
        return `${API_BASE_URL}/processed-video/${encodeURIComponent(sessionId)}`;
    },

    getSessionImageUrl(sessionId, filename) {
        if (!sessionId) return `${API_BASE_URL}/static/${filename}`;
        return `${API_BASE_URL}/session-image/${encodeURIComponent(sessionId)}/${encodeURIComponent(filename)}`;
    },

    // ---------------- SETTINGS & USER MANAGEMENT ----------------
    async getSettings() {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return {};
        }
    },

    async updateSettings(settingsObj) {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(settingsObj)
            });
            return await res.json();
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    },

    async getUsers() {
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: this.getAuthHeaders()
            });
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async addUser(userData) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/add`, {
                method: 'POST',
                headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    }
};
