// App.jsx — Main app with routing and sidebar
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSSE } from './hooks/useSSE';

// Pages
import HomePage from './pages/HomePage';
import ProfilesPage from './pages/ProfilesPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import DatingPage from './pages/DatingPage';
import RankingsPage from './pages/RankingsPage';

// Icons (simple SVG)
const Icons = {
  Heart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  MessageCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Trophy: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="21" x2="12" y2="11"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ people: 0, conversations: 0 });
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useSSE(useCallback((data) => {
    if (data.type === 'person_ready') {
      addToast(`✨ ${data.person?.analysis?.name || 'Profile'} is ready!`, 'success');
      setCounts(c => ({ ...c, people: c.people + 1 }));
    } else if (data.type === 'dating_complete') {
      addToast(`💕 Match scored!`, 'info');
      setCounts(c => ({ ...c, conversations: c.conversations + 1 }));
    } else if (data.type === 'batch_dating_complete') {
      addToast(`🎉 All dates complete! Check rankings.`, 'success');
    }
  }, [addToast]));

  // Load counts
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(r => r.json())
      .then(d => setCounts({ people: d.people_count || 0, conversations: d.conversations_count || 0 }))
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/', label: 'Add People', icon: <Icons.Plus />, badge: null },
    { path: '/profiles', label: 'Profiles', icon: <Icons.Users />, badge: counts.people || null },
    { path: '/dating', label: 'Live Dating', icon: <Icons.MessageCircle />, badge: null },
    { path: '/rankings', label: 'Rankings', icon: <Icons.Trophy />, badge: null },
  ];

  return (
    <div className="app-shell">
      <div className="bg-glow" />
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">❤️ AgentDate</div>
          <div className="logo-sub">AI-powered matchmaking</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div className="status-dot ready" />
            Backend connected
          </div>
          <div>{counts.people} people · {counts.conversations} dates</div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onCountChange={setCounts} />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/profiles/:id" element={<ProfileDetailPage />} />
          <Route path="/dating" element={<DatingPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Routes>
      </main>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ borderColor: t.type === 'success' ? 'rgba(16,185,129,0.3)' : 'var(--border)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
