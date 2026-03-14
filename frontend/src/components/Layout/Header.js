import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import { Bell, LogOut, FileText, CheckCircle, XCircle, Clock, Loader, Moon, Sun, Menu, Keyboard } from 'lucide-react';
import api from '../../services/api';
import { statusColor, statusBg, formatDate } from '../../utils/helpers';
import { useTheme } from '../../ThemeContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';

function NotificationDot({ status }) {
  if (status === 'completed') return <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} />;
  if (status === 'failed') return <XCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />;
  if (status === 'processing') return <Loader size={14} color="var(--accent)" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />;
  return <Clock size={14} color="#d97706" style={{ flexShrink: 0 }} />;
}

export default function Header({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isDark, toggle } = useTheme();
  const { isMobile } = useBreakpoint();
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchRecent = () => {
    setLoading(true);
    api.get('/documents/', { params: { page: 1, page_size: 8 } })
      .then((res) => setDocs(res.data.documents))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeCount = docs.filter((d) => d.status === 'pending' || d.status === 'processing').length;

  return (
    <header style={{
      height: 60,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 32px',
      flexShrink: 0,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      zIndex: 100,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Left: hamburger (mobile) + date */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: `1px solid var(--border)`,
              background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
              marginRight: 12,
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

        {/* Date — hidden on mobile */}
        {!isMobile && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>{today}</div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>

        {/* Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: `1px solid ${open ? 'var(--accent-border)' : 'var(--border)'}`,
              background: open ? 'var(--accent-bg)' : 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: open ? 'var(--accent)' : 'var(--text-secondary)',
              position: 'relative',
            }}
          >
            <Bell size={16} />
            {activeCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-surface)',
              }}>
                {activeCount}
              </span>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 44, right: 0,
              width: isMobile ? 'calc(100vw - 24px)' : 340,
              maxWidth: 340,
              background: 'var(--bg-surface)',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              zIndex: 200,
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</span>
                <button
                  onClick={() => { navigate('/documents'); setOpen(false); }}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                >
                  View all
                </button>
              </div>

              {/* Body */}
              {loading && docs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : docs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No documents yet
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {docs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      onClick={() => { navigate(`/documents/${doc.id}`); setOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 16px',
                        borderBottom: idx < docs.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <NotificationDot status={doc.status} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {doc.original_filename}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatDate(doc.upload_date)}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                        color: statusColor(doc.status), background: statusBg(doc.status),
                        textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button
                  onClick={() => { navigate('/documents/upload'); setOpen(false); }}
                  style={{
                    background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)',
                    cursor: 'pointer', fontWeight: 600,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  + Upload new document
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('shortcut:show-help'))}
          title="Keyboard shortcuts (?)"
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `1px solid var(--border)`,
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}
        >
          <Keyboard size={15} />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `1px solid var(--border)`,
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Divider — hidden on mobile */}
        {!isMobile && <div style={{ width: 1, height: 28, background: 'var(--border)' }} />}

        {/* Avatar + name — hide name text on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', lineHeight: 1.3 }}>{user?.role}</div>
            </div>
          )}
        </div>

        {/* Logout — icon only on mobile */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '7px' : '7px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          title="Logout"
        >
          <LogOut size={14} />
          {!isMobile && 'Logout'}
        </button>
      </div>
    </header>
  );
}
