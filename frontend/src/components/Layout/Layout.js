import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp';

export default function Layout() {
  const { isMobile } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useKeyboardShortcuts({ onHelp: setShowHelp });

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const handler = () => setShowHelp(v => !v);
    window.addEventListener('shortcut:show-help', handler);
    return () => window.removeEventListener('shortcut:show-help', handler);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      {/* Backdrop overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar — always rendered, visibility controlled inside Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px 12px' : '24px 32px', background: 'var(--bg-page)' }}>
          <Outlet />
        </main>
      </div>

      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
