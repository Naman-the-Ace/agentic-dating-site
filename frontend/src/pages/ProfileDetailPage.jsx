// pages/ProfileDetailPage.jsx — Full profile view
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../hooks/useSSE';

function AvatarImg({ src, name, size = 100 }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: size * 0.3,
        border: '3px solid rgba(255,255,255,0.1)',
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(139,92,246,0.3)' }}
    />
  );
}

function TraitBar({ label, value, color = '#8b5cf6' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{value}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <h4>{title}</h4>
      </div>
      {children}
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
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 150, borderRadius: 16 }} />
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3>Person not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/profiles')}>
          Back to Profiles
        </button>
      </div>
    );
  }

  const a = person.analysis || {};

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate('/profiles')}>
        ← Back to Profiles
      </button>

      {/* Hero card */}
      <div className="glass-card" style={{
        padding: 32, marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
        borderColor: 'rgba(139,92,246,0.2)',
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <AvatarImg src={person.avatar_url} name={a.name || person.name} size={100} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2>{a.name || person.name}</h2>
              {a.emoji_personality && <span style={{ fontSize: '1.5rem' }}>{a.emoji_personality}</span>}
            </div>
            <div style={{ color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 8 }}>
              {a.professional_domain} · {a.personality_type}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
              "{a.tagline}"
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {a.vibe && <span className="badge badge-purple">✨ {a.vibe}</span>}
              {a.age_estimate && <span className="badge badge-cyan">🎂 {a.age_estimate}</span>}
              {a.social_style && <span className="badge badge-amber">🌟 {a.social_style?.split(' ')[0]}</span>}
            </div>
            
            {/* Sources */}
            <div style={{ display: 'flex', gap: 12 }}>
              <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                onClick={e => e.stopPropagation()}
              >
                in LinkedIn
              </a>
              <a href={person.instagram_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                onClick={e => e.stopPropagation()}
              >
                📸 Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Dating bio */}
        {a.dating_bio && (
          <div style={{
            marginTop: 24, padding: 20,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              💬 Dating Bio (as written by their agent)
            </div>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{a.dating_bio}"
            </p>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Left */}
        <div>
          <Section title="Hobbies & Interests" icon="🎯">
            {a.hobbies && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hobbies</div>
                <div className="tag-list">
                  {a.hobbies.map((h, i) => <span key={i} className="tag" style={{ borderColor: 'rgba(139,92,246,0.3)' }}>{h}</span>)}
                </div>
              </div>
            )}
            {a.interests && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interests</div>
                <div className="tag-list">
                  {a.interests.map((h, i) => <span key={i} className="tag" style={{ borderColor: 'rgba(236,72,153,0.3)' }}>{h}</span>)}
                </div>
              </div>
            )}
          </Section>

          <Section title="Values & Life Goals" icon="⭐">
            {a.values && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Core Values</div>
                <div className="tag-list">
                  {a.values.map((v, i) => <span key={i} className="tag">{v}</span>)}
                </div>
              </div>
            )}
            {a.life_goals && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Life Goals</div>
                {a.life_goals.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--accent-amber)' }}>→</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{g}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Personality" icon="🧠">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                {a.love_language && (
                  <div style={{ flex: 1, minWidth: 120, background: 'rgba(236,72,153,0.1)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(236,72,153,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Love Language</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-pink)', fontSize: '0.875rem' }}>💕 {a.love_language}</div>
                  </div>
                )}
                {a.relationship_style && (
                  <div style={{ flex: 1, minWidth: 120, background: 'rgba(139,92,246,0.1)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Relationship Style</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-purple)', fontSize: '0.875rem' }}>{a.relationship_style}</div>
                  </div>
                )}
              </div>
              {a.communication_style && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  💬 {a.communication_style}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Right */}
        <div>
          <Section title="What They Need in a Partner" icon="❤️">
            {(a.needs_in_partner || []).map((need, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent-pink)', fontSize: '0.875rem', marginTop: 1 }}>♥</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{need}</span>
              </div>
            ))}
            {a.dealbreakers && a.dealbreakers.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Dealbreakers</div>
                {a.dealbreakers.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--accent-red)' }}>✕</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Strengths" icon="💪">
            <div className="tag-list">
              {(a.strengths || []).map((s, i) => (
                <span key={i} className="badge badge-green">{s}</span>
              ))}
            </div>
            {a.fun_facts && (
              <div style={{ marginTop: 16 }}>
                {a.fun_facts.map((f, i) => (
                  <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    ✨ {f}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Conversation Starters" icon="💭">
            {(a.conversation_starters || []).map((s, i) => (
              <div key={i} style={{
                padding: '10px 14px', marginBottom: 8,
                background: 'rgba(139,92,246,0.08)',
                borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)',
                fontSize: '0.875rem', color: 'var(--text-primary)',
              }}>
                💬 "{s}"
              </div>
            ))}
          </Section>
        </div>
      </div>

      {/* Top matches */}
      {ranking && ranking.ranked_matches?.length > 0 && (
        <Section title="Best Matches" icon="🏆">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {ranking.ranked_matches.slice(0, 6).map((match, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 12,
                background: i === 0 ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))' : 'var(--bg-card)',
                border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/profiles/${match.person_id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>#{i + 1}</span>
                  <span style={{
                    fontWeight: 800, fontSize: '1rem',
                    color: match.score >= 80 ? 'var(--accent-green)' : match.score >= 60 ? 'var(--accent-purple)' : 'var(--accent-amber)',
                  }}>{match.score}%</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{match.person_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{match.verdict}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {match.reason}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Conversations */}
      {conversations.length > 0 && (
        <Section title={`Dating History (${conversations.length} dates)`} icon="💬">
          {conversations.slice(0, 3).map((conv, i) => {
            const otherId = conv.person_a_id === id ? conv.person_b_id : conv.person_a_id;
            const msgs = conv.messages || [];
            let compat = {};
            try { compat = JSON.parse(conv.compatibility_reason || '{}'); } catch {}
            
            return (
              <div key={i} style={{
                marginBottom: 16, padding: 16, borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>Date with someone</div>
                  <div style={{ fontWeight: 700, color: conv.compatibility_score >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                    {conv.compatibility_score?.toFixed(0)}% match
                  </div>
                </div>
                {msgs.slice(0, 2).map((msg, j) => (
                  <div key={j} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{msg.sender}: </strong>{msg.text}
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
