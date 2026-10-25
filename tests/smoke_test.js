// tests/smoke_test.js — Comprehensive API & Integration Test Suite
const http = require('http');

const BASE_URL = 'http://localhost:3001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING AGENTDATE INTEGRATION TEST SUITE');
  console.log('========================================\n');

  // Test 1: Health endpoint
  console.log('[1/12] Testing Health Endpoint...');
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200, 'Health check returns 200');
  assert(healthRes.body.status === 'ok', 'Health status is ok');
  assert(healthRes.body.people_count >= 25, `Contains at least 25 people (got ${healthRes.body.people_count})`);
  assert(healthRes.body.gemini_configured === true, 'Gemini API is configured');

  // Test 2: People list endpoint
  console.log('\n[2/12] Testing People List Endpoint...');
  const peopleRes = await request('GET', '/api/people');
  assert(peopleRes.status === 200, 'GET /api/people returns 200');
  assert(Array.isArray(peopleRes.body.data), 'Returns array of people');
  assert(peopleRes.body.data.length >= 25, `Has 25+ people in database (count: ${peopleRes.body.data.length})`);
  
  const samplePerson = peopleRes.body.data[0];
  assert(samplePerson.name && samplePerson.linkedin_url, 'Person has name and LinkedIn URL');

  // Test 3: Individual Profile Detail endpoint
  console.log('\n[3/12] Testing Individual Profile Detail...');
  const detailRes = await request('GET', `/api/people/${samplePerson.id}`);
  assert(detailRes.status === 200, 'GET /api/people/:id returns 200');
  assert(detailRes.body.data.id === samplePerson.id, 'Returns correct person ID');
  assert(detailRes.body.data.analysis && detailRes.body.data.analysis.name, 'Profile contains AI analysis');

  // Test 4: Rankings endpoint
  console.log('\n[4/12] Testing Rankings Endpoint...');
  const rankingsRes = await request('GET', '/api/rankings');
  assert(rankingsRes.status === 200, 'GET /api/rankings returns 200');
  assert(Array.isArray(rankingsRes.body.data), 'Returns array of rankings');
  assert(rankingsRes.body.data.length > 0, `Has rankings scored (count: ${rankingsRes.body.data.length})`);

  // Test 5: Re-running Demo Idempotency (Mission 9 requirement)
  console.log('\n[5/12] Testing Demo Idempotency (Duplicate Load)...');
  const initialCount = healthRes.body.people_count;
  const demoRes = await request('POST', '/api/load-demo', {});
  assert(demoRes.status === 200, 'POST /api/load-demo returns 200');
  const healthAfterDemo = await request('GET', '/api/health');
  assert(healthAfterDemo.body.people_count === initialCount, `People count remained constant after reload (${initialCount})`);

  // Test 6: Invalid LinkedIn URL handling (Mission 9 requirement)
  console.log('\n[6/12] Testing Invalid LinkedIn URL Handling...');
  const badLinkedInRes = await request('POST', '/api/people', {
    linkedin_url: 'not-a-valid-url',
    instagram_url: 'https://instagram.com/validuser',
  });
  assert(badLinkedInRes.status === 400, 'Rejects invalid LinkedIn URL with 400');
  assert(badLinkedInRes.body.success === false, 'Returns success: false');

  // Test 7: Invalid Instagram URL handling (Mission 9 requirement)
  console.log('\n[7/12] Testing Invalid Instagram URL Handling...');
  const badInstaRes = await request('POST', '/api/people', {
    linkedin_url: 'https://linkedin.com/in/validuser',
    instagram_url: 'invalid-non-url',
  });
  assert(badInstaRes.status === 400, 'Rejects invalid Instagram URL with 400');

  // Test 8: Missing URLs handling
  console.log('\n[8/12] Testing Missing URLs Handling...');
  const emptyRes = await request('POST', '/api/people', {});
  assert(emptyRes.status === 400, 'Rejects empty payload with 400');

  // Test 9: Duplicate Person submission (Mission 9 requirement)
  console.log('\n[9/12] Testing Duplicate Person Submission...');
  const dupRes = await request('POST', '/api/people', {
    linkedin_url: samplePerson.linkedin_url,
    instagram_url: samplePerson.instagram_url,
  });
  assert(dupRes.status === 200, 'Returns 200 for duplicate person');
  assert(dupRes.body.duplicate === true, 'Correctly flags duplicate: true');
  assert(dupRes.body.data.id === samplePerson.id, 'Returns existing person ID');

  // Test 10: Production SPA Direct Route Reloads (Mission 9 requirement)
  console.log('\n[10/12] Testing Direct Route Reloads on Production Static Build...');
  const routes = ['/', '/profiles', `/profiles/${samplePerson.id}`, '/dating', '/rankings'];
  for (const route of routes) {
    const routeRes = await request('GET', route);
    assert(routeRes.status === 200, `Direct reload on ${route} returns 200`);
    assert(typeof routeRes.body === 'string' && routeRes.body.toLowerCase().includes('<!doctype html'), `${route} serves valid HTML index`);
  }

  // Test 11: 404 handler for missing people
  console.log('\n[11/12] Testing 404 for Nonexistent Person...');
  const notFoundRes = await request('GET', '/api/people/non-existent-uuid-12345');
  assert(notFoundRes.status === 404, 'Returns 404 for unknown person');

  // Test 12: Multi-turn dating conversation endpoint and conversation database
  console.log('\n[12/12] Testing Dating Conversation Execution & History...');
  const personA = peopleRes.body.data[0];
  const personB = peopleRes.body.data[1];
  const dateRes = await request('POST', '/api/date', {
    person_a_id: personA.id,
    person_b_id: personB.id,
  });
  assert(dateRes.status === 200, 'POST /api/date returns 200');
  assert(dateRes.body.success === true, 'Date initiated successfully');
  assert(dateRes.body.data.conversation_id && dateRes.body.data.status === 'dating', 'Returns active conversation ID and dating status');

  // Verify stored conversations contain 8+ turns and 4D compatibility
  const convsRes = await request('GET', '/api/conversations');
  assert(convsRes.status === 200, 'GET /api/conversations returns 200');
  assert(convsRes.body.data.length >= 300, `Contains 300+ completed dates (count: ${convsRes.body.data.length})`);
  const sampleConv = convsRes.body.data[0];
  assert(Array.isArray(sampleConv.messages) && sampleConv.messages.length >= 8, `Sample conversation has 8+ turns (has ${sampleConv.messages.length} messages)`);
  assert(typeof sampleConv.compatibility_score === 'number', `Has valid compatibility score (${sampleConv.compatibility_score}%)`);

  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
