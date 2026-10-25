// pages/ProfilesPage.jsx — Gallery of all profiles
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 48 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  
  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src} alt={name}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }}
    />
  );
}

function ScoreRing({ score, size = 70 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';
  
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: size * 0.22, color }}>{score}</span>
        <span style={{ fontSize: size * 0.14, color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
}

function ProfileCard({ person, onDelete }) {
  const navigate = useNavigate();
  const a = person.analysis || {};
  const isReady = a.name || a.tagline;
  const isProcessing = !isReady;

  return (
    <div className="profile-card animate-fade-in" onClick={() => isReady && navigate(`/profiles/${person.id}`)}>
      <div className="profile-card-header">
        <AvatarImg src={person.avatar_url} name={person.name || a.name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
            {a.name || person.name || 'Analyzing...'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {a.professional_domain || a.personality_type || ''}
          </div>
          {a.emoji_personality && (
            <div style={{ fontSize: '1.1rem' }}>{a.emoji_personality}</div>
          )}
        </div>
        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="loading-spinner" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Analyzing</span>
          </div>
        ) : (
          <div className="badge badge-green">Ready</div>
        )}
      </div>
      
      <div className="profile-card-body">
        {isProcessing ? (
          <div>
            <div className="skeleton" style={{ height: 14, marginBottom: 8, width: '80%' }} />
            <div className="skeleton" style={{ height: 14, marginBottom: 8, width: '60%' }} />
            <div className="skeleton" style={{ height: 14, width: '70%' }} />
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {a.tagline || a.dating_bio}
            </p>
            
            <div style={{ marginBottom: 12 }}>
              <div className="tag-list">
                {(a.hobbies || []).slice(0, 3).map((h, i) => (
                  <span key={i} className="tag">{h}</span>
                ))}
                {a.vibe && <span className="tag" style={{ borderColor: 'rgba(139,92,246,0.3)', color: 'var(--accent-purple)' }}>{a.vibe}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {a.love_language && (
                  <div className="badge badge-pink">💕 {a.love_language}</div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); onDelete(person.id); }}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
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

  const filtered = people
    .filter(p => {
      if (!search) return true;
      const name = p.analysis?.name || p.name || '';
      const domain = p.analysis?.professional_domain || '';
      return name.toLowerCase().includes(search.toLowerCase()) || 
             domain.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.created_at || 0) - (a.created_at || 0);
      if (sortBy === 'name') return (a.analysis?.name || a.name || '').localeCompare(b.analysis?.name || b.name || '');
      return 0;
    });

  const readyCount = people.filter(p => p.analysis?.name).length;
  const processingCount = people.filter(p => !p.analysis?.name).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <h2>Agent Profiles</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          <div className="badge badge-green">{readyCount} ready</div>
          {processingCount > 0 && <div className="badge badge-amber">{processingCount} analyzing</div>}
          <input
            className="input"
            placeholder="Search profiles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <select
            className="input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ maxWidth: 140 }}
          >
            <option value="newest">Newest first</option>
            <option value="name">By name</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            + Add Person
          </button>
        </div>
      </div>

      <div style={{ padding: 40 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 200 }}>
                <div className="skeleton" style={{ height: '100%', borderRadius: 12 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>💭</div>
            <h3 style={{ marginBottom: 8 }}>No profiles yet</h3>
            <p className="text-secondary" style={{ marginBottom: 24 }}>Add people from the home page or load the demo</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              + Add Your First Person
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(person => (
              <ProfileCard key={person.id} person={person} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
