// pages/ProfilesPage.jsx — Premium gallery of all agent profiles
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 56 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  if (!src || err) {
    // Deterministic gradient from name
    const hue = (name || '').charCodeAt(0) * 37 % 360;
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,65%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
        boxShadow: `0 4px 14px hsla(${hue},70%,45%,0.4)`,
        border: '2px solid rgba(255,255,255,0.1)',
        fontFamily: 'Space Grotesk, Inter, sans-serif',
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src} alt={name}
      onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
        border: '2px solid rgba(139,92,246,0.3)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      }}
    />
  );
}

function AgentReadyBadge({ isReady }) {
  if (!isReady) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div className="loading-spinner" style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>ANALYZING</span>
    </div>
  );
  return (
    <div style={{
      background: 'rgba(16,185,129,0.12)',
      border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: 8, padding: '4px 10px',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <div className="status-dot ready" style={{ width: 6, height: 6 }} />
      <span style={{ fontSize: '0.68rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ready</span>
    </div>
  );
}

function ProfileCard({ person, onDelete, index }) {
  const navigate = useNavigate();
  const a = person.analysis || {};
  const isReady = !!(a.name || a.tagline);

  const hue = ((a.name || person.name || '') + '').charCodeAt(0) * 37 % 360;

  return (
    <div
      className="profile-card animate-fade-in"
      style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
      onClick={() => isReady && navigate(`/profiles/${person.id}`)}
    >
      {/* Gradient accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,65%))`,
      }} />

      <div className="profile-card-header">
        <AvatarImg src={person.avatar_url} name={a.name || person.name} size={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.name || person.name || 'Analyzing...'}
          </div>
          <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.professional_domain || a.personality_type || ''}
          </div>
          {a.emoji_personality && (
            <div style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>{a.emoji_personality}</div>
          )}
        </div>
        <AgentReadyBadge isReady={isReady} />
      </div>

      <div className="profile-card-body">
        {!isReady ? (
          <div>
            <div className="skeleton" style={{ height: 12, marginBottom: 8, width: '80%' }} />
            <div className="skeleton" style={{ height: 12, marginBottom: 8, width: '65%' }} />
            <div className="skeleton" style={{ height: 12, width: '72%' }} />
          </div>
        ) : (
          <>
            {/* Tagline */}
            <p style={{
              fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12,
              lineHeight: 1.55, fontStyle: 'italic',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              "{a.tagline || a.dating_bio}"
            </p>

            {/* Tags */}
            <div className="tag-list" style={{ marginBottom: 12 }}>
              {(a.hobbies || []).slice(0, 3).map((h, i) => (
                <span key={i} className="tag">{h}</span>
              ))}
              {a.vibe && <span className="tag" style={{ borderColor: 'rgba(139,92,246,0.35)', color: 'var(--accent-purple-light)' }}>✨ {a.vibe}</span>}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {a.love_language && (
                  <div className="badge badge-pink">💕 {a.love_language}</div>
                )}
                {a.personality_type && (
                  <div className="badge badge-purple" style={{ fontSize: '0.6rem' }}>{a.personality_type}</div>
                )}
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => { e.stopPropagation(); onDelete(person.id); }}
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 6 }}
                title="Remove profile"
              >
                ✕
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  const loadPeople = useCallback(async () => {
    const result = await api.get('/api/people');
    if (result.success) setPeople(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  useSSE(useCallback((data) => {
    if (data.type === 'person_ready') {
      setPeople(prev => {
        const exists = prev.find(p => p.id === data.person?.id);
        if (exists) return prev.map(p => p.id === data.person?.id ? data.person : p);
        if (data.person) return [data.person, ...prev];
        return prev;
      });
    }
    if (data.type === 'person_update') {
      loadPeople();
    }
  }, [loadPeople]));

  const handleDelete = async (id) => {
    await api.delete(`/api/people/${id}`);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const readyCount = people.filter(p => p.analysis?.name).length;
  const processingCount = people.filter(p => !p.analysis?.name).length;

  const filtered = people
    .filter(p => {
      if (filterStatus === 'ready' && !p.analysis?.name) return false;
      if (filterStatus === 'processing' && p.analysis?.name) return false;
      if (!search) return true;
      const name = p.analysis?.name || p.name || '';
      const domain = p.analysis?.professional_domain || '';
      const hobbies = (p.analysis?.hobbies || []).join(' ');
      const q = search.toLowerCase();
      return name.toLowerCase().includes(q) || domain.toLowerCase().includes(q) || hobbies.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.created_at || 0) - (a.created_at || 0);
      if (sortBy === 'name') return (a.analysis?.name || a.name || '').localeCompare(b.analysis?.name || b.name || '');
      if (sortBy === 'ready') return (b.analysis?.name ? 1 : 0) - (a.analysis?.name ? 1 : 0);
      return 0;
    });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="page-title">
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <h2>Agent Profiles</h2>
            </div>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
              Every profile is an autonomous AI agent built from real public data
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            + Add Person
          </button>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
          <div className="badge badge-green">{readyCount} ready</div>
          {processingCount > 0 && (
            <div className="badge badge-amber">
              <div className="status-dot processing" style={{ width: 6, height: 6 }} />
              {processingCount} analyzing
            </div>
          )}

          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔍</span>
            <input
              className="input"
              placeholder="Search by name, domain, hobbies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <div className="tab-list" style={{ flexShrink: 0 }}>
            {[['all', 'All'], ['ready', 'Ready'], ['processing', 'Analyzing']].map(([v, l]) => (
              <button key={v} className={`tab-item ${filterStatus === v ? 'active' : ''}`}
                onClick={() => setFilterStatus(v)}>{l}</button>
            ))}
          </div>

          <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ maxWidth: 140 }}>
            <option value="newest">Newest first</option>
            <option value="name">By name</option>
            <option value="ready">Ready first</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '32px 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 220, padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 3 }} className="skeleton" />
                <div className="skeleton" style={{ height: '100%', borderRadius: 0 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }} className="animate-fade-in">
            <div style={{ fontSize: '4rem', marginBottom: 16 }} className="animate-float">
              {people.length === 0 ? '💭' : '🔍'}
            </div>
            <h3 style={{ marginBottom: 8 }}>
              {people.length === 0 ? 'No profiles yet' : 'No results found'}
            </h3>
            <p className="text-secondary" style={{ marginBottom: 24 }}>
              {people.length === 0
                ? 'Add people from the home page or load the 25 demo profiles'
                : `No profiles match "${search}"`}
            </p>
            {people.length === 0 && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate('/')}>+ Add Your First Person</button>
              </div>
            )}
            {people.length > 0 && search && (
              <button className="btn btn-ghost" onClick={() => setSearch('')}>Clear search</button>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {filtered.length} of {people.length} agents
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map((person, i) => (
                <ProfileCard key={person.id} person={person} onDelete={handleDelete} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
