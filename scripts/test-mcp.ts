// ============================================================
// CareerPilot — MCP Protocol Test
// Tests the real MCP HTTP endpoint end-to-end:
//   - initialize handshake
//   - notifications/initialized
//   - tools/list (verifies all 6 tools)
//   - tools/call for each of the 6 tools
//
// Requires the MCP server to be running: npm run mcp
// Run as part of npm run test, or directly with npm run test:mcp
// ============================================================

const MCP_BASE_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3001';
const MCP_PROTOCOL_VERSION = '2025-11-25';

let passed = 0;
let failed = 0;
let sessionId: string = '';
let requestId = 0;

function nextId(): number {
  return ++requestId;
}

async function assert(condition: boolean, message: string): Promise<void> {
  if (!condition) throw new Error(message);
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────
async function post(body: unknown, sid?: string): Promise<{ response: Response; data: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sid) headers['mcp-session-id'] = sid;

  const response = await fetch(`${MCP_BASE_URL}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  let data: unknown;

  if (contentType.includes('text/event-stream')) {
    const text = await response.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          data = JSON.parse(line.slice(6));
          break;
        } catch { /* skip */ }
      }
    }
  } else {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  return { response, data };
}

type JSONRPCResult = { jsonrpc: string; id?: unknown; result?: unknown; error?: { message: string } };

function asRPC(data: unknown): JSONRPCResult {
  return data as JSONRPCResult;
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
console.log('\n══════════════════════════════════════════════════');
console.log(' CareerPilot MCP Protocol Test');
console.log(` Server: ${MCP_BASE_URL}`);
console.log('══════════════════════════════════════════════════\n');

// ── 1. Health Check ──────────────────────────────────────────
console.log('▶ Health Check');
await test('GET /health returns 200', async () => {
  const res = await fetch(`${MCP_BASE_URL}/health`);
  await assert(res.ok, `Expected 200, got ${res.status}`);
  const body = await res.json() as { status: string; protocol: string; tools: string[] };
  await assert(body.status === 'ok', `Expected status ok, got ${body.status}`);
  await assert(body.protocol === MCP_PROTOCOL_VERSION, `Expected protocol ${MCP_PROTOCOL_VERSION}, got ${body.protocol}`);
  await assert(Array.isArray(body.tools), 'Tools should be an array');
  await assert(body.tools.length === 6, `Expected 6 tools, got ${body.tools.length}`);
  console.log(`    Protocol: ${body.protocol}, Tools: ${body.tools.join(', ')}`);
});

// ── 2. Initialize Handshake ──────────────────────────────────
console.log('\n▶ MCP Initialize Handshake');
await test('POST /mcp initialize creates session', async () => {
  const { response, data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { roots: { listChanged: false } },
      clientInfo: { name: 'careerpilot-test', version: '1.0.0' },
    },
  });

  await assert(response.status === 200, `Expected 200, got ${response.status}`);
  
  // Session ID should be in response header
  const sid = response.headers.get('mcp-session-id');
  await assert(!!sid, 'mcp-session-id header should be set in initialize response');
  
  sessionId = sid!;
  console.log(`    Session ID: ${sessionId}`);

  const rpc = asRPC(data);
  await assert(rpc.result !== undefined, `Initialize should return result, got: ${JSON.stringify(data)}`);
  
  const result = rpc.result as { protocolVersion?: string; capabilities?: unknown; serverInfo?: { name: string } };
  await assert(!!result.serverInfo?.name, 'Server info should include name');
  console.log(`    Server: ${result.serverInfo?.name}, Protocol: ${result.protocolVersion}`);
});

await test('notifications/initialized is accepted', async () => {
  const { response } = await post({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }, sessionId);
  
  // Notifications are fire-and-forget, accept 200 or 202
  await assert(
    response.status === 200 || response.status === 202 || response.status === 204,
    `Expected 2xx for notification, got ${response.status}`
  );
});

// ── 3. tools/list ────────────────────────────────────────────
console.log('\n▶ MCP tools/list');
const EXPECTED_TOOLS = [
  'get_candidate_profile',
  'search_opportunities',
  'analyze_match',
  'analyze_skill_gaps',
  'create_career_plan',
  'generate_interview_prep',
];

let listedTools: string[] = [];

await test('tools/list returns all 6 tools', async () => {
  const { response, data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/list',
  }, sessionId);

  await assert(response.status === 200, `Expected 200, got ${response.status}`);
  const rpc = asRPC(data);
  await assert(!rpc.error, `tools/list error: ${rpc.error?.message}`);
  
  const result = rpc.result as { tools: Array<{ name: string; description: string }> };
  await assert(Array.isArray(result.tools), 'tools/list result should have tools array');
  
  listedTools = result.tools.map((t) => t.name);
  await assert(listedTools.length === 6, `Expected 6 tools, got ${listedTools.length}: ${listedTools.join(', ')}`);
  
  for (const expected of EXPECTED_TOOLS) {
    await assert(listedTools.includes(expected), `Missing tool: ${expected}`);
  }
  console.log(`    Tools: ${listedTools.join(', ')}`);
});

// ── 4. Tool: get_candidate_profile ───────────────────────────
console.log('\n▶ Tool: get_candidate_profile');
await test('returns profile for candidate-001', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: { name: 'get_candidate_profile', arguments: { candidateId: 'candidate-001' } },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ type: string; text: string }> };
  await assert(Array.isArray(result.content), 'Result should have content array');
  await assert(result.content[0]?.type === 'text', 'Content type should be text');
  
  const profile = JSON.parse(result.content[0].text);
  await assert(profile.name === 'Priya Sharma', `Expected Priya Sharma, got ${profile.name}`);
  await assert(Array.isArray(profile.skills), 'Profile should have skills array');
  console.log(`    Name: ${profile.name}, Skills: ${profile.skills.slice(0, 3).join(', ')}...`);
});

await test('returns error for unknown candidate', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: { name: 'get_candidate_profile', arguments: { candidateId: 'unknown-999' } },
  }, sessionId);

  const rpc = asRPC(data);
  const result = rpc.result as { isError?: boolean; content: Array<{ text: string }> };
  await assert(result.isError === true, 'Unknown candidate should return isError: true');
});

// ── 5. Tool: search_opportunities ────────────────────────────
console.log('\n▶ Tool: search_opportunities');
await test('finds AI/ML opportunities in Hyderabad', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: {
      name: 'search_opportunities',
      arguments: { role: 'AI/ML', location: 'Hyderabad' },
    },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ text: string }> };
  const payload = JSON.parse(result.content[0].text);
  await assert(payload.count > 0, `Expected > 0 results, got ${payload.count}`);
  await assert(Array.isArray(payload.opportunities), 'Should return opportunities array');
  
  const opp = payload.opportunities[0];
  await assert(!!opp.company, 'Opportunity should have company');
  await assert(!!opp.role, 'Opportunity should have role');
  console.log(`    Found ${payload.count} opportunities. First: ${opp.company} — ${opp.role}`);
});

// ── 6. Tool: analyze_match ───────────────────────────────────
console.log('\n▶ Tool: analyze_match');
await test('calculates match for candidate-001 vs opp-001', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: {
      name: 'analyze_match',
      arguments: { candidateId: 'candidate-001', opportunityId: 'opp-001' },
    },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ text: string }> };
  const match = JSON.parse(result.content[0].text);
  await assert(typeof match.matchPercentage === 'number', 'Should return matchPercentage');
  await assert(match.matchPercentage >= 0 && match.matchPercentage <= 100, `Match ${match.matchPercentage} out of range`);
  await assert(Array.isArray(match.matchingSkills), 'Should return matchingSkills');
  await assert(!!match.explanation, 'Should return explanation');
  console.log(`    Match: ${match.matchPercentage}%, Skills: ${match.matchingSkills.slice(0, 3).join(', ')}`);
});

// ── 7. Tool: analyze_skill_gaps ──────────────────────────────
console.log('\n▶ Tool: analyze_skill_gaps');
await test('identifies skill gaps for AI/ML Intern', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: {
      name: 'analyze_skill_gaps',
      arguments: {
        currentSkills: ['Python', 'SQL'],
        targetRole: 'AI/ML Intern',
      },
    },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ text: string }> };
  const gap = JSON.parse(result.content[0].text);
  await assert(typeof gap.overallReadiness === 'number', 'Should return overallReadiness');
  await assert(gap.overallReadiness < 100, `Readiness should be < 100 for partial skills, got ${gap.overallReadiness}`);
  await assert(Array.isArray(gap.missingSkills), 'Should return missingSkills');
  await assert(gap.missingSkills.length > 0, 'Should identify missing skills');
  console.log(`    Readiness: ${gap.overallReadiness}%, Missing: ${gap.missingSkills.slice(0, 3).map((s: { skill: string }) => s.skill).join(', ')}`);
});

// ── 8. Tool: create_career_plan ──────────────────────────────
console.log('\n▶ Tool: create_career_plan');
await test('creates personalized career plan', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: {
      name: 'create_career_plan',
      arguments: {
        careerGoal: 'Secure an AI/ML internship at a top tech company',
        targetRole: 'AI/ML Intern',
        candidateId: 'candidate-001',
      },
    },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ text: string }> };
  const plan = JSON.parse(result.content[0].text);
  await assert(Array.isArray(plan.immediateActions) && plan.immediateActions.length > 0, 'Should have immediateActions');
  await assert(Array.isArray(plan.sevenDayPlan) && plan.sevenDayPlan.length > 0, 'Should have sevenDayPlan');
  await assert(Array.isArray(plan.thirtyDayPlan) && plan.thirtyDayPlan.length > 0, 'Should have thirtyDayPlan');
  console.log(`    Plan: ${plan.immediateActions.length} immediate, ${plan.sevenDayPlan.length} weekly, ${plan.thirtyDayPlan.length} monthly actions`);
});

// ── 9. Tool: generate_interview_prep ─────────────────────────
console.log('\n▶ Tool: generate_interview_prep');
await test('generates interview preparation questions', async () => {
  const { data } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: {
      name: 'generate_interview_prep',
      arguments: {
        targetRole: 'AI/ML Intern',
        candidateId: 'candidate-001',
      },
    },
  }, sessionId);

  const rpc = asRPC(data);
  await assert(!rpc.error, `Tool error: ${rpc.error?.message}`);
  
  const result = rpc.result as { content: Array<{ text: string }> };
  const prep = JSON.parse(result.content[0].text);
  await assert(Array.isArray(prep.technicalQuestions) && prep.technicalQuestions.length > 0, 'Should have technicalQuestions');
  await assert(Array.isArray(prep.behavioralQuestions) && prep.behavioralQuestions.length > 0, 'Should have behavioralQuestions');
  await assert(Array.isArray(prep.preparationTopics) && prep.preparationTopics.length > 0, 'Should have preparationTopics');
  console.log(`    Questions: ${prep.technicalQuestions.length} technical, ${prep.behavioralQuestions.length} behavioral`);
});

// ── 10. Unknown session handling ─────────────────────────────
console.log('\n▶ Session Edge Cases');
await test('unknown session ID returns 404', async () => {
  const { response } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/list',
  }, 'invalid-session-xyz-999');
  
  await assert(response.status === 404, `Expected 404 for unknown session, got ${response.status}`);
});

await test('non-initialize without session ID returns 400', async () => {
  const { response } = await post({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/list',
  });
  
  await assert(response.status === 400, `Expected 400 for missing session ID, got ${response.status}`);
});

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════');
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════');

if (failed > 0) {
  console.error('\n❌ Some MCP tests failed. Check the MCP server is running: npm run mcp\n');
  process.exitCode = 1;
} else {
  console.log('\n✅ All MCP protocol tests passed!\n');
  process.exitCode = 0;
}
}

runTests().catch((e) => {
  console.error('Fatal error:', e);
  process.exitCode = 1;
});
