#!/usr/bin/env node
// ============================================================
// CareerPilot — MCP Server (Protocol: 2025-11-25)
// Implements MCP Streamable HTTP with proper session management
// Uses @modelcontextprotocol/sdk v1.32.1
//
// Session lifecycle:
//   1. Client sends POST /mcp with initialize request (no session ID)
//   2. Server creates new McpServer + StreamableHTTPServerTransport
//   3. Session ID returned in response header, stored in session map
//   4. Subsequent requests include mcp-session-id header → reuse transport
//   5. DELETE /mcp terminates the session
//   6. GET /mcp opens an SSE stream for server-initiated messages
//   7. Idle sessions are cleaned up automatically
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { z } from 'zod';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'node:crypto';

// Tool implementations
import {
  getCandidateProfile,
  searchOpportunities,
  analyzeMatch,
  analyzeSkillGaps,
  createCareerPlan,
  generateInterviewPrep,
} from '../lib/mcp/tools.js';

import { DEMO_CANDIDATES } from '../lib/data/candidates.js';
import { getOpportunityById } from '../lib/data/opportunities.js';

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;

// ─────────────────────────────────────────────────────────────
// Session management
// Each session has its own McpServer + StreamableHTTPServerTransport
// ─────────────────────────────────────────────────────────────
const MAX_SESSIONS = 100;
const IDLE_MS = 10 * 60 * 1000; // 10 minutes

interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  open: number;
  lastActive: number;
}

const sessions = new Map<string, Session>();

// Track open response connections to avoid treating active as idle
function trackResponse(session: Session, res: ServerResponse): void {
  if (!res.socket || res.destroyed) return;
  session.open++;
  res.on('close', () => {
    session.open--;
    session.lastActive = Date.now();
  });
}

// Periodic idle-session cleanup
setInterval(() => {
  const cutoff = Date.now() - IDLE_MS;
  for (const [id, session] of sessions.entries()) {
    if (session.open === 0 && session.lastActive < cutoff) {
      console.log(`[MCP] Cleaning up idle session: ${id}`);
      session.transport.close().catch(console.error);
      sessions.delete(id);
    }
  }
}, 60_000).unref();

// ─────────────────────────────────────────────────────────────
// Factory: create a new McpServer + register all 6 tools
// Called once per new client session
// ─────────────────────────────────────────────────────────────
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'careerpilot',
    version: '1.0.0',
  });

  // ── Tool 1: get_candidate_profile ──────────────────────────
  server.tool(
    'get_candidate_profile',
    'Retrieve a candidate career profile including education, skills, projects, experience, and career goals.',
    {
      candidateId: z
        .string()
        .describe('The candidate ID. Use "candidate-001" for the default demo profile.'),
    },
    async ({ candidateId }) => {
      const profile = getCandidateProfile(candidateId);
      if (!profile) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: `Candidate with ID "${candidateId}" not found.`,
              availableIds: DEMO_CANDIDATES.map((c) => c.id),
            }),
          }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(profile, null, 2) }],
      };
    }
  );

  // ── Tool 2: search_opportunities ───────────────────────────
  server.tool(
    'search_opportunities',
    'Search internship and job opportunities from the CareerPilot dataset based on role, location, skills, and experience level.',
    {
      role: z.string().optional().describe('Target role, e.g. "AI/ML Intern"'),
      location: z.string().optional().describe('Preferred location, e.g. "Hyderabad"'),
      skills: z.array(z.string()).optional().describe('Candidate skills to match against'),
      experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid']).optional().describe('Experience level'),
    },
    async ({ role, location, skills, experienceLevel }) => {
      const results = searchOpportunities({ role, location, skills, experienceLevel });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ count: results.length, opportunities: results }, null, 2),
        }],
      };
    }
  );

  // ── Tool 3: analyze_match ───────────────────────────────────
  server.tool(
    'analyze_match',
    'Analyze how well a candidate matches a specific opportunity. Returns match percentage, matching skills, missing skills, strengths, and a plain-language explanation.',
    {
      candidateId: z.string().describe('The candidate ID to analyze'),
      opportunityId: z.string().describe('The opportunity ID to analyze against'),
    },
    async ({ candidateId, opportunityId }) => {
      const profile = getCandidateProfile(candidateId);
      if (!profile) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Candidate "${candidateId}" not found` }) }],
          isError: true,
        };
      }
      const opportunity = getOpportunityById(opportunityId);
      if (!opportunity) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Opportunity "${opportunityId}" not found` }) }],
          isError: true,
        };
      }
      const result = analyzeMatch({ candidateProfile: profile, opportunity });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ── Tool 4: analyze_skill_gaps ─────────────────────────────
  server.tool(
    'analyze_skill_gaps',
    'Identify the skill gaps between a candidate\'s current skills and a target role.',
    {
      currentSkills: z.array(z.string()).describe('List of candidate\'s current skills'),
      targetRole: z.string().describe('The target role, e.g. "AI/ML Intern"'),
      targetSkills: z.array(z.string()).optional().describe('Optional list of specific skills required'),
    },
    async ({ currentSkills, targetRole, targetSkills }) => {
      const result = analyzeSkillGaps({ currentSkills, targetRole, targetSkills });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ── Tool 5: create_career_plan ─────────────────────────────
  server.tool(
    'create_career_plan',
    'Create a personalized career action plan with immediate actions, 7-day plan, 30-day plan, application strategy, and interview preparation tips.',
    {
      careerGoal: z.string().describe('The candidate\'s career goal'),
      targetRole: z.string().describe('Target job role, e.g. "AI/ML Intern"'),
      candidateId: z.string().describe('Candidate ID to derive skill gaps from'),
      preferredTimeline: z.string().optional().describe('Preferred timeline, e.g. "3 months"'),
    },
    async ({ careerGoal, targetRole, candidateId, preferredTimeline }) => {
      const profile = getCandidateProfile(candidateId);
      if (!profile) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Candidate "${candidateId}" not found` }) }],
          isError: true,
        };
      }
      const skillGaps = analyzeSkillGaps({ currentSkills: profile.skills, targetRole });
      const plan = createCareerPlan({ careerGoal, targetRole, skillGaps, preferredTimeline });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(plan, null, 2) }],
      };
    }
  );

  // ── Tool 6: generate_interview_prep ────────────────────────
  server.tool(
    'generate_interview_prep',
    'Generate role-specific interview preparation including technical questions, behavioral questions, and recommended preparation topics.',
    {
      targetRole: z.string().describe('Target role for interview preparation'),
      candidateId: z.string().describe('Candidate ID to personalize questions'),
    },
    async ({ targetRole, candidateId }) => {
      const profile = getCandidateProfile(candidateId);
      if (!profile) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Candidate "${candidateId}" not found` }) }],
          isError: true,
        };
      }
      const skillGaps = analyzeSkillGaps({ currentSkills: profile.skills, targetRole });
      const prep = generateInterviewPrep({
        targetRole,
        candidateSkills: profile.skills,
        missingSkills: skillGaps.missingSkills.map((s) => s.skill),
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(prep, null, 2) }],
      };
    }
  );

  return server;
}

