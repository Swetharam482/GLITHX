/* RetailVision AI - Customer Journey Page Module */

const CustomerJourneyPage = {
    render() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Shopper Journey Inspector Card -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-person-walking-arrow-right text-orange"></i> Individual Shopper Path Inspector</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; gap: 10px; margin-bottom: 18px;">
                            <input type="text" class="form-control" id="journey-search-id" placeholder="Enter Shopper ID (e.g. 1)" style="flex: 1;">
                            <button class="btn-primary" id="journey-btn-search">Inspect Journey</button>
                        </div>
                        <div id="journey-profile-result" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: #F8FAFC; min-height: 180px;">
                            <p style="color: var(--text-muted); text-align: center; margin-top: 40px;">Select or search a shopper ID to inspect their step-by-step path.</p>
                        </div>
                    </div>
                </div>

                <!-- Zone Transition Summary -->
                <div class="glass-card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-arrows-split-up-and-left text-orange"></i> Store Zone Flow Traversal</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
                            Observed navigation pathways from entrance to aisle perimeters in current CCTV analysis:
                        </p>
                        <div id="journey-flow-summary" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Complete Shopper Flow Sequences Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-route text-orange"></i> Chronological Shopper Navigation Sequences</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Shopper Identity</th>
                                    <th>Observed Sequence of Visited Zones</th>
                                    <th>Total Dwell Time</th>
                                    <th>Inspection</th>
                                </tr>
                            </thead>
                            <tbody id="journey-table-tbody">
                                <tr>
                                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading customer journey paths...
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
        this.bindEvents();
        const data = await ApiService.getTrackingData();
        if (data && data.customer_flow_history) {
            this.renderTable(data.customer_flow_history);
            this.renderFlowSummary(data.customer_flow_history);
        }
    },

    bindEvents() {
        const searchBtn = document.getElementById('journey-btn-search');
        const searchInput = document.getElementById('journey-search-id');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const id = searchInput.value.trim().replace('#', '').replace('Customer ', '');
                if (id) this.inspectShopper(id);
            });
        }
    },

    renderTable(list) {
        const tbody = document.getElementById('journey-table-tbody');
        if (!tbody) return;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No shopper journeys recorded in active CCTV clip.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(item => `
            <tr>
                <td><strong style="color: var(--primary-orange);">Shopper #${item.customer_id}</strong></td>
                <td><span style="font-weight: 500;">${item.trajectory}</span></td>
                <td>${item.duration_sec}s</td>
                <td>
                    <button class="btn-outline-orange" style="font-size: 11px; padding: 3px 8px;" onclick="CustomerJourneyPage.inspectShopper('${item.customer_id}')">
                        Inspect <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderFlowSummary(list) {
        const container = document.getElementById('journey-flow-summary');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No journeys recorded.</p>';
            return;
        }

        const counts = {};
        list.forEach(item => {
            counts[item.trajectory] = (counts[item.trajectory] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        container.innerHTML = sorted.slice(0, 5).map(([path, count]) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12.5px;">
                <span style="font-weight: 500; color: var(--text-primary);"><i class="fa-solid fa-arrow-right-long text-orange" style="margin-right: 6px;"></i> ${path}</span>
                <span class="badge badge-orange">${count} shopper${count > 1 ? 's' : ''}</span>
            </div>
        `).join('');
    },

    async inspectShopper(id) {
        const container = document.getElementById('journey-profile-result');
        if (!container) return;

        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading profile...</p>';
        const profile = await ApiService.getCustomerProfile(id);
        if (!profile || profile.error) {
            container.innerHTML = `<p style="color: var(--accent-red); text-align: center;">Shopper #${id} not found in current analysis dataset.</p>`;
            return;
        }

        const visited = profile.visited_zones || [];
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
                <div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 15px;">Shopper #${id} Profile</h4>
                    <small style="color: var(--text-muted);">Observed in Video: ${profile.entry_video_sec || 0}s to ${profile.exit_video_sec || 0}s</small>
                </div>
                <span class="badge ${profile.status === 'Inside' ? 'badge-green' : 'badge-orange'}">${profile.status}</span>
            </div>
            <div style="font-size: 13px; margin-bottom: 10px;">
                <span style="color: var(--text-muted);">Tracked Duration:</span> <strong>${profile.duration_seconds || 0} seconds</strong>
            </div>
            <div style="font-size: 13px; margin-bottom: 10px;">
                <span style="color: var(--text-muted);">Visited Zones Chronology:</span>
                <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${visited.length > 0 ? visited.map(z => `<span class="badge badge-blue">${z}</span>`).join('') : '<span style="color: var(--text-muted);">None</span>'}
                </div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 12px;">
                Total Trajectory Foot Coordinates Recorded: <strong>${(profile.trajectory || []).length} points</strong>
            </div>
        `;
    }
};
