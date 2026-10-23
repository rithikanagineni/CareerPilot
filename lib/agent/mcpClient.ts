// ============================================================
// CareerPilot — MCP Client (Protocol: 2025-11-25)
// Implements proper MCP initialize handshake + session management
// Communicates with the self-hosted CareerPilot MCP server
// via Streamable HTTP transport.
//
// Flow per client instance:
//   1. initialize → receive session ID in response headers
//   2. notifications/initialized → confirm handshake
//   3. tools/list  → verify all 6 tools are available
//   4. tools/call  → invoke specific tool with arguments
//   5. Session ID is sent in subsequent requests via mcp-session-id header
// ============================================================

const MCP_BASE_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3001';
const MCP_PROTOCOL_VERSION = '2025-11-25';

// ─────────────────────────────────────────────────────────────
// Session state — one per Node.js process (server-side agent)
// ─────────────────────────────────────────────────────────────
interface MCPSession {
  sessionId: string;
  initialized: boolean;
  requestCounter: number;
}

let activeSession: MCPSession | null = null;

// ─────────────────────────────────────────────────────────────
// Core JSON-RPC 2.0 request over Streamable HTTP
// ─────────────────────────────────────────────────────────────
interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

async function sendRequest(
  request: JSONRPCRequest,
  sessionId?: string
): Promise<JSONRPCResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch(`${MCP_BASE_URL}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok && response.status !== 200) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch { /* ignore */ }
    throw new Error(`MCP HTTP ${response.status}: ${response.statusText}. Body: ${errorBody}`);
  }

  // Extract session ID from response headers (set during initialize)
  const responseSid = response.headers.get('mcp-session-id');
  if (responseSid && activeSession) {
    activeSession.sessionId = responseSid;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('text/event-stream')) {
    // Parse SSE stream to get result
    const text = await response.text();
    return parseSSEResponse(text, request.id);
  }

  const data = await response.json() as JSONRPCResponse;
  return data;
}

function parseSSEResponse(sseText: string, requestId: string | number): JSONRPCResponse {
  const lines = sseText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const parsed = JSON.parse(line.slice(6)) as JSONRPCResponse;
        // Match by ID or take first result
        if (parsed.id === requestId || parsed.result !== undefined || parsed.error !== undefined) {
          return parsed;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }
  // If no matching response found, try to return any result from stream
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        return JSON.parse(line.slice(6)) as JSONRPCResponse;
      } catch { /* ignore */ }
    }
  }
  throw new Error('No valid JSON-RPC response found in SSE stream');
}

// ─────────────────────────────────────────────────────────────
// MCP Handshake: initialize + notifications/initialized
// ─────────────────────────────────────────────────────────────
async function initializeSession(): Promise<MCPSession> {
  // Step 1: Send initialize request (no session ID — this creates a new session)
  const initRequest: JSONRPCRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        roots: { listChanged: false },
      },
      clientInfo: {
        name: 'careerpilot-agent',
        version: '1.0.0',
      },
    },
  };

  const initResponse = await fetch(`${MCP_BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(initRequest),
  });

  if (!initResponse.ok) {
    throw new Error(`MCP initialize failed: HTTP ${initResponse.status}`);
  }

  // The session ID is returned in the response header
  let sessionId = initResponse.headers.get('mcp-session-id') ?? '';

  const contentType = initResponse.headers.get('content-type') ?? '';
  let initResult: JSONRPCResponse;
  if (contentType.includes('text/event-stream')) {
    const text = await initResponse.text();
    initResult = parseSSEResponse(text, 1);
    // Session ID may also be embedded in SSE headers
    if (!sessionId) {
      // Try to extract from the response object
      const resultData = initResult.result as { sessionId?: string } | undefined;
      sessionId = resultData?.sessionId ?? sessionId;
    }
  } else {
    initResult = await initResponse.json() as JSONRPCResponse;
  }

  if (initResult.error) {
    throw new Error(`MCP initialize error: ${initResult.error.message}`);
  }

  // Re-check header after reading body (some implementations set it per-response)
  const finalSessionId = initResponse.headers.get('mcp-session-id') ?? sessionId;

  if (!finalSessionId) {
    // Server may be running in stateless mode — generate a client-side placeholder
    console.warn('[MCP] No session ID returned from server; continuing without session tracking');
  }

  const session: MCPSession = {
    sessionId: finalSessionId || `client-${Date.now()}`,
    initialized: false,
    requestCounter: 2,
  };

  // Step 2: Send notifications/initialized (fire-and-forget — don't await response)
  const notifyRequest = {
    jsonrpc: '2.0' as const,
    method: 'notifications/initialized',
  };

  fetch(`${MCP_BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(finalSessionId ? { 'mcp-session-id': finalSessionId } : {}),
    },
    body: JSON.stringify(notifyRequest),
  }).catch((e) => console.warn('[MCP] notifications/initialized send failed:', e));

  session.initialized = true;
  console.log(`[MCP] Session initialized: ${session.sessionId}, protocol: ${MCP_PROTOCOL_VERSION}`);
  return session;
}

// ─────────────────────────────────────────────────────────────
// Get or create session
// ─────────────────────────────────────────────────────────────
async function getSession(): Promise<MCPSession> {
  if (activeSession?.initialized) {
    return activeSession;
  }
  activeSession = await initializeSession();
  return activeSession;
}

// Reset session (called on error to force re-initialization)
export function resetMCPSession(): void {
  activeSession = null;
  console.log('[MCP] Session reset — will re-initialize on next call');
}

// ─────────────────────────────────────────────────────────────
// Generic tool caller with auto-initialization
// ─────────────────────────────────────────────────────────────
async function callMCPTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  let session: MCPSession;
  try {
    session = await getSession();
  } catch (initErr) {
    console.error('[MCP] Session initialization failed:', initErr);
    // Reset and try once more
    resetMCPSession();
    session = await getSession();
  }

  const requestId = ++session.requestCounter;
  const request: JSONRPCRequest = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: params,
    },
  };

  let response: JSONRPCResponse;
  try {
    response = await sendRequest(request, session.sessionId);
  } catch (err) {
    // Session may have expired — reset and retry once
    console.warn('[MCP] Tool call failed, resetting session and retrying:', err);
    resetMCPSession();
    session = await getSession();
    requestId === session.requestCounter && ++session.requestCounter;
    const retryRequest = { ...request, id: ++session.requestCounter };
    response = await sendRequest(retryRequest, session.sessionId);
  }

  if (response.error) {
    throw new Error(`MCP tool "${toolName}" error: ${response.error.message}`);
  }

  return response.result;
}

// ─────────────────────────────────────────────────────────────
// tools/list — verify all 6 tools are registered
// ─────────────────────────────────────────────────────────────
export async function mcpListTools(): Promise<string[]> {
  const session = await getSession();
  const response = await sendRequest(
    { jsonrpc: '2.0', id: ++session.requestCounter, method: 'tools/list' },
    session.sessionId
  );
  if (response.error) throw new Error(`tools/list error: ${response.error.message}`);
  const result = response.result as { tools: Array<{ name: string }> };
  return result.tools?.map((t) => t.name) ?? [];
}

// ─────────────────────────────────────────────────────────────
// Named MCP tool callers
// ─────────────────────────────────────────────────────────────

export async function mcpGetCandidateProfile(candidateId: string) {
  return callMCPTool('get_candidate_profile', { candidateId });
}

export async function mcpSearchOpportunities(params: {
  role?: string;
  location?: string;
  skills?: string[];
  experienceLevel?: string;
}) {
  return callMCPTool('search_opportunities', params);
}

export async function mcpAnalyzeMatch(params: {
  candidateId: string;
  opportunityId: string;
}) {
  return callMCPTool('analyze_match', params);
}

export async function mcpAnalyzeSkillGaps(params: {
  currentSkills: string[];
  targetRole: string;
  targetSkills?: string[];
}) {
  return callMCPTool('analyze_skill_gaps', params);
}

export async function mcpCreateCareerPlan(params: {
  careerGoal: string;
  targetRole: string;
  candidateId: string;
  preferredTimeline?: string;
}) {
  return callMCPTool('create_career_plan', params);
}

export async function mcpGenerateInterviewPrep(params: {
  targetRole: string;
  candidateId: string;
}) {
  return callMCPTool('generate_interview_prep', params);
}

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
export async function checkMCPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
