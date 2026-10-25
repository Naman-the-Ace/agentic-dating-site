// database.js — SQLite database layer
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'dating.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    name TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    linkedin_data TEXT,
    instagram_data TEXT,
    analysis TEXT,
    avatar_url TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    person_a_id TEXT,
    person_b_id TEXT,
    messages TEXT,
    compatibility_score REAL,
    compatibility_reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    FOREIGN KEY (person_a_id) REFERENCES people(id),
    FOREIGN KEY (person_b_id) REFERENCES people(id)
  );

  CREATE TABLE IF NOT EXISTS rankings (
    id TEXT PRIMARY KEY,
    person_id TEXT,
    ranked_matches TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    FOREIGN KEY (person_id) REFERENCES people(id)
  );
`);

module.exports = {
  // People
  insertPerson: (person) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO people (id, name, linkedin_url, instagram_url, linkedin_data, instagram_data, analysis, avatar_url)
      VALUES (@id, @name, @linkedin_url, @instagram_url, @linkedin_data, @instagram_data, @analysis, @avatar_url)
    `);
    return stmt.run({
      ...person,
      linkedin_data: JSON.stringify(person.linkedin_data || {}),
      instagram_data: JSON.stringify(person.instagram_data || {}),
      analysis: JSON.stringify(person.analysis || {}),
    });
  },

  updatePersonAnalysis: (id, analysis, name, avatar_url) => {
    const stmt = db.prepare(`
      UPDATE people SET analysis = @analysis, name = @name, avatar_url = @avatar_url WHERE id = @id
    `);
    return stmt.run({ id, analysis: JSON.stringify(analysis), name, avatar_url });
  },

  updatePersonLinkedin: (id, data) => {
    const stmt = db.prepare(`UPDATE people SET linkedin_data = @data WHERE id = @id`);
    return stmt.run({ id, data: JSON.stringify(data) });
  },

  updatePersonInstagram: (id, data) => {
    const stmt = db.prepare(`UPDATE people SET instagram_data = @data WHERE id = @id`);
    return stmt.run({ id, data: JSON.stringify(data) });
  },

  getPerson: (id) => {
    const row = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    if (!row) return null;
    return parsePerson(row);
  },

  getAllPeople: () => {
    const rows = db.prepare('SELECT * FROM people ORDER BY created_at DESC').all();
    return rows.map(parsePerson);
  },

  deletePerson: (id) => {
    db.prepare('DELETE FROM people WHERE id = ?').run(id);
    db.prepare('DELETE FROM conversations WHERE person_a_id = ? OR person_b_id = ?').run(id, id);
    db.prepare('DELETE FROM rankings WHERE person_id = ?').run(id);
  },

  // Conversations
  insertConversation: (conv) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO conversations (id, person_a_id, person_b_id, messages, compatibility_score, compatibility_reason)
      VALUES (@id, @person_a_id, @person_b_id, @messages, @compatibility_score, @compatibility_reason)
    `);
    return stmt.run({
      ...conv,
      messages: JSON.stringify(conv.messages || []),
    });
  },

  getConversation: (personAId, personBId) => {
    const row = db.prepare(`
      SELECT * FROM conversations 
      WHERE (person_a_id = ? AND person_b_id = ?) OR (person_a_id = ? AND person_b_id = ?)
    `).get(personAId, personBId, personBId, personAId);
    if (!row) return null;
    return { ...row, messages: JSON.parse(row.messages || '[]') };
  },

  getAllConversations: () => {
    const rows = db.prepare('SELECT * FROM conversations ORDER BY created_at DESC').all();
    return rows.map(r => ({ ...r, messages: JSON.parse(r.messages || '[]') }));
  },

  getPersonConversations: (personId) => {
    const rows = db.prepare(`
      SELECT * FROM conversations 
      WHERE person_a_id = ? OR person_b_id = ?
      ORDER BY created_at DESC
    `).all(personId, personId);
    return rows.map(r => ({ ...r, messages: JSON.parse(r.messages || '[]') }));
  },

  // Rankings
  insertRanking: (ranking) => {
    // Delete existing ranking for this person first, then insert fresh
    db.prepare('DELETE FROM rankings WHERE person_id = ?').run(ranking.person_id);
    const stmt = db.prepare(`
      INSERT INTO rankings (id, person_id, ranked_matches)
      VALUES (@id, @person_id, @ranked_matches)
    `);
    return stmt.run({
      ...ranking,
      ranked_matches: JSON.stringify(ranking.ranked_matches || []),
    });
  },

  getRanking: (personId) => {
    const row = db.prepare('SELECT * FROM rankings WHERE person_id = ?').get(personId);
    if (!row) return null;
    const matches = safeJSONArray(row.ranked_matches);
    return { ...row, ranked_matches: matches };
  },

  getAllRankings: () => {
    const rows = db.prepare('SELECT * FROM rankings ORDER BY created_at DESC').all();
    return rows.map(r => ({ ...r, ranked_matches: safeJSONArray(r.ranked_matches) }));
  },
};

function parsePerson(row) {
  return {
    ...row,
    linkedin_data: safeJSON(row.linkedin_data),
    instagram_data: safeJSON(row.instagram_data),
    analysis: safeJSON(row.analysis),
  };
}

function safeJSON(str) {
  try { return JSON.parse(str || '{}'); } catch { return {}; }
}

function safeJSONArray(str) {
  if (!str || str === '' || str === 'null') return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
