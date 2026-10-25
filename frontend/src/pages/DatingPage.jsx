// pages/DatingPage.jsx — Premium live dating arena
import { useState, useEffect, useCallback, useRef } from 'react';
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
        fontFamily: 'Space Grotesk, Inter, sans-serif',
        boxShadow: `0 3px 10px hsla(${hue},70%,45%,0.35)`,
      }}>{initials}</div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.3)' }} />
  );
}

function CompatResult({ compat, personA, personB, onViewRankings }) {
  const score = Math.round(compat.score || 0);
  const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-purple)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const bgColor = score >= 80 ? 'rgba(16,185,129,0.08)' : score >= 60 ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)';

  const dims = [
    { label: 'Chemistry & Sparks', value: compat.chemistry_score, color: '#ec4899', icon: '💕' },
    { label: 'Values Alignment', value: compat.values_alignment, color: '#8b5cf6', icon: '⭐' },
    { label: 'Communication', value: compat.communication_fit, color: '#06b6d4', icon: '💬' },
    { label: 'Lifestyle Match', value: compat.lifestyle_match, color: '#f59e0b', icon: '🌟' },
  ].filter(d => d.value);

  return (
    <div className="animate-fade-in" style={{
      marginTop: 24, padding: 24, borderRadius: 18,
      background: bgColor, border: `1px solid ${color}30`,
    }}>
      {/* Score hero */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
          Compatibility Score
        </div>
        <div className="score-big" style={{ color }}>
          {score}<span style={{ fontSize: '2rem', fontWeight: 600 }}>%</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, marginTop: 8 }}>{compat.verdict}</div>
        {compat.grade && (
          <div className="grade-badge" style={{
            display: 'inline-flex', margin: '4px auto',
            background: color + '22', border: `2px solid ${color}`,
            color,
          }}>{compat.grade}</div>
        )}
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 400, margin: '12px auto 0', lineHeight: 1.6 }}>
          {compat.reason}
        </p>
      </div>

      {/* 4D breakdown */}
      {dims.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
            4-Dimensional Analysis
          </div>
          <div className="compat-bar">
            {dims.map(d => (
              <div key={d.label} className="compat-bar-item">
                <span style={{ fontSize: '0.9rem' }}>{d.icon}</span>
                <div className="compat-bar-label">{d.label}</div>
                <div className="compat-bar-track">
                  <div className="compat-bar-fill" style={{ width: `${d.value}%`, background: d.color }} />
                </div>
                <div className="compat-bar-value" style={{ color: d.color }}>{d.value}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First date idea */}
      {compat.first_date_idea && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(139,92,246,0.1)',
          borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-purple)', marginBottom: 6 }}>
            ✨ AI-Recommended First Date
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
            {compat.first_date_idea}
          </p>
        </div>
      )}

      {/* Long-term potential */}
      {compat.long_term_potential && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Long-term Potential:
          </span>
          <div className={`badge ${compat.long_term_potential === 'high' ? 'badge-green' : compat.long_term_potential === 'medium' ? 'badge-amber' : 'badge-red'}`}>
            {compat.long_term_potential === 'high' ? '♾️ High' : compat.long_term_potential === 'medium' ? '⚖️ Medium' : '📉 Low'}
          </div>
        </div>
      )}

      <button className="btn btn-primary w-full" onClick={onViewRankings}>
        🏆 View Full Rankings
      </button>
    </div>
  );
}

