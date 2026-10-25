// pages/ProfileDetailPage.jsx — Premium full profile view
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 100 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const hue = ((name || '') + '').charCodeAt(0) * 37 % 360;

  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,65%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: size * 0.3,
        border: '3px solid rgba(255,255,255,0.12)',
        boxShadow: `0 8px 32px hsla(${hue},70%,45%,0.4)`,
        fontFamily: 'Space Grotesk, sans-serif',
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        border: '3px solid rgba(139,92,246,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    />
  );
}

function TraitBar({ label, value, color = '#8b5cf6' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}%</span>
      </div>
      <div className="progress-bar-thick">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function Section({ title, icon, children, accent }) {
  return (
    <div className="card" style={{
      marginBottom: 18,
      borderColor: accent ? `${accent}30` : 'var(--border)',
      background: accent ? `${accent}08` : 'var(--bg-card)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16,
        paddingBottom: 12, borderBottom: `1px solid ${accent ? accent + '20' : 'var(--border)'}`,
      }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h4 style={{ color: accent || 'var(--text-primary)' }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoChip({ icon, label, value, color }) {
  return (
    <div style={{
      flex: '1', minWidth: 130,
      background: color ? `${color}12` : 'var(--bg-card)',
      border: `1px solid ${color ? color + '25' : 'var(--border)'}`,
      borderRadius: 12, padding: '12px 16px',
    }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: color || 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span>{icon}</span>}
        {value}
      </div>
    </div>
  );
}

export default function ProfileDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [ranking, setRanking] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [personRes, convsRes, rankRes] = await Promise.allSettled([
          api.get(`/api/people/${id}`),
          api.get(`/api/conversations/${id}`),
          api.get(`/api/rankings/${id}`),
        ]);
        if (personRes.value?.success) setPerson(personRes.value.data);
        if (convsRes.value?.success) setConversations(convsRes.value.data);
        if (rankRes.value?.success) setRanking(rankRes.value.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 44 }}>
        <div className="skeleton" style={{ height: 220, borderRadius: 20, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{ padding: 44, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <h3 style={{ marginBottom: 8 }}>Person not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/profiles')}>
          ← Back to Profiles
        </button>
      </div>
    );
  }

  const a = person.analysis || {};
  const hue = ((a.name || person.name || '') + '').charCodeAt(0) * 37 % 360;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 40px 60px' }}>
      {/* Back button */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate('/profiles')}>
        ← Back to Profiles
      </button>

      {/* ── Hero card ── */}
      <div style={{
        borderRadius: 22, overflow: 'hidden', marginBottom: 24,
        border: '1px solid rgba(139,92,246,0.22)',
        background: `linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.07))`,
        position: 'relative',
      }}>
        {/* Accent bar */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,65%))`,
        }} />

        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: `radial-gradient(circle, hsla(${hue},70%,55%,0.12) 0%, transparent 65%)`,
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ padding: '28px 32px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <AvatarImg src={person.avatar_url} name={a.name || person.name} size={96} />
              {/* Online indicator */}
              <div style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--accent-green)',
                border: '3px solid var(--bg-primary)',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.8rem' }}>{a.name || person.name}</h2>
                {a.emoji_personality && <span style={{ fontSize: '1.6rem' }}>{a.emoji_personality}</span>}
              </div>

              <div style={{ color: 'var(--accent-purple-light)', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>
                {a.professional_domain}
                {a.personality_type && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {a.personality_type}</span>}
              </div>

              {a.tagline && (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 14, fontSize: '0.93rem', maxWidth: 540 }}>
                  "{a.tagline}"
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {a.vibe && <span className="badge badge-purple">✨ {a.vibe}</span>}
                {a.age_estimate && <span className="badge badge-cyan">🎂 {a.age_estimate}</span>}
                {a.social_style && <span className="badge badge-amber">🌟 {a.social_style?.split(' ')[0]}</span>}
                {a.love_language && <span className="badge badge-pink">💕 {a.love_language}</span>}
              </div>

              {/* Source links */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}>
                  <span style={{ fontWeight: 900, color: '#0077B5' }}>in</span>
                  LinkedIn Profile
                </a>
                <a href={person.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}>
                  📸 Instagram
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/dating')}>
                  💬 Simulate Date
                </button>
              </div>
            </div>
          </div>

          {/* Dating bio */}
          {a.dating_bio && (
            <div style={{
              marginTop: 22, padding: '16px 20px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                💬 Dating Bio — Written by their AI Agent
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', fontSize: '0.9rem' }}>
                "{a.dating_bio}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Info chips row ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        {a.love_language && <InfoChip icon="💕" label="Love Language" value={a.love_language} color="#ec4899" />}
        {a.relationship_style && <InfoChip icon="🤝" label="Relationship Style" value={a.relationship_style} color="#8b5cf6" />}
        {a.communication_style && <InfoChip icon="💬" label="Communication" value={a.communication_style?.split(',')[0] || a.communication_style} color="#06b6d4" />}
        {a.social_style && <InfoChip icon="🌟" label="Social Style" value={a.social_style?.split(',')[0] || a.social_style} color="#f59e0b" />}
      </div>

      {/* ── Main 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Left column */}
        <div>
          <Section title="Hobbies & Interests" icon="🎯" accent="#8b5cf6">
            {a.hobbies && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Hobbies</div>
                <div className="tag-list">
                  {a.hobbies.map((h, i) => <span key={i} className="tag" style={{ borderColor: 'rgba(139,92,246,0.35)' }}>{h}</span>)}
                </div>
              </div>
            )}
            {a.interests && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Interests</div>
                <div className="tag-list">
                  {a.interests.map((h, i) => <span key={i} className="tag" style={{ borderColor: 'rgba(236,72,153,0.3)' }}>{h}</span>)}
                </div>
              </div>
            )}
          </Section>

          <Section title="Values & Life Goals" icon="⭐" accent="#f59e0b">
            {a.values && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Core Values</div>
                <div className="tag-list">
                  {a.values.map((v, i) => <span key={i} className="tag">{v}</span>)}
                </div>
              </div>
            )}
            {a.life_goals && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Life Goals</div>
                {a.life_goals.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-amber)', marginTop: 1 }}>→</span>
                    <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Strengths" icon="💪" accent="#10b981">
            <div className="tag-list" style={{ marginBottom: 14 }}>
              {(a.strengths || []).map((s, i) => (
                <span key={i} className="badge badge-green">{s}</span>
              ))}
            </div>
            {a.fun_facts && a.fun_facts.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Fun Facts</div>
                {a.fun_facts.map((f, i) => (
                  <div key={i} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 7, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent-green)' }}>✨</span>
                    <span style={{ lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div>
          <Section title="What They Need in a Partner" icon="❤️" accent="#ec4899">
            {(a.needs_in_partner || []).map((need, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent-pink)', fontSize: '0.875rem', marginTop: 2, flexShrink: 0 }}>♥</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{need}</span>
              </div>
            ))}
            {a.dealbreakers && a.dealbreakers.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Dealbreakers</div>
                {a.dealbreakers.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 1 }}>✕</span>
                    <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Conversation Starters" icon="💭" accent="#06b6d4">
            {(a.conversation_starters || []).map((s, i) => (
              <div key={i} style={{
                padding: '11px 14px', marginBottom: 8,
                background: 'rgba(6,182,212,0.07)',
                borderRadius: 10, border: '1px solid rgba(6,182,212,0.18)',
                fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5,
              }}>
                💬 "{s}"
              </div>
            ))}
          </Section>

          {/* Psychological signals */}
          {(a.openness_score || a.ambition_score || a.empathy_score || a.humor_score) && (
            <Section title="Psychological Profile" icon="🧠" accent="#8b5cf6">
              {[
                ['Openness', a.openness_score, '#8b5cf6'],
                ['Ambition', a.ambition_score, '#ec4899'],
                ['Empathy', a.empathy_score, '#10b981'],
                ['Humor', a.humor_score, '#f59e0b'],
              ].filter(([, v]) => v).map(([label, val, color]) => (
                <TraitBar key={label} label={label} value={val} color={color} />
              ))}
            </Section>
          )}
        </div>
      </div>

      {/* ── Top Matches ── */}
      {ranking && ranking.ranked_matches?.length > 0 && (
        <Section title={`Best Matches (${ranking.ranked_matches.length} total)`} icon="🏆">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {ranking.ranked_matches.slice(0, 6).map((match, i) => {
              const color = match.score >= 80 ? 'var(--accent-green)' : match.score >= 60 ? 'var(--accent-purple)' : 'var(--accent-amber)';
              return (
                <div key={i}
                  style={{
                    padding: 14, borderRadius: 12,
                    background: i === 0 ? 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.12))' : 'var(--bg-card)',
                    border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.35)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.22s ease',
                  }}
                  onClick={() => navigate(`/profiles/${match.person_id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {['🥇', '🥈', '🥉'][i] || `#${i + 1}`}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color, fontFamily: 'Space Grotesk, sans-serif' }}>{Math.round(match.score)}%</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 4 }}>{match.person_name}</div>
                  {match.verdict && <div className="badge badge-purple" style={{ fontSize: '0.6rem', marginBottom: 8 }}>{match.verdict}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {match.reason}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 14 }} onClick={() => navigate('/rankings')}>
            View Full Rankings →
          </button>
        </Section>
      )}

      {/* ── Date History ── */}
      {conversations.length > 0 && (
        <Section title={`Dating History (${conversations.length} dates)`} icon="💬">
          {conversations.slice(0, 4).map((conv, i) => {
            const otherId = conv.person_a_id === id ? conv.person_b_id : conv.person_a_id;
            const msgs = conv.messages || [];
            let compat = {};
            try { compat = JSON.parse(conv.compatibility_reason || '{}'); } catch {}
            const score = conv.compatibility_score;
            const color = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-purple)' : 'var(--accent-amber)';

            return (
              <div key={i} style={{
                marginBottom: 14, padding: '16px 18px', borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onClick={() => navigate('/dating')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Date #{i + 1}
                    {compat.verdict && <span className="badge badge-purple" style={{ marginLeft: 8 }}>{compat.verdict}</span>}
                  </div>
                  <div style={{ fontWeight: 900, color, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem' }}>
                    {score?.toFixed(0)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {msgs.length} messages exchanged
                </div>
                {msgs.slice(0, 2).map((msg, j) => (
                  <div key={j} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{msg.sender}:</strong> {msg.text?.substring(0, 90)}{msg.text?.length > 90 ? '...' : ''}
                  </div>
                ))}
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}
