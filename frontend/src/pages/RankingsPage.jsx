// pages/RankingsPage.jsx — Premium rankings with compatibility matrix
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const hue = ((name || '') + '').charCodeAt(0) * 37 % 360;

  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,65%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
        fontFamily: 'Space Grotesk, sans-serif',
      }}>{initials}</div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  );
}

function ScoreCircle({ score, size = 52 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(score / 100, 1) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const bg = score >= 80 ? 'rgba(16,185,129,0.1)' : score >= 60 ? 'rgba(139,92,246,0.1)' : score >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, background: bg, borderRadius: '50%' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: size * 0.24, color, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: size * 0.16, color: 'var(--text-muted)', lineHeight: 1 }}>%</span>
      </div>
    </div>
  );
}

function GradeBadge({ grade }) {
  const map = {
    'S': { bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.5)', color: '#f472b6' },
    'A': { bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.5)', color: '#a78bfa' },
    'B': { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.5)', color: '#34d399' },
    'C': { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', color: '#fbbf24' },
    'D': { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', color: '#f87171' },
  };
  const s = map[grade] || map['C'];
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: s.bg, border: `1.5px solid ${s.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: s.color,
      flexShrink: 0,
    }}>{grade || 'C'}</div>
  );
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingsPage() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [view, setView] = useState('grid'); // grid | detail | matrix

  const loadData = useCallback(async () => {
    const [rankRes, peopleRes] = await Promise.allSettled([
      api.get('/api/rankings'),
      api.get('/api/people'),
    ]);
    if (rankRes.value?.success) setRankings(rankRes.value.data);
    if (peopleRes.value?.success) setPeople(peopleRes.value.data.filter(p => p.analysis?.name));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useSSE(useCallback((data) => {
    if (data.type === 'batch_dating_complete') {
      setTimeout(loadData, 2000);
    }
  }, [loadData]));

  const handleGenerate = async () => {
    setGenerating(true);
    await api.post('/api/generate-rankings', {});
    await loadData();
    setGenerating(false);
  };

  const getPerson = (id) => people.find(p => p.id === id);

  const selectedRanking = selectedPerson
    ? rankings.find(r => r.person_id === selectedPerson)
    : null;
  const selectedPersonData = selectedPerson ? getPerson(selectedPerson) : null;

  // Build lookup map for matrix view
  const scoreMap = {};
  rankings.forEach(r => {
    (r.ranked_matches || []).forEach(m => {
      scoreMap[`${r.person_id}:${m.person_id}`] = m.score;
    });
  });

  const rankedPeople = rankings.map(r => getPerson(r.person_id)).filter(Boolean);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 220, opacity: 0, animation: `fadeIn 0.3s ease ${i * 60}ms forwards` }} />
          ))}
        </div>
      </div>
    );
  }

  const totalPairings = rankings.reduce((acc, r) => acc + (r.ranked_matches?.length || 0), 0);
  const avgScore = totalPairings > 0
    ? Math.round(rankings.reduce((acc, r) => acc + r.ranked_matches?.reduce((s, m) => s + m.score, 0), 0) / totalPairings)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="page-title">
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <h2>Match Rankings</h2>
            </div>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
              AI-ranked compatibility across 4 dimensions: chemistry, values, communication, lifestyle
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <div className="loading-spinner" style={{ width: 13, height: 13 }} /> : '↻'}
              {generating ? 'Generating...' : 'Generate Rankings'}
            </button>
          </div>
        </div>

        {rankings.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {/* Summary stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div className="badge badge-green">{rankings.length} people ranked</div>
              <div className="badge badge-purple">{totalPairings} pairings scored</div>
              {avgScore > 0 && <div className="badge badge-amber">Avg match: {avgScore}%</div>}
            </div>

            {/* View tabs */}
            <div className="tab-list" style={{ maxWidth: 360 }}>
              {[['grid', '📊 Grid View'], ['detail', '📋 Detail View'], ['matrix', '🗃️ Matrix']].map(([v, l]) => (
                <button key={v} className={`tab-item ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}>{l}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '32px 40px' }}>
        {rankings.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }} className="animate-fade-in">
            <div style={{ fontSize: '5rem', marginBottom: 20 }} className="animate-float">🤔</div>
            <h3 style={{ marginBottom: 12 }}>No Rankings Yet</h3>
            <p className="text-secondary" style={{ marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Run dating sessions first, then generate rankings to see who matches best with whom.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/dating')}>
                💬 Go to Dating Arena
              </button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : '🏆 Generate Rankings'}
              </button>
            </div>
          </div>

        ) : view === 'matrix' ? (
          /* ── Matrix view ── */
          <div className="animate-fade-in">
            <div style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 600 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Compatibility Matrix</strong> — each cell shows the compatibility score between two people. Greener = better match.
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
              <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 140, padding: '8px 10px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                      Person ↓ / Match →
                    </th>
                    {rankedPeople.map(p => (
                      <th key={p.id} style={{ padding: '6px 4px', minWidth: 68, textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <AvatarImg src={p.avatar_url} name={p.analysis?.name} size={26} />
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.analysis?.name?.split(' ')[0]}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankedPeople.map((rowPerson, ri) => (
                    <tr key={rowPerson.id}>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <AvatarImg src={rowPerson.avatar_url} name={rowPerson.analysis?.name} size={24} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                            {rowPerson.analysis?.name?.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      {rankedPeople.map((colPerson, ci) => {
                        if (rowPerson.id === colPerson.id) {
                          return (
                            <td key={colPerson.id} style={{ padding: 4, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ width: 60, height: 32, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-ultra-muted)', fontSize: '1rem' }}>
                                —
                              </div>
                            </td>
                          );
                        }
                        const score = scoreMap[`${rowPerson.id}:${colPerson.id}`] || scoreMap[`${colPerson.id}:${rowPerson.id}`] || null;
                        const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : score ? '#ef4444' : null;
                        const bg = score >= 80 ? 'rgba(16,185,129,0.18)' : score >= 60 ? 'rgba(139,92,246,0.18)' : score >= 40 ? 'rgba(245,158,11,0.14)' : score ? 'rgba(239,68,68,0.12)' : 'transparent';
                        return (
                          <td key={colPerson.id}
                            style={{ padding: 4, textAlign: 'center', borderBottom: '1px solid var(--border)', cursor: score ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (score) {
                                setSelectedPerson(rowPerson.id);
                                setView('detail');
                              }
                            }}
                            title={score ? `${rowPerson.analysis?.name} ↔ ${colPerson.analysis?.name}: ${Math.round(score)}%` : 'Not yet dated'}
                          >
                            <div style={{
                              width: 60, height: 32, margin: '0 auto',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: bg, borderRadius: 6, transition: 'all 0.15s',
                              color: color || 'var(--text-ultra-muted)',
                              fontWeight: score ? 800 : 400,
                              fontSize: score ? '0.78rem' : '0.7rem',
                              fontFamily: 'Space Grotesk, sans-serif',
                            }}>
                              {score ? `${Math.round(score)}%` : '—'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score scale:</span>
              {[['80%+', '#10b981', 'rgba(16,185,129,0.18)'], ['60–79%', '#8b5cf6', 'rgba(139,92,246,0.18)'], ['40–59%', '#f59e0b', 'rgba(245,158,11,0.14)'], ['<40%', '#ef4444', 'rgba(239,68,68,0.12)']].map(([label, color, bg]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 18, borderRadius: 4, background: bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color, fontWeight: 700 }}>■</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        ) : view === 'grid' ? (
          /* ── Grid view ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {rankings.map((ranking, idx) => {
              const person = getPerson(ranking.person_id);
              if (!person) return null;
              const a = person.analysis || {};
              const topMatches = (ranking.ranked_matches || []).slice(0, 3);
              const topScore = topMatches[0]?.score || 0;

              return (
                <div key={ranking.person_id}
                  className="glass-card animate-fade-in"
                  style={{
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden', animationDelay: `${idx * 40}ms`, opacity: 0,
                  }}
                  onClick={() => { setSelectedPerson(ranking.person_id); setView('detail'); }}
                >
                  {/* Person header */}
                  <div style={{
                    padding: '18px 20px 14px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.06))',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                    <AvatarImg src={person.avatar_url} name={a.name} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.professional_domain}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ranking.ranked_matches?.length || 0} matches scored</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: topScore >= 80 ? 'var(--accent-green)' : 'var(--accent-purple)' }}>
                        {Math.round(topScore)}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>best match</div>
                    </div>
                  </div>

                  {/* Top 3 matches */}
                  <div style={{ padding: '14px 16px' }}>
                    {topMatches.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No matches yet</div>
                    ) : (
                      topMatches.map((match, j) => (
                        <div key={j} style={{
                          display: 'flex', gap: 10, marginBottom: j < topMatches.length - 1 ? 8 : 0,
                          padding: '10px 12px',
                          background: j === 0 ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))' : 'rgba(255,255,255,0.025)',
                          borderRadius: 10,
                          border: `1px solid ${j === 0 ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
                          alignItems: 'center', transition: 'all 0.2s',
                        }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{MEDALS[j] || `#${j + 1}`}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.person_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {match.verdict}
                            </div>
                          </div>
                          <ScoreCircle score={Math.round(match.score)} size={44} />
                        </div>
                      ))
                    )}

                    {ranking.ranked_matches?.length > 3 && (
                      <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.78rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                        +{ranking.ranked_matches.length - 3} more matches →
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          /* ── Detail view ── */
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
            {/* Person list */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Select a person
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rankings.map(r => {
                  const p = getPerson(r.person_id);
                  if (!p) return null;
                  const topScore = r.ranked_matches?.[0]?.score || 0;
                  const isSelected = selectedPerson === r.person_id;
                  return (
                    <div key={r.person_id}
                      onClick={() => setSelectedPerson(r.person_id)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: isSelected ? 'rgba(139,92,246,0.14)' : 'var(--bg-card)',
                        border: `1px solid ${isSelected ? 'rgba(139,92,246,0.35)' : 'var(--border)'}`,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 16px rgba(139,92,246,0.2)' : 'none',
                      }}>
                      <AvatarImg src={p.avatar_url} name={p.analysis?.name} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--accent-purple-light)' : 'var(--text-primary)' }}>
                          {p.analysis?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Best: {Math.round(topScore)}%
                        </div>
                      </div>
                      {isSelected && <span style={{ color: 'var(--accent-purple)', fontSize: '0.8rem' }}>→</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rankings detail */}
            <div>
              {!selectedPerson ? (
                <div style={{ textAlign: 'center', paddingTop: 80 }} className="animate-fade-in">
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>👈</div>
                  <p className="text-secondary">Select a person to see their full compatibility rankings</p>
                </div>
              ) : !selectedRanking ? (
                <div style={{ textAlign: 'center', paddingTop: 80 }}>
                  <p className="text-secondary">No rankings for this person yet</p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {/* Header */}
                  <div style={{
                    padding: 22, marginBottom: 20, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
                    border: '1px solid rgba(139,92,246,0.22)',
                    display: 'flex', gap: 16, alignItems: 'center',
                  }}>
                    <AvatarImg src={selectedPersonData?.avatar_url} name={selectedPersonData?.analysis?.name} size={60} />
                    <div>
                      <h3 style={{ marginBottom: 4, fontSize: '1.15rem' }}>{selectedPersonData?.analysis?.name}'s Matches</h3>
                      <p className="text-secondary text-sm">
                        Ranked by AI compatibility — chemistry, values, communication & lifestyle
                      </p>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedPersonData?.analysis?.vibe && <div className="badge badge-purple">✨ {selectedPersonData.analysis.vibe}</div>}
                        {selectedPersonData?.analysis?.love_language && <div className="badge badge-pink">💕 {selectedPersonData.analysis.love_language}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Match list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(selectedRanking.ranked_matches || []).map((match, i) => {
                      const matchPerson = getPerson(match.person_id);
                      const score = Math.round(match.score);

                      return (
                        <div key={i}
                          style={{
                            display: 'flex', gap: 14, padding: 18, borderRadius: 14,
                            background: i === 0
                              ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.07))'
                              : 'var(--bg-card)',
                            border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.28)' : 'var(--border)'}`,
                            cursor: 'pointer', transition: 'all 0.22s ease',
                          }}
                          onClick={() => navigate(`/profiles/${match.person_id}`)}
                        >
                          {/* Rank */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            {i < 3
                              ? <div style={{ fontSize: '1.3rem' }}>{MEDALS[i]}</div>
                              : <div className="rank-number">#{i + 1}</div>
                            }
                          </div>

                          {/* Avatar */}
                          <AvatarImg src={matchPerson?.avatar_url} name={match.person_name} size={46} />

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{match.person_name}</span>
                              {match.grade && <GradeBadge grade={match.grade} />}
                              {match.verdict && <span className="badge badge-purple">{match.verdict}</span>}
                              {match.long_term_potential === 'high' && <span className="badge badge-green">♾️ High potential</span>}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                              {match.reason}
                            </p>

                            {match.first_date_idea && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: 10 }}>
                                📍 First date: {match.first_date_idea}
                              </div>
                            )}

                            {/* Sub-scores */}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                              {[
                                ['💕 Chemistry', match.chemistry_score, '#ec4899'],
                                ['⭐ Values', match.values_alignment, '#8b5cf6'],
                                ['💬 Comms', match.communication_fit, '#06b6d4'],
                              ].filter(([, v]) => v).map(([label, val, color]) => (
                                <div key={label} style={{
                                  padding: '3px 10px', borderRadius: 20,
                                  background: `${color}18`,
                                  border: `1px solid ${color}35`,
                                  fontSize: '0.7rem', color,
                                  fontWeight: 600,
                                }}>
                                  {label}: {val}%
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Score ring */}
                          <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                            <ScoreCircle score={score} size={54} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
