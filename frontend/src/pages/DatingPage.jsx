// pages/DatingPage.jsx — Live dating feed
import { useState, useEffect, useCallback, useRef } from 'react';
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

export default function DatingPage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [conversations, setConversations] = useState([]);
  const [liveConv, setLiveConv] = useState(null); // currently live conversation
  const [dating, setDating] = useState(false);
  const [runAll, setRunAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    api.get('/api/people').then(r => {
      if (r.success) setPeople(r.data.filter(p => p.analysis?.name));
    });
    api.get('/api/conversations').then(r => {
      if (r.success) setConversations(r.data.slice(0, 20));
    });
  }, []);

  useSSE(useCallback((data) => {
    if (data.type === 'dating_started') {
      setLiveConv(prev => ({
        id: data.conversation_id,
        person_a: data.person_a,
        person_b: data.person_b,
        messages: [],
        status: 'dating',
      }));
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
      // Refresh conversations
      api.get('/api/conversations').then(r => {
        if (r.success) setConversations(r.data.slice(0, 20));
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
  }, []));

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [liveConv?.messages]);

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

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-purple)';
    if (score >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const readyPeople = people.filter(p => p.analysis?.name);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: '100vh', overflow: 'hidden' }}>
      {/* Left: Live feed */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: '1.5rem' }}>💕</span>
            <div>
              <h2>Live Dating Feed</h2>
              <p className="text-sm text-secondary">Watch AI agents date on their behalf in real-time</p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select className="input" style={{ flex: 1, minWidth: 150 }} value={selectedA} onChange={e => setSelectedA(e.target.value)}>
              <option value="">Person A...</option>
              {readyPeople.map(p => (
                <option key={p.id} value={p.id}>{p.analysis?.name || p.name}</option>
              ))}
            </select>
            <select className="input" style={{ flex: 1, minWidth: 150 }} value={selectedB} onChange={e => setSelectedB(e.target.value)}>
              <option value="">Person B...</option>
              {readyPeople.filter(p => p.id !== selectedA).map(p => (
                <option key={p.id} value={p.id}>{p.analysis?.name || p.name}</option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleStartDate}
              disabled={!selectedA || !selectedB || selectedA === selectedB || dating}
            >
              {dating && !runAll ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : '💬'}
              Start Date
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDateAll}
              disabled={dating || readyPeople.length < 2}
            >
              {runAll ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : '⚡'}
              Date All ({readyPeople.length < 2 ? 'Need 2+' : `${readyPeople.length} people`})
            </button>
          </div>

          {/* Batch progress */}
          {batchProgress && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(139,92,246,0.1)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
                <span>Running all dates...</span>
                <span style={{ color: 'var(--accent-purple)' }}>{batchProgress.completed}/{batchProgress.total}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(batchProgress.completed / batchProgress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Live conversation */}
        <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!liveConv && !dating ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>💑</div>
              <h3 style={{ marginBottom: 8 }}>No active date</h3>
              <p className="text-secondary">Select two people and click "Start Date" to watch agents date live</p>
            </div>
          ) : liveConv ? (
            <div className="animate-fade-in">
              {/* Date header */}
              <div style={{
                padding: '16px 20px', marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))',
                borderRadius: 16, border: '1px solid rgba(139,92,246,0.25)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {liveConv.person_a} × {liveConv.person_b}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    AI agents dating on their behalf
                  </div>
                </div>
                <div className={`badge ${liveConv.status === 'complete' ? 'badge-green' : liveConv.status === 'scoring' ? 'badge-cyan' : 'badge-amber'}`}>
                  {liveConv.status === 'dating' ? '💬 Live' : liveConv.status === 'scoring' ? '🔢 Scoring' : '✅ Complete'}
                </div>
              </div>

              {/* Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {liveConv.messages.map((msg, i) => {
                  const isA = msg.sender === liveConv.person_a;
                  const personData = isA ? getPerson(selectedA) : getPerson(selectedB);
                  
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 12, flexDirection: isA ? 'row' : 'row-reverse',
                      animation: 'bubble-in 0.3s ease forwards',
                    }}>
                      <AvatarImg src={personData?.avatar_url} name={msg.sender} size={36} />
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{
                          fontSize: '0.7rem', color: 'var(--text-muted)',
                          marginBottom: 4, textAlign: isA ? 'left' : 'right',
                        }}>
                          {msg.sender}
                        </div>
                        <div className={`chat-bubble ${isA ? 'left' : 'right'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {dating && !liveConv.status?.includes('complete') && liveConv.messages.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                    Agent typing...
                  </div>
                )}
              </div>

              {/* Compatibility result */}
              {liveConv.status === 'complete' && liveConv.compatibility && (
                <div style={{
                  marginTop: 24, padding: 24, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.08))',
                  border: '1px solid rgba(16,185,129,0.25)',
                  animation: 'fadeIn 0.5s ease',
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, fontSize: '2.5rem', color: getScoreColor(liveConv.compatibility.score) }}>
                      {liveConv.compatibility.score}%
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{liveConv.compatibility.verdict}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{liveConv.compatibility.reason}</div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      ['Chemistry', liveConv.compatibility.chemistry_score, '#ec4899'],
                      ['Values', liveConv.compatibility.values_alignment, '#8b5cf6'],
                      ['Communication', liveConv.compatibility.communication_fit, '#06b6d4'],
                      ['Lifestyle', liveConv.compatibility.lifestyle_match, '#f59e0b'],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{val}%</div>
                      </div>
                    ))}
                  </div>

                  {liveConv.compatibility.first_date_idea && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(139,92,246,0.1)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>✨ Perfect first date: </span>
                      <span style={{ fontSize: '0.875rem' }}>{liveConv.compatibility.first_date_idea}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p className="text-secondary">Setting up the date...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: History */}
      <div style={{ overflowY: 'auto', padding: 20 }}>
        <h4 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          📜 Date History ({conversations.length})
        </h4>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No dates yet. Start one!
          </div>
        ) : (
          conversations.map((conv, i) => {
            const pA = people.find(p => p.id === conv.person_a_id);
            const pB = people.find(p => p.id === conv.person_b_id);
            const nameA = pA?.analysis?.name || pA?.name || 'Unknown';
            const nameB = pB?.analysis?.name || pB?.name || 'Unknown';
            const msgs = conv.messages || [];
            let compat = {};
            try { compat = JSON.parse(conv.compatibility_reason || '{}'); } catch {}
            
            return (
              <div key={conv.id} style={{
                marginBottom: 12, padding: 16, borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
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
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{nameA}</div>
                  <div style={{ fontWeight: 800, color: getScoreColor(conv.compatibility_score) }}>
                    {conv.compatibility_score?.toFixed(0)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>× {nameB}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {msgs.length} messages · {compat.verdict || ''}
                </div>
              </div>
            );
          })
        )}
        
        {conversations.length > 0 && (
          <button className="btn btn-primary w-full" style={{ marginTop: 8 }} onClick={() => navigate('/rankings')}>
            🏆 View Rankings →
          </button>
        )}
      </div>
    </div>
  );
}
