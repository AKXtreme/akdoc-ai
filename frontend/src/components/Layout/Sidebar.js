import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, FileText, Upload, Settings, X } from 'lucide-react';
import AKLogo from '../AKLogo';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/documents/upload', label: 'Upload', icon: Upload },
];

const ADMIN_ITEMS = [
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  const mobileStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    zIndex: 100,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s ease',
  };

  const desktopStyle = {
    position: 'relative',
  };

  return (
    <nav style={{
      width: 280,
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      ...(isMobile ? mobileStyle : desktopStyle),
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 18px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AKLogo size={18} color="#fff" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--sidebar-active)', letterSpacing: '-0.3px' }}>
          AKDoc AI
        </span>

        {/* Close button — mobile only */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--sidebar-text)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 8px', marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>
            Navigation
          </div>
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.path} style={{ padding: '2px 8px' }}>
              <NavLink
                to={item.path}
                onClick={() => { if (isMobile) onClose(); }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  borderRadius: 8,
                  background: isActive ? 'rgba(79,70,229,0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  transition: 'all 0.15s',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.style.background.includes('rgba(79,70,229,0.15)')) {
                    e.currentTarget.style.background = 'var(--sidebar-hover)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.style.background.includes('rgba(79,70,229,0.15)')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--sidebar-text)';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} color={isActive ? '#818cf8' : '#64748b'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </div>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '12px 20px 12px' }} />
            <div style={{ padding: '0 8px', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 4px' }}>
                Admin
              </div>
            </div>
            {ADMIN_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.path} style={{ padding: '2px 8px' }}>
                  <NavLink
                    to={item.path}
                    onClick={() => { if (isMobile) onClose(); }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                      textDecoration: 'none',
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 400,
                      borderRadius: 8,
                      background: isActive ? 'rgba(79,70,229,0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                      transition: 'all 0.15s',
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.style.background.includes('rgba(79,70,229,0.15)')) {
                        e.currentTarget.style.background = 'var(--sidebar-hover)';
                        e.currentTarget.style.color = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.style.background.includes('rgba(79,70,229,0.15)')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} color={isActive ? '#818cf8' : '#64748b'} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* User info at bottom */}
      <div
        onClick={() => { navigate('/profile'); if (isMobile) onClose(); }}
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.username || 'User'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
            {user?.role || 'user'}
          </div>
        </div>
      </div>
    </nav>
  );
}
