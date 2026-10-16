/* RetailVision AI - User & Role Management Module (Admin Exclusive) */

const UserManagementPage = {
    render() {
        return `
            <div class="glass-card" style="padding: 18px 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-users-gear text-orange"></i> User Accounts & Role-Based Access Control (RBAC)
                        </h4>
                        <small style="color: var(--text-muted);">
                            Manage system users, credentials, role permissions, and role-specific dashboard views.
                        </small>
                    </div>
                    <button class="btn-primary" id="btn-open-add-user-modal">
                        <i class="fa-solid fa-user-plus"></i> Add New User
                    </button>
                </div>
            </div>

            <!-- Role Permissions Matrix Card -->
            <div class="glass-card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h3><i class="fa-solid fa-shield-halved text-orange"></i> Role Authorization Matrix</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Role Name</th>
                                    <th>Dashboard Focus</th>
                                    <th>Video Processing & Upload</th>
                                    <th>Shelf Config</th>
                                    <th>User Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="badge badge-red">ADMIN</span></td>
                                    <td>Full Intelligence Suite & System Health</td>
                                    <td><i class="fa-solid fa-check text-green"></i> Full Access</td>
                                    <td><i class="fa-solid fa-check text-green"></i> Full Access</td>
                                    <td><i class="fa-solid fa-check text-green"></i> Full Access</td>
                                </tr>
                                <tr>
                                    <td><span class="badge badge-orange">STORE MANAGER</span></td>
                                    <td>Store Operations, Footfall, Dwell & Shelves</td>
                                    <td><i class="fa-solid fa-check text-green"></i> Authorized</td>
                                    <td><i class="fa-solid fa-check text-green"></i> Authorized</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Restricted</td>
                                </tr>
                                <tr>
                                    <td><span class="badge badge-blue">MARKETING MANAGER</span></td>
                                    <td>Traffic Trends, Product Placement & Heatmaps</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Read Only</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Read Only</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Restricted</td>
                                </tr>
                                <tr>
                                    <td><span class="badge badge-purple">RELATIONSHIP MANAGER</span></td>
                                    <td>Aggregate Experience & Journey Flows</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Read Only</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Read Only</td>
                                    <td><i class="fa-solid fa-xmark text-muted"></i> Restricted</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Registered System Users Table -->
            <div class="glass-card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-user-lock text-orange"></i> Registered Portal Users</h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="rv-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>System Role</th>
                                    <th>Assigned Title</th>
                                    <th>Switch / Test Session</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-tbody">
                                <tr>
                                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                        Loading user accounts...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Add User Modal -->
            <div id="add-user-modal" class="modal-overlay">
                <div class="modal-content" style="max-width: 480px;">
                    <header class="modal-header">
                        <h3><i class="fa-solid fa-user-plus text-orange"></i> Create User Account</h3>
                        <button class="modal-close-btn" id="btn-close-add-user"><i class="fa-solid fa-xmark"></i></button>
                    </header>
                    <div class="modal-body">
                        <form id="add-user-form">
                            <div class="form-group">
                                <label for="new-username">Username</label>
                                <input type="text" class="form-control" id="new-username" required placeholder="e.g. jdoe">
                            </div>
                            <div class="form-group">
                                <label for="new-password">Password</label>
                                <input type="password" class="form-control" id="new-password" required value="password">
                            </div>
                            <div class="form-group">
                                <label for="new-fullname">Full Name</label>
                                <input type="text" class="form-control" id="new-fullname" required placeholder="e.g. John Doe">
                            </div>
                            <div class="form-group">
                                <label for="new-role">Role</label>
                                <select class="form-control" id="new-role" required>
                                    <option value="STORE MANAGER">Store Manager</option>
                                    <option value="MARKETING MANAGER">Marketing Manager</option>
                                    <option value="RELATIONSHIP MANAGER">Relationship Manager</option>
                                    <option value="ADMIN">System Admin</option>
                                </select>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                                <button type="button" class="btn-secondary" id="btn-cancel-add-user">Cancel</button>
                                <button type="submit" class="btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadUsersTable();
        this.bindEvents();
    },

    bindEvents() {
        const openBtn = document.getElementById('btn-open-add-user-modal');
        const modal = document.getElementById('add-user-modal');
        const closeBtn = document.getElementById('btn-close-add-user');
        const cancelBtn = document.getElementById('btn-cancel-add-user');

        if (openBtn && modal) openBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
        if (closeBtn && modal) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        if (cancelBtn && modal) cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });

        const form = document.getElementById('add-user-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('new-username').value.trim();
                const password = document.getElementById('new-password').value.trim();
                const name = document.getElementById('new-fullname').value.trim();
                const role = document.getElementById('new-role').value;

                const res = await ApiService.addUser({ username, password, name, role, title: role });
                if (res && res.status === 'success') {
                    alert(`User ${username} created successfully.`);
                    modal.style.display = 'none';
                    form.reset();
                    await this.loadUsersTable();
                } else {
                    alert(res.message || 'Error creating user account.');
                }
            });
        }
    },

    async loadUsersTable() {
        const tbody = document.getElementById('users-table-tbody');
        if (!tbody) return;

        const users = await ApiService.getUsers();
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No user accounts found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.name}</td>
                <td>
                    <span class="badge ${u.role === 'ADMIN' ? 'badge-red' : (u.role === 'STORE MANAGER' ? 'badge-orange' : (u.role === 'MARKETING MANAGER' ? 'badge-blue' : 'badge-purple'))}">
                        ${u.role}
                    </span>
                </td>
                <td style="color: var(--text-secondary);">${u.title || u.role}</td>
                <td>
                    <button class="btn-outline-orange" style="font-size: 11px; padding: 3px 8px;" onclick="UserManagementPage.switchTestSession('${u.username}')">
                        Switch Session <i class="fa-solid fa-arrow-right-arrow-left"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async switchTestSession(username) {
        const res = await ApiService.login(username, 'password');
        if (res && res.status === 'success') {
            App.loginUser(res.user);
            alert(`Switched session to ${res.user.role}: ${res.user.name}`);
        } else {
            alert('Failed to switch session.');
        }
    }
};
