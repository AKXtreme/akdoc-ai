import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import UserManagement from './UserManagement';
import { Users } from 'lucide-react';

const SkeletonRow = () => (
  <div style={{
    display: 'flex', gap: 16, padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
  }}>
    {[40, 120, 160, 80, 80, 100].map((w, i) => (
      <div
        key={i}
        style={{
          height: 14, borderRadius: 6,
          width: w,
          background: 'linear-gradient(90deg, var(--bg-subtle) 25%, var(--border) 50%, var(--bg-subtle) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
    ))}
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--accent-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={22} color="var(--accent)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Manage users and monitor system health.</p>
        </div>
      </div>

      {loading ? (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ height: 16, width: 120, borderRadius: 6, background: 'var(--border)' }} />
          </div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <UserManagement users={users} onRefresh={loadUsers} />
      )}
    </div>
  );
}
