// pages/HomePage.jsx — Stunning landing with stats + agent creation
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

// Animated counter hook
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const steps = 40;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({ icon, value, label, color, delay = 0 }) {
  const animated = useCounter(value);
  return (
    <div className="stat-card animate-fade-in" style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="stat-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{animated}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const FEATURE_PILLS = [
  '🔍 LinkedIn Scraping',
  '📸 Instagram Analysis',
  '🧠 Gemini 2.5 Flash',
  '💬 Multi-Turn Dating',
  '📊 4D Compatibility',
  '⚡ Real-Time SSE',
];

export default function HomePage({ onCountChange }) {
  const navigate = useNavigate();
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [processingPeople, setProcessingPeople] = useState([]);
  const [health, setHealth] = useState(null);
  const [addedName, setAddedName] = useState(null);

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
      const name = data.person?.analysis?.name || 'Agent';
      setAddedName(name);
      setProcessingPeople(prev => prev.map(p =>
        p.id === data.id ? { ...p, status: 'ready', name } : p
      ));
      setTimeout(() => {
        setProcessingPeople(prev => prev.filter(p => p.id !== data.id));
        setAddedName(null);
      }, 4000);
    }
    if (data.type === 'demo_progress') {
      setProcessingPeople(prev => {
        const existing = prev.find(p => p.id === data.id);
        if (!existing) return [...prev, { id: data.id, name: data.name, status: 'scraping' }];
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

  const statusConfig = {
    scraping: { color: 'var(--accent-amber)', label: 'Scraping profiles...', pulse: true },
    scraping_linkedin: { color: 'var(--accent-amber)', label: '🔗 Reading LinkedIn...', pulse: true },
    analyzing: { color: 'var(--accent-cyan)', label: '🧠 AI analyzing...', pulse: true },
    ready: { color: 'var(--accent-green)', label: '✨ Ready!', pulse: false },
    error: { color: 'var(--accent-red)', label: '❌ Error', pulse: false },
  };

  const steps = [
    { icon: '🔍', title: 'Scrape', desc: 'LinkedIn career data + Instagram lifestyle signals' },
    { icon: '🧠', title: 'Synthesize', desc: 'Gemini builds a deep psychological persona' },
    { icon: '💬', title: 'Date', desc: 'Agents hold real multi-turn conversations' },
    { icon: '🏆', title: 'Rank', desc: 'Get 4-dimensional compatibility scores' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div className="hero-section">
        <div style={{ maxWidth: 780 }}>
          {/* Feature pills row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {FEATURE_PILLS.map((f, i) => (
              <div key={i} className="feature-pill animate-fade-in" style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}>
                {f}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '3.5rem', marginBottom: 18, display: 'inline-block' }}
            className="animate-heartbeat">❤️</div>

          <h1 style={{ marginBottom: 20 }}>
            <span className="gradient-text">Agents Date.</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>You Watch.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.75, marginBottom: 28 }}>
            Paste LinkedIn + Instagram URLs. We scrape, analyze, build an <strong style={{ color: 'var(--text-primary)' }}>autonomous AI agent</strong> for each person, then let agents date each other — revealing true compatibility.
          </p>

          {/* Stat pills from health */}
          {health && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <div className="badge badge-green animate-fade-in" style={{ padding: '6px 14px', animationDelay: '400ms', opacity: 0 }}>
                <span className="status-dot ready" style={{ width: 6, height: 6 }} />
                {health.people_count} agents loaded
              </div>
              <div className="badge badge-purple animate-fade-in" style={{ padding: '6px 14px', animationDelay: '500ms', opacity: 0 }}>
                💕 {health.conversations_count} dates completed
              </div>
              <div className={`badge animate-fade-in ${health.gemini_configured ? 'badge-cyan' : 'badge-red'}`}
                style={{ padding: '6px 14px', animationDelay: '600ms', opacity: 0 }}>
                {health.gemini_configured ? '✓ Gemini 2.5 Flash ready' : '⚠ Missing Gemini API key'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {health && (
        <div style={{ padding: '28px 44px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard icon="👥" value={health.people_count} label="Agents Created" color="var(--accent-purple)" delay={0} />
          <StatCard icon="💬" value={health.conversations_count} label="Dates Simulated" color="var(--accent-pink)" delay={100} />
          <StatCard icon="🧠" value={25} label="Real Public Figures" color="var(--accent-cyan)" delay={200} />
          <StatCard icon="⚡" value={4} label="Compatibility Dimensions" color="var(--accent-amber)" delay={300} />
        </div>
      )}

      {/* ── Main columns ── */}
      <div style={{ padding: '32px 44px 44px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ── Left: Add person + How it works ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Add person form */}
          <div className="premium-card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, background: 'var(--gradient-love)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>➕</div>
                <h3 style={{ fontSize: '1.1rem' }}>Add a Person</h3>
              </div>
              <p className="text-sm text-secondary">Their AI agent will be ready in ~30 seconds</p>
            </div>

            {addedName && (
              <div className="animate-fade-in" style={{
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: '1.1rem' }}>✅</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  {addedName}'s agent is ready!
                </span>
              </div>
            )}

            <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">LinkedIn Profile URL</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700,
                  }}>in</span>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    required
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Instagram Profile URL</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '1rem',
                  }}>📸</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="https://instagram.com/username"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
              <div className="glow-wrap" style={{ width: '100%' }}>
                <button
                  className="btn btn-primary btn-lg w-full"
                  type="submit"
                  disabled={loading || !linkedin || !instagram}
                  style={{ marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                      Analyzing profiles...
                    </>
                  ) : (
                    <>
                      <span>❤️</span>
                      Create Agent Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* How it works */}
          <div className="card">
            <h4 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔬</span> How It Works
            </h4>
            <div className="step-list">
              {steps.map((s, i) => (
                <div key={i} className="step-item animate-fade-in" style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}>
                  <div className="step-number">{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Demo + Queue + Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Demo loader */}
          <div className="premium-card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 140, height: 140,
              background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20, width: 100, height: 100,
              background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }} className="animate-float">🚀</div>
              <h3 style={{ marginBottom: 8 }}>Load 25 Real Public Figures</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 8, lineHeight: 1.65 }}>
                Instantly load 25 verified tech founders, creators, and entrepreneurs.
                Includes <strong style={{ color: 'var(--text-primary)' }}>Sam Altman, Sundar Pichai, Naval Ravikant, Lex Fridman</strong> and more.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {['Sahil Bloom', 'Sam Altman', 'Lex Fridman', 'Tim Ferriss', '+21 more'].map(n => (
                  <span key={n} className="badge badge-white">{n}</span>
                ))}
              </div>
              <div className="glow-wrap" style={{ width: '100%' }}>
                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={handleLoadDemo}
                  disabled={demoLoading}
                >
                  {demoLoading ? (
                    <>
                      <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                      Loading 25 agents...
                    </>
                  ) : (
                    <>✨ Load 25 Real People</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Processing queue */}
          {processingPeople.length > 0 && (
            <div className="card animate-fade-in">
              <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                  Processing Queue
                </span>
                <span className="badge badge-amber">{processingPeople.length} in queue</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {processingPeople.slice(-8).map(p => {
                  const cfg = statusConfig[p.status] || { color: 'var(--accent-purple)', label: p.status, pulse: true };
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px',
                      background: p.status === 'ready' ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
                      borderRadius: 9,
                      border: `1px solid ${p.status === 'ready' ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                      transition: 'all 0.3s ease',
                    }}>
                      <div className="status-dot" style={{
                        background: cfg.color,
                        animation: cfg.pulse ? 'pulse 1.2s infinite' : 'none',
                        boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}` : 'none',
                      }} />
                      <span style={{ fontSize: '0.86rem', flex: 1, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 600 }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn btn-ghost btn-sm w-full"
                style={{ marginTop: 12 }}
                onClick={() => navigate('/profiles')}
              >
                View All Profiles →
              </button>
            </div>
          )}

          {/* Quick actions */}
          {health && health.people_count >= 2 && (
            <div className="card animate-fade-in">
              <h4 style={{ marginBottom: 14 }}>Quick Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/profiles')}
                  style={{ justifyContent: 'flex-start', gap: 12, padding: '12px 16px' }}>
                  <span style={{ fontSize: '1.1rem' }}>👥</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>View Profiles</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{health.people_count} agents ready</div>
                  </div>
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/dating')}
                  style={{ justifyContent: 'flex-start', gap: 12, padding: '12px 16px' }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Start Dating Session</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Watch AI agents date live</div>
                  </div>
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/rankings')}
                  style={{ justifyContent: 'flex-start', gap: 12, padding: '12px 16px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏆</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>View Rankings</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{health.conversations_count} matches scored</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Tech stack */}
          <div className="card" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}>
            <h4 style={{ marginBottom: 14, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Tech Stack
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { name: 'Google Gemini 2.5 Flash', icon: '🤖', color: '#4285F4' },
                { name: 'React 19 + Vite', icon: '⚛️', color: '#61DAFB' },
                { name: 'Server-Sent Events', icon: '⚡', color: '#F59E0B' },
                { name: 'SQLite + Express', icon: '🗄️', color: '#003B57' },
                { name: 'LinkedIn Scraper', icon: '🔗', color: '#0077B5' },
                { name: 'Instagram API', icon: '📸', color: '#E1306C' },
              ].map(t => (
                <div key={t.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 8,
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.9rem' }}>{t.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
