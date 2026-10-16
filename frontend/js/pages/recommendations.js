/* RetailVision AI - AI Recommendations Page Module */

const RecommendationsPage = {
    allRecs: [],
    activeFilter: 'ALL',

    render() {
        return `
            <!-- Top Filter Bar -->
            <div class="glass-card" style="padding: 18px 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-wand-magic-sparkles text-orange"></i> Rule-Based Merchandising & Layout Recommendations
                        </h4>
                        <small style="color: var(--text-muted);">
                            Transparent recommendations generated strictly from actual video dwell time, visitor counts, and spatial blind spot metrics.
                        </small>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="role-pill-btn active" id="rec-filter-ALL" onclick="RecommendationsPage.setFilter('ALL')">All Priorities</button>
                        <button class="role-pill-btn" id="rec-filter-HIGH" onclick="RecommendationsPage.setFilter('HIGH')">High Priority</button>
                        <button class="role-pill-btn" id="rec-filter-MEDIUM" onclick="RecommendationsPage.setFilter('MEDIUM')">Medium</button>
                        <button class="role-pill-btn" id="rec-filter-LOW" onclick="RecommendationsPage.setFilter('LOW')">Low</button>
                    </div>
                </div>
            </div>

            <!-- Recommendations Cards Container -->
            <div id="recommendations-container" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-spinner fa-spin fa-2xl" style="color: var(--primary-orange); margin-bottom: 12px;"></i>
                    <p>Evaluating measured shelf analytics...</p>
                </div>
            </div>
        `;
    },

    async init() {
        this.allRecs = await ApiService.getRecommendations() || [];
        this.renderCards();
    },

    setFilter(filter) {
        this.activeFilter = filter;
        ['ALL', 'HIGH', 'MEDIUM', 'LOW'].forEach(f => {
            const btn = document.getElementById(`rec-filter-${f}`);
            if (btn) {
                if (f === filter) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
        this.renderCards();
    },

    renderCards() {
        const container = document.getElementById('recommendations-container');
        if (!container) return;

        let filtered = this.allRecs;
        if (this.activeFilter !== 'ALL') {
            filtered = this.allRecs.filter(r => r.priority === this.activeFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-clipboard-check text-orange" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>No recommendations matching filter "${this.activeFilter}". Process a CCTV video to generate insights.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(r => `
            <div class="recommendation-card priority-${r.priority}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <span class="badge ${r.priority === 'HIGH' ? 'badge-red' : (r.priority === 'MEDIUM' ? 'badge-orange' : 'badge-blue')}" style="margin-right: 8px;">
                            ${r.priority} PRIORITY
                        </span>
                        <strong style="font-size: 14.5px; color: var(--text-primary);">${r.shelf}</strong>
                        <span style="color: var(--text-muted); font-size: 12px; margin-left: 6px;">• ${r.category || 'Merchandising Optimization'}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; background: #F8FAFC; padding: 12px 16px; border-radius: var(--radius-md); font-size: 12.5px;">
                    <div>
                        <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">
                            <i class="fa-solid fa-magnifying-glass-chart text-orange"></i> Measured Evidence
                        </div>
                        <div style="color: var(--text-primary);">${r.evidence}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">
                            <i class="fa-solid fa-brain text-orange"></i> Analytical Rationale
                        </div>
                        <div style="color: var(--text-secondary);">${r.reason}</div>
                    </div>
                </div>

                <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 13px;">
                    <strong style="color: var(--dark-orange); display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-circle-arrow-right"></i> Recommended Action:
                    </strong>
                    <span style="color: var(--text-primary); font-weight: 500;">${r.proposed_action}</span>
                </div>
            </div>
        `).join('');
    }
};
