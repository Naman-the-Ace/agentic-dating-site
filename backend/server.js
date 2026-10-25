// server.js — Main Express server
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { scrapeLinkedIn, scrapeInstagram } = require('./scraper');
const { analyzePerson, runDatingConversation, calculateCompatibility } = require('./agent');
const { PEOPLE_LIST } = require('./people');


const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// In production, serve static files from frontend/dist
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors({ origin: '*' }));
app.use(express.json());

// Auto-seed bundled dataset if database is fresh or empty
try {
  const currentPeople = db.getAllPeople();
  if (!currentPeople || currentPeople.length < 25) {
    console.log(`⚡ Fresh database detected (${currentPeople ? currentPeople.length : 0} people). Auto-seeding bundled dataset...`);
    require('./seed');
  }
} catch (seedErr) {
  console.log('Auto-seed check notification:', seedErr.message);
}


// SSE clients for real-time updates
const sseClients = new Map();

function sendSSE(clientId, data) {
  const client = sseClients.get(clientId);
  if (client && !client.writableEnded) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function broadcastSSE(data) {
  sseClients.forEach((client, id) => {
    if (!client.writableEnded) {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });
}

// ── SSE endpoint ────────────────────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = uuidv4();
  sseClients.set(clientId, res);
  
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// ── People endpoints ─────────────────────────────────────────────────────────
app.get('/api/people', (req, res) => {
  try {
    const people = db.getAllPeople();
    res.json({ success: true, data: people });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/people/:id', (req, res) => {
  try {
    const person = db.getPerson(req.params.id);
    if (!person) return res.status(404).json({ success: false, error: 'Person not found' });
    res.json({ success: true, data: person });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/people', async (req, res) => {
  const { linkedin_url, instagram_url, name } = req.body;
  if (!linkedin_url || !instagram_url) {
    return res.status(400).json({ success: false, error: 'LinkedIn and Instagram URLs are required' });
  }

  // Validate URL format
  const isLinkedInValid = typeof linkedin_url === 'string' && (linkedin_url.includes('linkedin.com') || linkedin_url.startsWith('http'));
  const isInstagramValid = typeof instagram_url === 'string' && (instagram_url.includes('instagram.com') || instagram_url.startsWith('@') || instagram_url.startsWith('http'));

  if (!isLinkedInValid || !isInstagramValid) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid profile URL format: please provide valid LinkedIn and Instagram profile URLs' 
    });
  }

  // Check for duplicate profile
  const allPeople = db.getAllPeople();
  const existing = allPeople.find(p => 
    (p.linkedin_url && p.linkedin_url.toLowerCase().trim() === linkedin_url.toLowerCase().trim()) ||
    (p.instagram_url && p.instagram_url.toLowerCase().trim() === instagram_url.toLowerCase().trim())
  );
  if (existing) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: `${existing.name || 'Profile'} already exists in the database.`,
      data: { id: existing.id, status: 'ready', person: existing }
    });
  }

  const id = uuidv4();
  
  try {
    // Create initial record
    db.insertPerson({
      id,
      name: name || 'Loading...',
      linkedin_url,
      instagram_url,
      linkedin_data: {},
      instagram_data: {},
      analysis: {},
      avatar_url: '',
    });

    res.json({ success: true, data: { id, status: 'processing' } });

    // Process asynchronously
    broadcastSSE({ type: 'person_processing', id, status: 'scraping' });
    
    setImmediate(async () => {
      try {
        // Scrape both profiles in parallel
        broadcastSSE({ type: 'person_update', id, status: 'scraping_linkedin' });
        const [linkedinData, instagramData] = await Promise.allSettled([
          scrapeLinkedIn(linkedin_url),
          scrapeInstagram(instagram_url),
        ]);

        const linkedin = linkedinData.value || { name: '', headline: '', rawText: '' };
        const instagram = instagramData.value || { username: '', bio: '', recent_posts: [] };

        db.updatePersonLinkedin(id, linkedin);
        db.updatePersonInstagram(id, instagram);

        broadcastSSE({ type: 'person_update', id, status: 'analyzing' });

        // Analyze with AI
        const analysis = await analyzePerson(linkedin, instagram);
        const personName = analysis.name || linkedin.name || instagram.full_name || 'Unknown';
        const avatarUrl = linkedin.image || instagram.profile_pic_url || '';

        db.updatePersonAnalysis(id, analysis, personName, avatarUrl);
        
        const updatedPerson = db.getPerson(id);
        broadcastSSE({ type: 'person_ready', id, person: updatedPerson });
        
      } catch (err) {
        console.error('Processing error for', id, err.message);
        broadcastSSE({ type: 'person_error', id, error: err.message });
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/people/:id', (req, res) => {
  try {
    db.deletePerson(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Load pre-configured 25 people ────────────────────────────────────────────
app.post('/api/load-demo', async (req, res) => {
  try {
    const batch = PEOPLE_LIST.slice(0, 25);
    const existing = db.getAllPeople();
    const existingUrls = new Set(existing.map(p => p.linkedin_url));
    
    const toLoad = batch.filter(p => !existingUrls.has(p.linkedin));
    const alreadyLoaded = batch.length - toLoad.length;
    
    res.json({ 
      success: true, 
      message: `Queuing ${toLoad.length} new people (${alreadyLoaded} already loaded)...`,
      already_loaded: alreadyLoaded,
      queuing: toLoad.length,
    });
    
    if (toLoad.length === 0) return;
    
    for (let i = 0; i < toLoad.length; i++) {
      const person = toLoad[i];
      const id = uuidv4();
      
      db.insertPerson({
        id,
        name: person.name,
        linkedin_url: person.linkedin,
        instagram_url: person.instagram,
        linkedin_data: {},
        instagram_data: {},
        analysis: {},
        avatar_url: '',
      });

      broadcastSSE({ type: 'demo_progress', index: i + 1, total: toLoad.length, name: person.name, id });

      // Process each person asynchronously
      setImmediate(async () => {
        try {
          const [linkedinResult, instagramResult] = await Promise.allSettled([
            scrapeLinkedIn(person.linkedin),
            scrapeInstagram(person.instagram),
          ]);

          const linkedin = linkedinResult.value || { name: person.name, headline: '', rawText: '' };
          const instagram = instagramResult.value || { username: '', bio: '', recent_posts: [] };

          db.updatePersonLinkedin(id, linkedin);
          db.updatePersonInstagram(id, instagram);

          broadcastSSE({ type: 'person_update', id, name: person.name, status: 'analyzing' });

          const analysis = await analyzePerson(linkedin, instagram);
          const personName = analysis.name || person.name;
          const avatarUrl = linkedin.image || instagram.profile_pic_url || '';

          db.updatePersonAnalysis(id, analysis, personName, avatarUrl);
          
          const updatedPerson = db.getPerson(id);
          broadcastSSE({ type: 'person_ready', id, person: updatedPerson });
        } catch (err) {
          console.error(`Error processing ${person.name}:`, err.message);
          broadcastSSE({ type: 'person_error', id, name: person.name, error: err.message });
        }
      });

      // Small delay between starting each person
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('Demo load error:', err.message);
  }
});


// ── Dating endpoints ─────────────────────────────────────────────────────────
app.get('/api/conversations', (req, res) => {
  try {
    const conversations = db.getAllConversations();
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/conversations/:personId', (req, res) => {
  try {
    const conversations = db.getPersonConversations(req.params.personId);
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/date', async (req, res) => {
  const { person_a_id, person_b_id } = req.body;
  if (!person_a_id || !person_b_id) {
    return res.status(400).json({ success: false, error: 'Both person IDs are required' });
  }

  const personA = db.getPerson(person_a_id);
  const personB = db.getPerson(person_b_id);

  if (!personA || !personB) {
    return res.status(404).json({ success: false, error: 'One or both people not found' });
  }

  const convId = uuidv4();
  res.json({ success: true, data: { conversation_id: convId, status: 'dating' } });

  broadcastSSE({ type: 'dating_started', conversation_id: convId, person_a: personA.analysis?.name || personA.name, person_b: personB.analysis?.name || personB.name });

  setImmediate(async () => {
    try {
      const messages = [];
      
      const conversation = await runDatingConversation(personA, personB, (msg) => {
        messages.push(msg);
        broadcastSSE({ type: 'dating_message', conversation_id: convId, message: msg, person_a_id, person_b_id });
      });

      broadcastSSE({ type: 'dating_scoring', conversation_id: convId });

      const compatibility = await calculateCompatibility(personA, personB, conversation);

      db.insertConversation({
        id: convId,
        person_a_id,
        person_b_id,
        messages: conversation,
        compatibility_score: compatibility.score,
        compatibility_reason: JSON.stringify(compatibility),
      });

      broadcastSSE({ 
        type: 'dating_complete', 
        conversation_id: convId, 
        person_a_id, 
        person_b_id,
        compatibility 
      });
    } catch (err) {
      console.error('Dating error:', err.message);
      broadcastSSE({ type: 'dating_error', conversation_id: convId, error: err.message });
    }
  });
});

// ── Run all dates for all people ─────────────────────────────────────────────
app.post('/api/date-all', async (req, res) => {
  try {
    const people = db.getAllPeople().filter(p => p.analysis && p.analysis.name);
    
    if (people.length < 2) {
      return res.status(400).json({ success: false, error: 'Need at least 2 analyzed people' });
    }

    const pairs = [];
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        // Check if conversation already exists
        const existing = db.getConversation(people[i].id, people[j].id);
        if (!existing) {
          pairs.push([people[i], people[j]]);
        }
      }
    }

    res.json({ success: true, data: { total_pairs: pairs.length, status: 'starting' } });

    broadcastSSE({ type: 'batch_dating_started', total: pairs.length });

    // Process pairs sequentially to avoid rate limits
    setImmediate(async () => {
      let completed = 0;
      for (const [personA, personB] of pairs) {
        try {
          const convId = uuidv4();
          broadcastSSE({ 
            type: 'dating_started', 
            conversation_id: convId,
            person_a: personA.analysis?.name || personA.name, 
            person_b: personB.analysis?.name || personB.name,
            progress: `${completed + 1}/${pairs.length}`
          });

          const conversation = await runDatingConversation(personA, personB, (msg) => {
            broadcastSSE({ type: 'dating_message', conversation_id: convId, message: msg, person_a_id: personA.id, person_b_id: personB.id });
          });

          const compatibility = await calculateCompatibility(personA, personB, conversation);

          db.insertConversation({
            id: convId,
            person_a_id: personA.id,
            person_b_id: personB.id,
            messages: conversation,
            compatibility_score: compatibility.score,
            compatibility_reason: JSON.stringify(compatibility),
          });

          broadcastSSE({ 
            type: 'dating_complete', 
            conversation_id: convId,
            person_a_id: personA.id,
            person_b_id: personB.id,
            compatibility,
            progress: `${completed + 1}/${pairs.length}`
          });

          completed++;
          await new Promise(r => setTimeout(r, 2000)); // Rate limit buffer
        } catch (err) {
          console.error(`Dating error ${personA.name} x ${personB.name}:`, err.message);
        }
      }

      // Generate rankings after all dates
      await generateAllRankings();
      broadcastSSE({ type: 'batch_dating_complete', total: completed });
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Rankings ──────────────────────────────────────────────────────────────────
function computeGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

async function generateAllRankings() {
  const people = db.getAllPeople();
  const allConversations = db.getAllConversations();

  for (const person of people) {
    const personConvs = allConversations.filter(c => 
      c.person_a_id === person.id || c.person_b_id === person.id
    );

    const matches = personConvs.map(conv => {
      const otherId = conv.person_a_id === person.id ? conv.person_b_id : conv.person_a_id;
      const other = people.find(p => p.id === otherId);
      let compatibility = {};
      try {
        compatibility = JSON.parse(conv.compatibility_reason || '{}');
      } catch {}
      
      const score = conv.compatibility_score || 0;
      return {
        person_id: otherId,
        person_name: other?.analysis?.name || other?.name || 'Unknown',
        person_avatar: other?.avatar_url || '',
        person_vibe: other?.analysis?.vibe || '',
        person_tagline: other?.analysis?.tagline || '',
        score,
        grade: computeGrade(score),
        verdict: compatibility.verdict || '',
        reason: compatibility.reason || '',
        chemistry_score: compatibility.chemistry_score || 0,
        values_alignment: compatibility.values_alignment || 0,
        communication_fit: compatibility.communication_fit || 0,
        lifestyle_match: compatibility.lifestyle_match || 0,
        first_date_idea: compatibility.first_date_idea || '',
        long_term_potential: compatibility.long_term_potential || 'medium',
      };
    }).sort((a, b) => b.score - a.score);

    db.insertRanking({
      id: uuidv4(),
      person_id: person.id,
      ranked_matches: matches,
    });
  }
}

app.get('/api/rankings', (req, res) => {
  try {
    const rankings = db.getAllRankings();
    res.json({ success: true, data: rankings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/rankings/:personId', (req, res) => {
  try {
    const ranking = db.getRanking(req.params.personId);
    if (!ranking) return res.status(404).json({ success: false, error: 'No ranking found' });
    res.json({ success: true, data: ranking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/generate-rankings', async (req, res) => {
  try {
    await generateAllRankings();
    res.json({ success: true, message: 'Rankings generated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const people = db.getAllPeople();
  const conversations = db.getAllConversations();
  res.json({ 
    status: 'ok', 
    people_count: people.length,
    conversations_count: conversations.length,
    gemini_configured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyDemo_Replace_With_Your_Key',
  });
});

// ── Production static file serving ───────────────────────────────────────────
// This MUST come AFTER all /api/* routes
const fs = require('fs');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback: serve index.html for all non-API routes (React Router)
  // Express 5 requires named wildcard params — use /*splat
  app.get('/*splat', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`📁 Serving React build from ${DIST_DIR}`);
} else {
  console.log(`⚠️  No frontend/dist found. Run: cd frontend && npm run build`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 AgentDate running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 People: http://localhost:${PORT}/api/people`);
  console.log(`\n${process.env.GEMINI_API_KEY ? '✅' : '❌'} Gemini API: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured — set GEMINI_API_KEY'}\n`);
});
