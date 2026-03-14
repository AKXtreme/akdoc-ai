import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/authSlice';
import { CheckCircle } from 'lucide-react';
import AKLogo from '../AKLogo';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.confirmPassword) { setLocalError('Passwords do not match'); return; }
    const result = await dispatch(register({ email: form.email, username: form.username, password: form.password }));
    if (!result.error) { setSuccess(true); setTimeout(() => navigate('/login'), 2000); }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${focusedField === field ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    transition: 'border-color 0.15s',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  const features = [
    'Extract data automatically from invoices & receipts',
    'Review & correct AI-extracted fields',
    'Analytics dashboard with trends & insights',
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Left panel — keep dark always (brand panel) */}
      <div style={{
        width: '40%',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(79,70,229,0.15)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(124,58,237,0.1)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AKLogo size={22} color="#fff" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>AKDoc AI</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 12, lineHeight: 1.3 }}>
          AI-Powered Document Processing
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 40, lineHeight: 1.6 }}>
          Join thousands of teams automating their document workflows.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <CheckCircle size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Create your account
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Get started with AKDoc AI for free
          </p>

          {(error || localError) && (
            <div style={{
              background: '#fee2e2', color: '#dc2626',
              padding: '11px 14px', borderRadius: 8, fontSize: 13,
              marginBottom: 20, border: '1px solid #fca5a5',
            }}>
              {error || localError}
            </div>
          )}

          {success && (
            <div style={{
              background: '#dcfce7', color: '#16a34a',
              padding: '11px 14px', borderRadius: 8, fontSize: 13,
              marginBottom: 20, border: '1px solid #86efac',
            }}>
              Account created! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email address
              </label>
              <input
                style={inputStyle('email')}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Username
              </label>
              <input
                style={inputStyle('username')}
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="johndoe"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <input
                style={inputStyle('password')}
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                style={inputStyle('confirmPassword')}
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '12px',
                background: (loading || success) ? '#a5b4fc' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
