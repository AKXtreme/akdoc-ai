import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { User, Lock, Save } from 'lucide-react';
import api from '../../services/api';
import { setUser } from '../../store/authSlice';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputBase = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--text-primary)',
  background: 'var(--bg-surface)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  transition: 'border-color 0.15s',
};

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { isMobile } = useBreakpoint();

  const [info, setInfo] = useState({ username: user?.username || '', email: user?.email || '' });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [focusedInfo, setFocusedInfo] = useState(null);
  const [focusedPwd, setFocusedPwd] = useState(null);
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);

  const infoStyle = (f) => ({ ...inputBase, borderColor: focusedInfo === f ? 'var(--accent)' : 'var(--border)' });
  const pwdStyle = (f) => ({ ...inputBase, borderColor: focusedPwd === f ? 'var(--accent)' : 'var(--border)' });

  const handleSaveInfo = async () => {
    if (!info.username.trim() || !info.email.trim()) {
      toast.error('Username and email are required');
      return;
    }
    setSavingInfo(true);
    try {
      const res = await api.put('/auth/me', { username: info.username, email: info.email });
      dispatch(setUser(res.data));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePwd = async () => {
    if (!pwd.newPwd) { toast.error('New password is required'); return; }
    if (pwd.newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pwd.newPwd !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPwd(true);
    try {
      await api.put('/auth/me', { password: pwd.newPwd });
      setPwd({ current: '', newPwd: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    const newVal = !emailNotifications;
    try {
      await api.patch('/auth/me', { email_notifications: newVal });
      setEmailNotifications(newVal);
      dispatch(setUser({ ...user, email_notifications: newVal }));
      toast.success(newVal ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ maxWidth: 640, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>Profile</h1>
        {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Manage your account settings</p>}
      </div>

      {/* Avatar + info */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 16,
        display: 'flex',
        alignItems: isMobile ? 'center' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16,
        textAlign: isMobile ? 'center' : 'left',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.username}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</div>
          <span style={{
            display: 'inline-block', marginTop: 4,
            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: user?.role === 'admin' ? '#ede9fe' : 'var(--bg-subtle)',
            color: user?.role === 'admin' ? '#7c3aed' : 'var(--text-secondary)',
            textTransform: 'capitalize',
          }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit profile info */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={15} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Account Info</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              style={infoStyle('username')}
              value={info.username}
              onChange={(e) => setInfo({ ...info, username: e.target.value })}
              onFocus={() => setFocusedInfo('username')}
              onBlur={() => setFocusedInfo(null)}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              style={infoStyle('email')}
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              onFocus={() => setFocusedInfo('email')}
              onBlur={() => setFocusedInfo(null)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </div>
          <button
            onClick={handleSaveInfo}
            disabled={savingInfo}
            style={{
              marginLeft: isMobile ? 0 : 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 20px',
              background: savingInfo ? '#a5b4fc' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: savingInfo ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => { if (!savingInfo) e.currentTarget.style.background = '#4338ca'; }}
            onMouseLeave={(e) => { if (!savingInfo) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            <Save size={14} />
            {savingInfo ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Notification Preferences</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Control how you receive updates about your documents</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Email notifications</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Get notified by email when documents finish processing or fail
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleToggleEmailNotifications}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: emailNotifications ? 'var(--accent)' : 'var(--border-strong)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: emailNotifications ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#ffffff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={15} color="#d97706" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Change Password</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              style={pwdStyle('new')}
              value={pwd.newPwd}
              onChange={(e) => setPwd({ ...pwd, newPwd: e.target.value })}
              onFocus={() => setFocusedPwd('new')}
              onBlur={() => setFocusedPwd(null)}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              style={pwdStyle('confirm')}
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              onFocus={() => setFocusedPwd('confirm')}
              onBlur={() => setFocusedPwd(null)}
            />
          </div>
        </div>

        <button
          onClick={handleSavePwd}
          disabled={savingPwd || !pwd.newPwd || !pwd.confirm}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 20px',
            background: (savingPwd || !pwd.newPwd || !pwd.confirm) ? '#fbbf24' : '#d97706',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            cursor: (savingPwd || !pwd.newPwd || !pwd.confirm) ? 'not-allowed' : 'pointer',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          onMouseEnter={(e) => { if (!savingPwd && pwd.newPwd && pwd.confirm) e.currentTarget.style.background = '#b45309'; }}
          onMouseLeave={(e) => { if (!savingPwd && pwd.newPwd && pwd.confirm) e.currentTarget.style.background = '#d97706'; }}
        >
          <Lock size={14} />
          {savingPwd ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
