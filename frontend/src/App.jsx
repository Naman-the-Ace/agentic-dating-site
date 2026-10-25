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

// Icons
const Icons = {
  Heart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  MessageCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--accent-green)">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01" stroke="var(--accent-green)" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ people: 0, conversations: 0 });
  const [toasts, setToasts] = useState([]);
  const [backendOk, setBackendOk] = useState(false);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  useSSE(useCallback((data) => {
    if (data.type === 'person_ready') {
      addToast(`✨ ${data.person?.analysis?.name || 'Profile'} agent is ready!`, 'success');
      setCounts(c => ({ ...c, people: c.people + 1 }));
    } else if (data.type === 'dating_complete') {
      const score = data.compatibility?.score;
      addToast(`💕 Match scored${score ? ` — ${score}% compatibility` : ''}!`, 'info');
      setCounts(c => ({ ...c, conversations: c.conversations + 1 }));
    } else if (data.type === 'batch_dating_complete') {
      addToast(`🎉 All dates complete! Check the rankings.`, 'success');
    }
  }, [addToast]));

  // Load counts
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(r => r.json())
      .then(d => {
        setCounts({ people: d.people_count || 0, conversations: d.conversations_count || 0 });
        setBackendOk(true);
      })
      .catch(() => setBackendOk(false));
  }, []);

  const navItems = [
    { path: '/', label: 'Add People', icon: <Icons.Plus />, badge: null, section: 'main' },
    { path: '/profiles', label: 'Profiles', icon: <Icons.Users />, badge: counts.people || null, section: 'main' },
    { path: '/dating', label: 'Live Dating', icon: <Icons.MessageCircle />, badge: counts.conversations || null, section: 'main' },
    { path: '/rankings', label: 'Rankings', icon: <Icons.Trophy />, badge: null, section: 'main' },
  ];

  const toastIconMap = { success: '✅', info: '💕', error: '❌' };

  return (
    <div className="app-shell">
      <div className="bg-glow" />
      <div className="bg-orb-3" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">❤️</div>
          <div className="logo-text">AgentDate</div>
          <div className="logo-sub">AI-powered matchmaking</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
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

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <div className={`status-dot ${backendOk ? 'ready' : 'error'}`} />
            <span style={{ fontSize: '0.78rem', color: backendOk ? 'var(--text-secondary)' : 'var(--accent-red)' }}>
              {backendOk ? 'Backend connected' : 'Backend offline'}
            </span>
          </div>
          <div className="sidebar-stats">
            {counts.people} profiles · {counts.conversations} dates run
          </div>
          <div className="sidebar-stats" style={{ marginTop: 6 }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Gemini 2.5 Flash</span>
            {' '}· Google AI
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
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
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ fontSize: '1rem' }}>{toastIconMap[t.type] || '💬'}</span>
            <span>{t.message}</span>
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
