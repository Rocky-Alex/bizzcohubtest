import React, { useState, useEffect } from 'react';
import './UserManager.css';

interface User {
    id: number;
    username: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'accountant';
    status: 'active' | 'inactive' | 'pending' | 'rejected';
    approval_status?: 'pending' | 'approved' | 'rejected';
    created_by?: 'admin' | 'self-registration';
    created_at: string;
}

export default function UserManager() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        active: 0
    });

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'accountant',
        status: 'active'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, activeTab]);

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                const allUsers = data.users;
                setUsers(allUsers);
                calculateStats(allUsers);
            } else {
                console.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (userList: User[]) => {
        const total = userList.length;
        const active = userList.filter(u => u.status === 'active').length;

        // New users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsers = userList.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;

        setStats({ total, new: newUsers, active });
    };

    const filterUsers = () => {
        let result = users;

        // Filter by Tab
        if (activeTab === 'active') {
            result = result.filter(u => u.status === 'active');
        } else if (activeTab === 'pending') {
            result = result.filter(u => u.approval_status === 'pending');
        }

        // Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.username.toLowerCase().includes(query) ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.phone && u.phone.includes(query))
            );
        }

        setFilteredUsers(result);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.email && !formData.phone) {
            alert('Please provide either email or phone number');
            return;
        }

        try {
            const url = '/api/admin/users';
            const method = editingUser ? 'PUT' : 'POST';
            const body = editingUser
                ? { ...formData, id: editingUser.id }
                : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert(editingUser ? 'User updated successfully' : 'User created successfully');
                setShowForm(false);
                setEditingUser(null);
                setFormData({ username: '', password: '', email: '', phone: '', role: 'accountant', status: 'active' });
                loadUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('An error occurred');
        }
    };

    const handleApprove = async (userId: number) => {
        if (!confirm('Approve this user registration?')) return;

        try {
            const response = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'approve' })
            });

            if (response.ok) {
                loadUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to approve user');
            }
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            status: user.status as string
        });
        setShowForm(true);
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="user-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">Users management</h1>
                {/* Add notification/profile icons here if needed */}
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.new}</div>
                        <div className="stat-label">New Users</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <i className="fas fa-user-check"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Active Users</div>
                    </div>
                </div>
            </div>

            {showForm ? (
                <div className="form-container">
                    <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={!!editingUser}
                            />
                        </div>
                        <div className="form-group">
                            <label>Password {editingUser && '(Leave blank to keep current)'} *</label>
                            <input
                                type="password"
                                className="form-control"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                className="form-control"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select
                                className="form-control"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="accountant">Accountant</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="form-control"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button type="submit" className="action-btn primary-btn">Save User</button>
                            <button type="button" className="action-btn" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="content-card">
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="toolbar-left">
                            <span className="section-title">User list</span>
                            <span className="count-badge">{filteredUsers.length} users</span>
                        </div>
                        <div className="toolbar-right">
                            <div className="search-box">
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search for user"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="action-btn" onClick={() => setActiveTab(activeTab === 'all' ? 'pending' : 'all')}>
                                <i className="fas fa-filter"></i> {activeTab === 'pending' ? 'Show All' : 'Pending Only'}
                            </button>
                            <button className="action-btn primary-btn" onClick={() => setShowForm(true)}>
                                <i className="fas fa-plus"></i> Add User
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}><input type="checkbox" className="custom-checkbox" /></th>
                                    <th>User</th>
                                    <th>Email address</th>
                                    <th>Phone / Role</th>
                                    <th>Created date</th>
                                    <th>User status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{ color: '#6b7280' }}>Loading users...</div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{ color: '#6b7280' }}>No users found</div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td><input type="checkbox" className="custom-checkbox" /></td>
                                            <td>
                                                <div className="user-info">
                                                    <div className="avatar">
                                                        {getInitials(user.username)}
                                                    </div>
                                                    <span className="user-name">{user.username}</span>
                                                </div>
                                            </td>
                                            <td>{user.email || '-'}</td>
                                            <td>
                                                <div>{user.phone || '-'}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{user.role}</div>
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {user.approval_status === 'pending' ? (
                                                    <span className="status-badge status-pending">Pending Approval</span>
                                                ) : (
                                                    <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                        {user.status === 'active' ? 'Active' : 'Blocked'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {user.approval_status === 'pending' && (
                                                        <button
                                                            className="action-menu-btn"
                                                            title="Approve"
                                                            style={{ color: '#10b981' }}
                                                            onClick={() => handleApprove(user.id)}
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-menu-btn"
                                                        onClick={() => handleEdit(user)}
                                                        title="Edit"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="action-menu-btn"
                                                        onClick={() => handleDelete(user.id)}
                                                        title="Delete"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button className="page-btn page-nav"><i className="fas fa-chevron-left"></i></button>
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <span style={{ margin: '0 8px', color: '#9ca3af' }}>...</span>
                        <button className="page-btn">5</button>
                        <button className="page-btn">6</button>
                        <button className="page-btn page-nav"><i className="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            )}
        </div>
    );
}
