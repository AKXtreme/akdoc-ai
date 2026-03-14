import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function isTyping() {
  const tag = document.activeElement?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;
}

export function useKeyboardShortcuts({ onHelp }) {
  const navigate = useNavigate();
  const pendingChord = useRef(null);
  const chordTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // Ignore when user is typing in a form field (except Escape)
      if (e.key !== 'Escape' && isTyping()) return;
      // Ignore modifier combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // Escape: close help overlay
      if (key === 'Escape') {
        onHelp(false);
        return;
      }

      // Chord resolution: if we have a pending 'g', check second key
      if (pendingChord.current === 'g') {
        clearTimeout(chordTimer.current);
        pendingChord.current = null;
        if (key === 'd') { e.preventDefault(); navigate('/dashboard'); return; }
        if (key === 'l') { e.preventDefault(); navigate('/documents'); return; }
        // unrecognised second key — fall through to normal handling
      }

      // Single-key shortcuts
      if (key === '?') { e.preventDefault(); onHelp((v) => !v); return; }

      if (key === 'u') { e.preventDefault(); navigate('/upload'); return; }

      if (key === '/') {
        e.preventDefault();
        // Dispatch custom event that DocumentList listens to
        window.dispatchEvent(new CustomEvent('shortcut:focus-search'));
        // Navigate to documents page if not already there
        if (!window.location.pathname.startsWith('/documents')) {
          navigate('/documents');
        }
        return;
      }

      // Start chord on 'g'
      if (key === 'g') {
        pendingChord.current = 'g';
        chordTimer.current = setTimeout(() => { pendingChord.current = null; }, 1000);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(chordTimer.current);
    };
  }, [navigate, onHelp]);
}
