// pages/HomePage.jsx — Add people, load demo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

export default function HomePage({ onCountChange }) {
  const navigate = useNavigate();
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [processingPeople, setProcessingPeople] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get('/api/health').then(d => setHealth(d)).catch(() => {});
  }, []);

  useSSE((data) => {
    if (data.type === 'person_processing' || data.type === 'person_update') {
      setProcessingPeople(prev => {
        const existing = prev.find(p => p.id === data.id);
        if (existing) {
          return prev.map(p => p.id === data.id ? { ...p, status: data.status } : p);
        }
        return [...prev, { id: data.id, name: data.name || 'Processing...', status: data.status || 'scraping' }];
      });
    }
    if (data.type === 'person_ready') {
      setProcessingPeople(prev => prev.map(p => 
        p.id === data.id ? { ...p, status: 'ready', name: data.person?.analysis?.name || p.name } : p
      ));
      setTimeout(() => {
        setProcessingPeople(prev => prev.filter(p => p.id !== data.id));
      }, 3000);
    }
    if (data.type === 'demo_progress') {
      setProcessingPeople(prev => {
        const existing = prev.find(p => p.id === data.id);
        if (!existing) {
          return [...prev, { id: data.id, name: data.name, status: 'scraping' }];
        }
        return prev;
      });
    }
  });

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!linkedin || !instagram) return;
    
    setLoading(true);
    try {
      const result = await api.post('/api/people', {
        linkedin_url: linkedin,
        instagram_url: instagram,
      });
      if (result.success) {
        setLinkedin('');
        setInstagram('');
        setProcessingPeople(prev => [...prev, { id: result.data.id, name: 'Analyzing...', status: 'scraping' }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await api.post('/api/load-demo', {});
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setDemoLoading(false), 3000);
  };

  const statusColors = {
    scraping: 'var(--accent-amber)',
    scraping_linkedin: 'var(--accent-amber)',
    analyzing: 'var(--accent-cyan)',
    ready: 'var(--accent-green)',
    error: 'var(--accent-red)',
  };

  const statusLabels = {
    scraping: 'Scraping profiles...',
    scraping_linkedin: 'Reading LinkedIn...',
    analyzing: 'AI analyzing...',
    ready: 'Profile ready! ✨',
    error: 'Error',
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        padding: '60px 40px 40px',
        background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 700 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'heartbeat 2s ease-in-out infinite' }}>❤️</div>
          <h1 style={{ marginBottom: 12 }}>
            <span className="gradient-text">Agents Date.</span><br />
            You Watch.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.7 }}>
            Add any person's LinkedIn and Instagram. Our AI reads them, builds their agent, 
            and sends it dating on their behalf. Watch the sparks fly — or not.
          </p>
          
          {health && (
            <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="badge badge-green">
                <span className="status-dot ready" style={{ width: 6, height: 6 }} />
                {health.people_count} people loaded
              </div>
              <div className="badge badge-purple">
                {health.conversations_count} dates run
              </div>
              <div className={`badge ${health.gemini_configured ? 'badge-green' : 'badge-red'}`}>
                {health.gemini_configured ? '✓ Gemini AI ready' : '⚠ Add Gemini API key'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Add Person Form */}
        <div>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 6 }}>Add a Person</h3>
              <p className="text-sm text-secondary">Paste their public LinkedIn and Instagram URLs</p>
            </div>
            
            <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">LinkedIn Profile URL</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Instagram Profile URL</label>
                <input
                  className="input"
                  type="text"
                  placeholder="https://instagram.com/username or @username"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  required
                />
              </div>
              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={loading || !linkedin || !instagram}
                style={{ marginTop: 8 }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>❤️</span>
                    Create Agent Profile
                  </>
                )}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div className="card" style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 16 }}>How It Works</h4>
            {[
              { step: '1', icon: '🔍', title: 'Scan', desc: 'We read their public LinkedIn + Instagram' },
              { step: '2', icon: '🧠', title: 'Analyze', desc: 'Gemini AI extracts personality, values, needs' },
              { step: '3', icon: '💬', title: 'Date', desc: 'Agents chat with each other on their behalf' },
              { step: '4', icon: '🏆', title: 'Rank', desc: 'Get ranked compatibility scores for everyone' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Demo loader */}
          <div className="card" style={{
            padding: 28,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
            borderColor: 'rgba(139,92,246,0.3)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🚀</div>
            <h3 style={{ marginBottom: 8 }}>Load 25 Demo People</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: 20, lineHeight: 1.6 }}>
              Instantly load 25 real tech founders, creators, and entrepreneurs — each with their 
              LinkedIn + Instagram profiles. Watch agents analyze and date in real-time.
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={handleLoadDemo}
              disabled={demoLoading}
            >
              {demoLoading ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                  Loading 25 people...
                </>
              ) : (
                '✨ Load 25 Real People'
              )}
            </button>
          </div>

          {/* Processing queue */}
          {processingPeople.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 16 }}>Processing Queue</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {processingPeople.slice(-8).map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div className="status-dot" style={{
                      background: statusColors[p.status] || 'var(--accent-purple)',
                      animation: p.status !== 'ready' ? 'pulse 1s infinite' : 'none',
                    }} />
                    <span style={{ fontSize: '0.875rem', flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </div>
                ))}
              </div>
              {processingPeople.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm w-full"
                  style={{ marginTop: 12 }}
                  onClick={() => navigate('/profiles')}
                >
                  View All Profiles →
                </button>
              )}
            </div>
          )}

          {/* Quick actions */}
          {health && health.people_count >= 2 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 12 }}>Quick Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/profiles')}>
                  👥 View {health.people_count} Profiles
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/dating')}>
                  💬 Start Dating Session
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/rankings')}>
                  🏆 View Rankings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
