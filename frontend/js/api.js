/* RetailVision AI - REST API Service Wrapper */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const ApiService = {
    // GET requests
    async getDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            return await response.json();
        } catch (error) {
            console.error('API Error (getDashboardData):', error);
            return null;
        }
    },

    async getPersonDetectionStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/person-detection`);
            if (!response.ok) throw new Error('Failed to fetch detection stats');
            return await response.json();
        } catch (error) {
            console.error('API Error (getPersonDetectionStats):', error);
            return null;
        }
    },

    async getTrackingData() {
        try {
            const response = await fetch(`${API_BASE_URL}/tracking`);
            if (!response.ok) throw new Error('Failed to fetch tracking data');
            return await response.json();
        } catch (error) {
            console.error('API Error (getTrackingData):', error);
            return null;
        }
    },

    async getHeatmapStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/heatmap`);
            if (!response.ok) throw new Error('Failed to fetch heatmap stats');
            return await response.json();
        } catch (error) {
            console.error('API Error (getHeatmapStats):', error);
            return null;
        }
    },

    async getShelfDetails(shelfId) {
        try {
            const response = await fetch(`${API_BASE_URL}/shelf/${shelfId}`);
            if (!response.ok) throw new Error('Failed to fetch shelf details');
            return await response.json();
        } catch (error) {
            console.error(`API Error (getShelfDetails - ${shelfId}):`, error);
            return null;
        }
    },

    async getRecommendations() {
        try {
            const response = await fetch(`${API_BASE_URL}/recommendations`);
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            return await response.json();
        } catch (error) {
            console.error('API Error (getRecommendations):', error);
            return [];
        }
    },

    // POST requests
    async startDetection() {
        try {
            const response = await fetch(`${API_BASE_URL}/start-detection`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error (startDetection):', error);
            return { error: true };
        }
    },

    async stopDetection() {
        try {
            const response = await fetch(`${API_BASE_URL}/stop-detection`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error (stopDetection):', error);
            return { error: true };
        }
    },

    async startTracking() {
        try {
            const response = await fetch(`${API_BASE_URL}/start-tracking`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error (startTracking):', error);
            return { error: true };
        }
    },

    async stopTracking() {
        try {
            const response = await fetch(`${API_BASE_URL}/stop-tracking`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('API Error (stopTracking):', error);
            return { error: true };
        }
    },

    async uploadVideo(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE_URL}/upload-video`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload video');
            return await response.json();
        } catch (error) {
            console.error('API Error (uploadVideo):', error);
            return null;
        }
    },
    
    // Helpers
    getVideoFeedUrl(mode) {
        return `${API_BASE_URL}/video_feed?mode=${mode}&t=${new Date().getTime()}`;
    },

    getReportDownloadUrl(type) {
        return `${API_BASE_URL}/report?type=${type}`;
    }
};