export default function DatingPage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [conversations, setConversations] = useState([]);
  const [liveConv, setLiveConv] = useState(null);
  const [dating, setDating] = useState(false);
  const [runAll, setRunAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    api.get('/api/people').then(r => {
      if (r.success) setPeople(r.data.filter(p => p.analysis?.name));
    });
    api.get('/api/conversations').then(r => {
      if (r.success) setConversations(r.data.slice(0, 30));
    });
  }, []);

  useSSE(useCallback((data) => {
    if (data.type === 'dating_started') {
      setLiveConv({
        id: data.conversation_id,
        person_a: data.person_a,
        person_b: data.person_b,
        messages: [],
        status: 'dating',
      });
      setDating(true);
    }
    if (data.type === 'dating_message') {
      setLiveConv(prev => {
        if (!prev || prev.id !== data.conversation_id) return prev;
        return { ...prev, messages: [...prev.messages, data.message] };
      });
    }
    if (data.type === 'dating_scoring') {
      setLiveConv(prev => prev ? { ...prev, status: 'scoring' } : prev);
    }
    if (data.type === 'dating_complete') {
      setLiveConv(prev => prev ? {
        ...prev,
        status: 'complete',
        compatibility: data.compatibility,
      } : prev);
      setDating(false);
      api.get('/api/conversations').then(r => {
        if (r.success) setConversations(r.data.slice(0, 30));
      });
    }
    if (data.type === 'batch_dating_started') {
      setBatchProgress({ total: data.total, completed: 0 });
    }
    if (data.type === 'batch_dating_complete') {
      setBatchProgress(null);
      setRunAll(false);
      setDating(false);
    }
    if (data.type === 'dating_complete' && batchProgress) {
      setBatchProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
    }
  }, [batchProgress]));

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [liveConv?.messages?.length]);

  const handleStartDate = async () => {
    if (!selectedA || !selectedB || selectedA === selectedB) return;
    setDating(true);
    setLiveConv(null);
    await api.post('/api/date', { person_a_id: selectedA, person_b_id: selectedB });
  };

  const handleDateAll = async () => {
    setRunAll(true);
    setDating(true);
    await api.post('/api/date-all', {});
  };

  const getPerson = (id) => people.find(p => p.id === id);
  const personA = getPerson(selectedA);
  const personB = getPerson(selectedB);

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-purple)';
    if (score >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const readyPeople = people.filter(p => p.analysis?.name);

  const statusBadge = {
    dating: { label: '💬 Live', cls: 'badge-amber' },
    scoring: { label: '🔢 Scoring', cls: 'badge-cyan' },
    complete: { label: '✅ Complete', cls: 'badge-green' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left: Live feed ── */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Header / Controls */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--gradient-header)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ fontSize: '1.5rem' }}>💕</span>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Live Dating Arena</h2>
              <p className="text-sm text-secondary" style={{ marginTop: 1 }}>Watch AI agents date each other in real-time</p>
            </div>
          </div>

          {/* Person selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 10, alignItems: 'center' }}>
            <select className="input" value={selectedA} onChange={e => setSelectedA(e.target.value)}>
              <option value="">Select Person A...</option>
              {readyPeople.map(p => (
                <option key={p.id} value={p.id}>{p.analysis?.name || p.name}</option>
              ))}
            </select>

            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient-love)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
            }}>×</div>

            <select className="input" value={selectedB} onChange={e => setSelectedB(e.target.value)}>
              <option value="">Select Person B...</option>
              {readyPeople.filter(p => p.id !== selectedA).map(p => (
                <option key={p.id} value={p.id}>{p.analysis?.name || p.name}</option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={handleStartDate}
              disabled={!selectedA || !selectedB || selectedA === selectedB || dating}
              style={{ flexShrink: 0 }}
            >
              {dating && !runAll ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : '💬'}
              Start Date
            </button>
          </div>

          {/* Selected person preview */}
          {(personA || personB) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
              {personA && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <AvatarImg src={personA.avatar_url} name={personA.analysis?.name} size={24} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{personA.analysis?.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{personA.analysis?.emoji_personality?.split(' ')[0]}</span>
                </div>
              )}
              {personA && personB && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>meets</span>}
              {personB && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <AvatarImg src={personB.avatar_url} name={personB.analysis?.name} size={24} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{personB.analysis?.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{personB.analysis?.emoji_personality?.split(' ')[0]}</span>
                </div>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDateAll}
                disabled={dating || readyPeople.length < 2}
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                {runAll ? <div className="loading-spinner" style={{ width: 12, height: 12 }} /> : '⚡'}
                Date All ({readyPeople.length})
              </button>
            </div>
          )}

          {/* Batch progress */}
          {batchProgress && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="loading-spinner" style={{ width: 12, height: 12 }} />
                  Running all dates...
                </span>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                  {batchProgress.completed}/{batchProgress.total}
                </span>
              </div>
              <div className="progress-bar-thick">
                <div className="progress-fill" style={{ width: `${(batchProgress.completed / batchProgress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Live conversation feed */}
        <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {!liveConv && !dating ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }} className="animate-fade-in">
              <div style={{ fontSize: '4.5rem', marginBottom: 16 }} className="animate-float">💑</div>
              <h3 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>No Active Date</h3>
              <p className="text-secondary" style={{ marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                Select two people above and click "Start Date" to watch AI agents have a real conversation on their behalf.
              </p>
              {readyPeople.length < 2 && (
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  + Add People First
                </button>
              )}
            </div>
          ) : liveConv ? (
            <div className="animate-fade-in">
              {/* Date header bar */}
              <div style={{
                padding: '14px 18px', marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
                borderRadius: 14, border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AvatarImg src={personA?.avatar_url} name={liveConv.person_a} size={30} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{liveConv.person_a}</span>
                  <span style={{ color: 'var(--accent-pink)', fontWeight: 700 }}>♥</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{liveConv.person_b}</span>
                  <AvatarImg src={personB?.avatar_url} name={liveConv.person_b} size={30} />
                </div>
                <div className={`badge ${(statusBadge[liveConv.status] || statusBadge.dating).cls}`}>
                  {(statusBadge[liveConv.status] || statusBadge.dating).label}
                </div>
              </div>

              {/* Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {liveConv.messages.map((msg, i) => {
                  const isA = msg.sender === liveConv.person_a;
                  const personData = isA ? personA : personB;

                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 10,
                      flexDirection: isA ? 'row' : 'row-reverse',
                    }}>
                      <div style={{ flexShrink: 0, paddingTop: 2 }}>
                        <AvatarImg src={personData?.avatar_url} name={msg.sender} size={34} />
                      </div>
                      <div style={{ maxWidth: '72%' }}>
                        <div style={{
                          fontSize: '0.68rem', color: 'var(--text-muted)',
                          marginBottom: 5, textAlign: isA ? 'left' : 'right',
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {msg.sender}
                        </div>
                        <div className={`chat-bubble ${isA ? 'left' : 'right'}`}
                          style={{ animationDelay: `${i * 20}ms` }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {dating && liveConv.status === 'dating' && liveConv.messages.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexDirection: 'row' }}>
                    <div style={{ flexShrink: 0, paddingTop: 2 }}>
                      <AvatarImg
                        src={liveConv.messages.length % 2 === 0 ? personA?.avatar_url : personB?.avatar_url}
                        name={liveConv.messages.length % 2 === 0 ? liveConv.person_a : liveConv.person_b}
                        size={34}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {liveConv.messages.length % 2 === 0 ? liveConv.person_a : liveConv.person_b}
                      </div>
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Scoring state */}
                {liveConv.status === 'scoring' && (
                  <div className="animate-fade-in" style={{
                    textAlign: 'center', padding: 20,
                    background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                    borderRadius: 14,
                  }}>
                    <div className="loading-spinner" style={{ width: 28, height: 28, margin: '0 auto 12px', borderTopColor: 'var(--accent-cyan)', borderRightColor: 'var(--accent-purple)' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      AI is scoring the date across 4 dimensions...
                    </p>
                  </div>
                )}

                {/* Compatibility result */}
                {liveConv.status === 'complete' && liveConv.compatibility && (
                  <CompatResult
                    compat={liveConv.compatibility}
                    personA={personA}
                    personB={personB}
                    onViewRankings={() => navigate('/rankings')}
                  />
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p className="text-secondary">Setting up the date...</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: History panel ── */}
      <div style={{ overflowY: 'auto', padding: '18px 18px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h4 style={{ marginBottom: 2 }}>📜 Date History</h4>
          <p className="text-xs text-muted">{conversations.length} past dates</p>
        </div>

        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            No dates yet. Start one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conversations.map((conv, i) => {
              const pA = people.find(p => p.id === conv.person_a_id);
              const pB = people.find(p => p.id === conv.person_b_id);
              const nameA = pA?.analysis?.name || pA?.name || 'Unknown';
              const nameB = pB?.analysis?.name || pB?.name || 'Unknown';
              const msgs = conv.messages || [];
              let compat = {};
              try { compat = JSON.parse(conv.compatibility_reason || '{}'); } catch {}
              const score = conv.compatibility_score;
              const scoreColor = getScoreColorFn(score);

              return (
                <div key={conv.id}
                  style={{
                    padding: 14, borderRadius: 12,
                    background: liveConv?.id === conv.id ? 'rgba(139,92,246,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${liveConv?.id === conv.id ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setSelectedA(conv.person_a_id);
                    setSelectedB(conv.person_b_id);
                    setLiveConv({
                      id: conv.id,
                      person_a: nameA,
                      person_b: nameB,
                      messages: msgs,
                      status: 'complete',
                      compatibility: compat,
                    });
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <AvatarImg src={pA?.avatar_url} name={nameA} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameA}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>meets {nameB}</div>
                    </div>
                    <AvatarImg src={pB?.avatar_url} name={nameB} size={26} />
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: scoreColor, flexShrink: 0 }}>
                      {score?.toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {msgs.length} msgs
                    </span>
                  </div>
                  {compat.verdict && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {compat.verdict}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {conversations.length > 0 && (
          <button className="btn btn-primary w-full" style={{ marginTop: 14 }} onClick={() => navigate('/rankings')}>
            🏆 View Full Rankings →
          </button>
        )}
      </div>
    </div>
  );
}

function getScoreColorFn(score) {
  if (!score) return 'var(--text-muted)';
  if (score >= 80) return 'var(--accent-green)';
  if (score >= 60) return 'var(--accent-purple)';
  if (score >= 40) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}