// ─────────────────────────────────────────────────────────────
// HTTP Request Handlers
// ─────────────────────────────────────────────────────────────

async function handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Parse JSON body
  let body: unknown;
  try {
    body = await parseBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }));
    return;
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    // Existing session — reuse transport
    const session = sessions.get(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
      return;
    }
    trackResponse(session, res);
    await session.transport.handleRequest(req, res, body);
  } else if (isInitializeRequest(body)) {
    // New session — create server + transport
    if (sessions.size >= MAX_SESSIONS) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Too many open sessions' }, id: null }));
      return;
    }

    const eventStore = new InMemoryEventStore();
    const mcpServer = createMcpServer();
    let newSessionId: string;

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      eventStore,
      onsessioninitialized: (sid) => {
        newSessionId = sid;
        sessions.set(sid, { server: mcpServer, transport, open: 0, lastActive: Date.now() });
        console.log(`[MCP] New session initialized: ${sid} (total: ${sessions.size})`);
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && sessions.has(sid)) {
        console.log(`[MCP] Transport closed, removing session: ${sid}`);
        sessions.delete(sid);
      }
    };

    // Connect server to transport before handling request
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, body);
  } else {
    // No session ID and not an initialize request
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Missing mcp-session-id header for non-initialize request' },
      id: null,
    }));
  }
}

async function handleGet(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Missing mcp-session-id' }, id: null }));
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
    return;
  }
  trackResponse(session, res);
  await session.transport.handleRequest(req, res);
}

async function handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Missing mcp-session-id' }, id: null }));
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
    return;
  }
  console.log(`[MCP] Session termination requested: ${sessionId}`);
  trackResponse(session, res);
  await session.transport.handleRequest(req, res);
}

// ─────────────────────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────────────────────
const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, mcp-session-id, Last-Event-ID');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      server: 'careerpilot-mcp',
      version: '1.0.0',
      protocol: '2025-11-25',
      transport: 'streamable-http',
      activeSessions: sessions.size,
      tools: [
        'get_candidate_profile',
        'search_opportunities',
        'analyze_match',
        'analyze_skill_gaps',
        'create_career_plan',
        'generate_interview_prep',
      ],
    }));
    return;
  }

  // MCP endpoint
  if (url.pathname === '/mcp') {
    try {
      if (req.method === 'POST') {
        await handlePost(req, res);
      } else if (req.method === 'GET') {
        await handleGet(req, res);
      } else if (req.method === 'DELETE') {
        await handleDelete(req, res);
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    } catch (err) {
      console.error('[MCP] Unhandled error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal MCP server error' }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: url.pathname }));
});

// ─────────────────────────────────────────────────────────────
// Utility: parse JSON body from IncomingMessage
// ─────────────────────────────────────────────────────────────
function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : undefined);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║          CareerPilot MCP Server v1.0.0               ║
║  Protocol : MCP 2025-11-25                           ║
║  Transport: Streamable HTTP (session-aware)          ║
╠══════════════════════════════════════════════════════╣
║  Endpoints                                           ║
║    POST   http://localhost:${PORT}/mcp (initialize + tools/call)║
║    GET    http://localhost:${PORT}/mcp (SSE stream)          ║
║    DELETE http://localhost:${PORT}/mcp (terminate session)   ║
║    GET    http://localhost:${PORT}/health                    ║
╠══════════════════════════════════════════════════════╣
║  Tools registered (6)                                ║
║    ✓ get_candidate_profile                           ║
║    ✓ search_opportunities                            ║
║    ✓ analyze_match                                   ║
║    ✓ analyze_skill_gaps                              ║
║    ✓ create_career_plan                              ║
║    ✓ generate_interview_prep                         ║
╚══════════════════════════════════════════════════════╝
`);
});

export default httpServer;
