// pages/RankingsPage.jsx — Match rankings for all people
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useSSE } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
      }}>{initials}</div>
    );
  }
  return <img src={src} alt={name} onError={() => setErr(true)}
    style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-purple)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const bg = score >= 80 ? 'rgba(16,185,129,0.12)' : score >= 60 ? 'rgba(139,92,246,0.12)' : score >= 40 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <div style={{
      minWidth: 52, height: 52, borderRadius: '50%',
      background: bg, border: `2px solid ${color}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ fontWeight: 800, fontSize: '0.9rem', color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>/ 100</div>
    </div>
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
  const [view, setView] = useState('grid'); // grid | detail

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

  // Build a matrix view of top matches
  const rankingsByPerson = {};
  rankings.forEach(r => { rankingsByPerson[r.person_id] = r.ranked_matches || []; });

  const selectedRanking = selectedPerson 
    ? rankings.find(r => r.person_id === selectedPerson) 
    : null;
  const selectedPersonData = selectedPerson ? getPerson(selectedPerson) : null;

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 200 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <h2>Match Rankings</h2>
            </div>
            <p className="text-secondary" style={{ marginTop: 4 }}>
              Who fits each person best, ranked by AI compatibility scores
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView(view === 'grid' ? 'detail' : 'grid')}>
              {view === 'grid' ? '📋 Detail view' : '📊 Grid view'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : '↻'}
              Generate Rankings
            </button>
          </div>
        </div>

        {rankings.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <div className="badge badge-green">{rankings.length} people ranked</div>
            <div className="badge badge-purple">
              {rankings.reduce((acc, r) => acc + (r.ranked_matches?.length || 0), 0)} total pairings scored
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 40 }}>
        {rankings.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: '5rem', marginBottom: 20 }}>🤔</div>
            <h3 style={{ marginBottom: 12 }}>No rankings yet</h3>
            <p className="text-secondary" style={{ marginBottom: 24 }}>
              Run some dates first, then generate rankings to see who matches best with whom.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/dating')}>
                💬 Go to Dating
              </button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : '🏆 Generate Rankings'}
              </button>
            </div>
          </div>
        ) : view === 'grid' ? (
          /* Grid view: cards for each person */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {rankings.map((ranking) => {
              const person = getPerson(ranking.person_id);
              if (!person) return null;
              const a = person.analysis || {};
              const topMatches = (ranking.ranked_matches || []).slice(0, 3);
              
              return (
                <div key={ranking.person_id} className="glass-card"
                  style={{
                    cursor: 'pointer', transition: 'all 0.3s',
                    overflow: 'hidden',
                  }}
                  onClick={() => { setSelectedPerson(ranking.person_id); setView('detail'); }}
                >
                  {/* Person header */}
                  <div style={{
                    padding: '20px 20px 16px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.06))',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                    <AvatarImg src={person.avatar_url} name={a.name} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{a.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {a.professional_domain}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ranking.ranked_matches?.length || 0} matches scored
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem' }}>{a.emoji_personality?.split(' ')[0] || '❤️'}</div>
                  </div>
                  
                  {/* Top 3 matches */}
                  <div style={{ padding: 16 }}>
                    {topMatches.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No matches yet
                      </div>
                    ) : (
                      topMatches.map((match, j) => (
                        <div key={j} style={{
                          display: 'flex', gap: 10, marginBottom: j < topMatches.length - 1 ? 10 : 0,
                          padding: '10px 12px',
                          background: j === 0 ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))' : 'rgba(255,255,255,0.03)',
                          borderRadius: 10,
                          border: `1px solid ${j === 0 ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                          alignItems: 'center',
                        }}>
                          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{MEDALS[j] || `#${j+1}`}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{match.person_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {match.verdict}
                            </div>
                          </div>
                          <ScoreBadge score={Math.round(match.score)} />
                        </div>
                      ))
                    )}
                    
                    {ranking.ranked_matches?.length > 3 && (
                      <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                        +{ranking.ranked_matches.length - 3} more matches →
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Detail view: selected person's full ranking */
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
            {/* Person list */}
            <div>
              <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select a person
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rankings.map(r => {
                  const p = getPerson(r.person_id);
                  if (!p) return null;
                  const topScore = r.ranked_matches?.[0]?.score || 0;
                  return (
                    <div key={r.person_id}
                      onClick={() => setSelectedPerson(r.person_id)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: selectedPerson === r.person_id ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)',
                        border: `1px solid ${selectedPerson === r.person_id ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                        transition: 'all 0.2s',
                      }}>
                      <AvatarImg src={p.avatar_url} name={p.analysis?.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.analysis?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Best: {Math.round(topScore)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rankings detail */}
            <div>
              {!selectedPerson ? (
                <div style={{ textAlign: 'center', paddingTop: 80 }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>👈</div>
                  <p className="text-secondary">Select a person to see their full rankings</p>
                </div>
              ) : !selectedRanking ? (
                <div style={{ textAlign: 'center', paddingTop: 80 }}>
                  <p className="text-secondary">No rankings for this person yet</p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {/* Header */}
                  <div style={{
                    padding: 24, marginBottom: 20, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))',
                    border: '1px solid rgba(139,92,246,0.25)',
                    display: 'flex', gap: 16, alignItems: 'center',
                  }}>
                    <AvatarImg src={selectedPersonData?.avatar_url} name={selectedPersonData?.analysis?.name} size={64} />
                    <div>
                      <h3 style={{ marginBottom: 4 }}>{selectedPersonData?.analysis?.name}'s Matches</h3>
                      <p className="text-secondary text-sm">
                        Ranked by AI compatibility — based on values, needs, personality, and conversation chemistry
                      </p>
                    </div>
                  </div>

                  {/* Match list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(selectedRanking.ranked_matches || []).map((match, i) => {
                      const matchPerson = getPerson(match.person_id);
                      return (
                        <div key={i}
                          style={{
                            display: 'flex', gap: 16, padding: 20, borderRadius: 14,
                            background: i === 0 ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))' : 'var(--bg-card)',
                            border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onClick={() => navigate(`/profiles/${match.person_id}`)}>
                          
                          {/* Rank */}
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: i < 3 ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: i < 3 ? '1rem' : '0.875rem',
                            flexShrink: 0,
                          }}>
                            {MEDALS[i] || `#${i + 1}`}
                          </div>

                          {/* Avatar */}
                          <AvatarImg src={matchPerson?.avatar_url} name={match.person_name} size={48} />

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700 }}>{match.person_name}</span>
                              <span className="badge badge-purple">{match.verdict}</span>
                              {match.long_term_potential === 'high' && <span className="badge badge-green">♾️ High potential</span>}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                              {match.reason}
                            </p>
                            {match.first_date_idea && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                                📍 First date: {match.first_date_idea}
                              </div>
                            )}

                            {/* Sub-scores */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                              {[
                                ['Chemistry', match.chemistry_score, '#ec4899'],
                                ['Values', match.values_alignment, '#8b5cf6'],
                                ['Communication', match.communication_fit, '#06b6d4'],
                              ].filter(([, v]) => v).map(([label, val, color]) => (
                                <div key={label} style={{
                                  padding: '3px 10px', borderRadius: 20,
                                  background: `rgba(0,0,0,0.2)`,
                                  border: `1px solid ${color}40`,
                                  fontSize: '0.7rem', color,
                                }}>
                                  {label}: {val}%
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Score */}
                          <div style={{ flexShrink: 0 }}>
                            <ScoreBadge score={Math.round(match.score)} />
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
