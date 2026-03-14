import React, { useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function UserManagement({ users, onRefresh }) {
  const { user: currentUser } = useSelector((s) => s.auth);
  const [editing, setEditing] = useState(null);

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      onRefresh();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await api.put(`/admin/users/${user.id}`, { role });
      toast.success(`Role updated to ${role}`);
      onRefresh();
      setEditing(null);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success(`User "${user.username}" deleted`);
      onRefresh();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const getInitials = (username) => username ? username.slice(0, 2).toUpperCase() : 'U';

  const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];
  const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Table header bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Users
          <span style={{
            marginLeft: 8, padding: '2px 8px', borderRadius: 10,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600,
          }}>
            {users.length}
          </span>
        </h2>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
            {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '11px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr
              key={u.id}
              style={{ borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            >
              {/* User column with avatar */}
              <td style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: getAvatarColor(u.id),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {getInitials(u.username)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.username}
                      {u.id === currentUser?.id && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-bg)', padding: '1px 6px', borderRadius: 4 }}>you</span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>

              <td style={{ padding: '13px 16px' }}>
                {editing === u.id ? (
                  <select
                    defaultValue={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    style={{
                      padding: '5px 8px',
                      border: '1.5px solid var(--accent)',
                      borderRadius: 6,
                      fontSize: 12,
                      outline: 'none',
                      cursor: 'pointer',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: u.role === 'admin' ? '#ede9fe' : 'var(--bg-subtle)',
                    color: u.role === 'admin' ? '#7c3aed' : 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}>
                    {u.role}
                  </span>
                )}
              </td>

              <td style={{ padding: '13px 16px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: u.is_active ? '#dcfce7' : '#fee2e2',
                  color: u.is_active ? '#16a34a' : '#dc2626',
                }}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>

              <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {formatDate(u.created_at)}
              </td>

              <td style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setEditing(editing === u.id ? null : u.id)}
                    style={{
                      padding: '5px 10px',
                      background: editing === u.id ? 'var(--accent)' : 'var(--accent-bg)',
                      color: editing === u.id ? '#fff' : 'var(--accent)',
                      border: 'none', borderRadius: 6,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    {editing === u.id ? 'Done' : 'Edit Role'}
                  </button>
                  {u.id !== currentUser?.id && (
                    <>
                      <button
                        onClick={() => handleToggleActive(u)}
                        style={{
                          padding: '5px 10px',
                          background: u.is_active ? '#fef3c7' : '#dcfce7',
                          color: u.is_active ? '#d97706' : '#16a34a',
                          border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        style={{
                          padding: '5px 10px',
                          background: '#fee2e2', color: '#dc2626',
                          border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
