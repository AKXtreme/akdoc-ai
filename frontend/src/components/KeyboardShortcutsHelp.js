import React from 'react';
import ReactDOM from 'react-dom';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['?'], description: 'Show / hide this help' },
  { keys: ['Esc'], description: 'Close overlays' },
  { keys: ['u'], description: 'Go to Upload' },
  { keys: ['/'], description: 'Focus document search' },
  { keys: ['g', 'd'], description: 'Go to Dashboard', chord: true },
  { keys: ['g', 'l'], description: 'Go to Documents list', chord: true },
];

function Key({ label }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 24, padding: '0 6px',
      background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)',
      borderRadius: 5, fontSize: 12, fontWeight: 600,
      color: 'var(--text-primary)', fontFamily: 'monospace',
      boxShadow: '0 1px 0 var(--border-strong)',
    }}>
      {label}
    </kbd>
  );
}

export default function KeyboardShortcutsHelp({ onClose }) {
  // Close on backdrop click
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          width: '100%', maxWidth: 440,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Keyboard size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Keyboard Shortcuts</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Press <Key label="?" /> anytime to toggle</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcut list */}
        <div style={{ padding: '8px 0 16px' }}>
          {SHORTCUTS.map(({ keys, description, chord }, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 24px',
                borderBottom: i < SHORTCUTS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{description}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {keys.map((k, ki) => (
                  <React.Fragment key={ki}>
                    <Key label={k} />
                    {chord && ki < keys.length - 1 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 2px' }}>then</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          background: 'var(--bg-subtle)',
          borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Chord shortcuts: press the first key, then the second within 1 second
        </div>
      </div>
    </div>,
    document.body
  );
}
