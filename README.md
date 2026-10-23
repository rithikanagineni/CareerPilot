# CareerPilot

> **Turn career goals into your next best action.**

CareerPilot is an AI-powered career agent for students and early-career developers. It is built for the **Alexa+ primary track** of the Amazon Developer Hackathon: Build, Ship, Shape 2026, using a self-hosted MCP server over Streamable HTTP.

---

## Overview

CareerPilot is NOT a generic job listing site or chatbot. It acts as an intelligent career agent:

1. You tell CareerPilot your career goal (e.g., "I want an AI/ML internship in Hyderabad")
2. It uses MCP-powered tools to search opportunities, calculate match scores, and identify skill gaps
3. It creates a personalized action plan with today / 7-day / 30-day goals
4. It prepares you for interviews with role-specific questions

---

## Problem

Students and early-career developers face these challenges:
- Hundreds of generic job listings with no context about their fit
- No clarity on *why* they don't qualify for roles
- No structured path to become a better candidate
- Interview preparation is scattered and not personalized

---

## Solution

CareerPilot uses an AI agent that:
- **Understands** the user's career goal in natural language
- **Searches** matching opportunities using the MCP `search_opportunities` tool
- **Analyzes** match quality using a transparent scoring formula
- **Identifies** skill gaps with priority rankings and learning recommendations
- **Creates** a structured career action plan
- **Generates** role-specific interview preparation

---

## Key Features

- 🔌 **Real MCP Server** — Official `@modelcontextprotocol/sdk`, MCP 2025-11-25, and Streamable HTTP
- ☁️ **Amazon Bedrock** — AI reasoning via Bedrock when AWS credentials and model access are configured
- 🪂 **Explicit fallback mode** — Deterministic responses identify themselves as a demo fallback when Bedrock is not configured or unavailable
- 🎯 **Career Agent** — Intent-based tool selection, not brute-force tool calling
- 📊 **Transparent Match Scoring** — Documented scoring formula (see below)
- 📋 **Personalized Career Plans** — Today / 7-day / 30-day action items
- 🎤 **Interview Prep** — Role-specific technical and behavioral questions
- 🎨 **Career illustration set** — Original local SVG artwork for matching, skills, planning, interviews, profiles, and more
- 🔍 **22+ Opportunities** — Realistic demo dataset across 6 domains and 5 cities
- 🎙️ **Voice Input** — Browser speech recognition (graceful fallback to text)
- 🔐 **Career accounts** — Sign up with a detailed profile, sign in, and manage a local demo session

### Local demo authentication

The home page is public and offers login; dashboard, AI agent, opportunities, and profile routes require an active account session. Registration is a three-step flow that collects account, career, education, and skills details before opening the new user's dashboard.

Accounts created locally are stored in the ignored `.careerpilot-auth.json` file in the project working directory. That file is generated only when the local app registers an account and must never be committed or included in a submission. Passwords are scrypt-hashed and session cookies are HTTP-only. This file-backed implementation is for a single-instance demo only: use a managed database and production authentication/session infrastructure before deploying for real users or running multiple app instances.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                         │
│                   CareerPilot Web UI                        │
│           (Next.js + TypeScript + Tailwind)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                         │
│  /api/agent  /api/mcp  /api/profile  /api/opportunities     │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴──────────────────┐
           │                                  │
           ▼                                  ▼
┌──────────────────────┐          ┌───────────────────────────┐
│   Career Agent       │          │     AI Provider Layer     │
│   lib/agent/         │          │     lib/ai/               │
│   - Intent detection │          │   ┌─────────────────────┐ │
│   - Tool selection   │          │   │  Amazon Bedrock      │ │
│   - Context tracking │          │   │  (when configured)   │ │
└──────────┬───────────┘          │   └─────────────────────┘ │
           │                      │   ┌─────────────────────┐ │
           │ MCP Streamable HTTP  │   │  Fallback Provider   │ │
           ▼                      │   │  (demo mode)         │ │
┌──────────────────────┐          │   └─────────────────────┘ │
│   MCP Server         │          └───────────────────────────┘
│   mcp/server.ts      │
│   Port: 3001         │
│   Protocol: 2025-11-25│
│   Transport: HTTP    │
├──────────────────────┤
│   MCP Tools:         │
│   get_candidate_profile│
│   search_opportunities │
│   analyze_match      │
│   analyze_skill_gaps │
│   create_career_plan │
│   generate_interview_prep│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  In-Memory Data      │
│  lib/data/           │
│  - 22 opportunities  │
│  - 3 candidates      │
└──────────────────────┘
```

---

## Alexa+ Primary Track

CareerPilot implements the Alexa+ primary track using a self-hosted MCP server. The Career Agent communicates with that server over Streamable HTTP and invokes registered tools in response to user intent.

### MCP Server

- **SDK**: Official `@modelcontextprotocol/sdk` v1.32.1
- **Protocol version**: MCP 2025-11-25
- **Transport**: **Streamable HTTP** via `StreamableHTTPServerTransport`
- **Port**: 3001 by default (configurable via `MCP_PORT`)
- **Endpoint**: `POST /mcp` on the self-hosted server
- **Sessions**: The server creates an MCP session during `initialize`, reuses its transport for subsequent requests, and closes idle sessions.

### MCP Endpoint

```
POST http://localhost:3001/mcp
```

JSON-RPC 2.0 format, SSE/streaming response supported.

### MCP Tools Registered

| Tool | Purpose |
|------|---------|
| `get_candidate_profile` | Retrieve candidate education, skills, projects, career goals |
| `search_opportunities` | Search 22+ internships/jobs by role, location, skills |
| `analyze_match` | Calculate match % using transparent scoring formula |
| `analyze_skill_gaps` | Identify missing skills with priority and learning recommendations |
| `create_career_plan` | Generate today/7-day/30-day personalized action plans |
| `generate_interview_prep` | Role-specific technical, behavioral, and project questions |

### How the Agent Uses MCP Tools

The Career Agent detects user intent and selects tools intelligently:

| User Intent | Tools Called |
|-------------|--------------|
| "Find AI internships in Hyderabad" | `get_candidate_profile` → `search_opportunities` → `analyze_skill_gaps` |
| "Why am I a good match?" | `get_candidate_profile` → `analyze_match` |
| "What skills am I missing?" | `get_candidate_profile` → `analyze_skill_gaps` |
| "Create my 30-day plan" | `get_candidate_profile` → `create_career_plan` |
| "Prepare me for an interview" | `get_candidate_profile` → `generate_interview_prep` |

### Simulated Alexa+ Experience

The `/agent` page demonstrates the Alexa+ experience:
- Conversational agent interface
- Real-time activity indicators showing MCP tool execution
- Suggested prompts (voice-style interaction)
- Voice input via browser Speech Recognition API (with graceful fallback)
- Rich result panels for opportunities, match scores, skill gaps, and plans

---

## Amazon Bedrock

CareerPilot uses Amazon Bedrock for AI reasoning and natural-language generation when AWS credentials and access to the selected model are configured.

- **SDK**: `@aws-sdk/client-bedrock-runtime`
- **Default model**: `anthropic.claude-haiku-4-5-20251001-v1:0` (configurable using `BEDROCK_MODEL_ID`; availability depends on AWS region and account)
- **Architecture**: Clean provider abstraction at `lib/ai/`
- **Credentials**: Supplied through environment variables; no AWS credentials are hardcoded or returned to the client.

### How Bedrock Is Used

When AWS credentials are configured:
```
User message
    → Career Agent (intent detection + tool selection)
    → MCP tools called (search, analyze, etc.)
    → Tool results assembled into system context
    → Amazon Bedrock (Claude via InvokeModel API) generates response
    → Conversational response returned to user
```

### Required IAM Permissions

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0"
}
```

### Transparent Fallback

If Bedrock credentials are not configured, or a Bedrock generation request fails:
- A deterministic fallback response is returned instead
- The response identifies fallback mode as `CareerPilot Demo (Fallback — not Amazon Bedrock)`
- The fallback uses structured templates for responses
- The agent continues to return its MCP-derived career results alongside the fallback response when available

---

## Match Scoring Formula

The `analyze_match` tool uses a transparent, deterministic formula:

```
skill_score    = (matched_required_skills / total_required_skills) × 50 pts
location_score = location_match ? 20 : 5
role_score     = (target_role_terms_matched / total_terms) × 20 pts
project_score  = relevant_projects > 0 ? 10 : 0
─────────────────────────────────────────────
Total (max): 100 pts (capped)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| MCP Server | @modelcontextprotocol/sdk v1.32.1 |
| MCP Transport | Streamable HTTP (2025-11-25) |
| AI Provider | Amazon Bedrock (Claude Haiku 4.5 by default via bedrock-runtime) |
| Fallback AI | Deterministic response templates |
| Runtime | Node.js v24 |
| Data Layer | In-memory demo data (PostgreSQL-ready) |

---

## Local Setup

### Prerequisites

- Node.js 20+ (tested on v24)
- npm 10+

### Installation

```bash
git clone <your-repo-url>
cd CareerPilot
npm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MCP server URL and listen port
MCP_SERVER_URL=http://localhost:3001
MCP_PORT=3001

# Optional — Amazon Bedrock (use credentials configured securely for your environment)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```

Set AWS credentials using a secure local method; never commit `.env.local` or real AWS credentials. Without Bedrock credentials, the app runs in a clearly identified deterministic fallback mode. The selected model must be enabled for your AWS account and region.

---

## Running the Application

### Terminal 1 — Start the MCP Server

```bash
npm run mcp
```

Expected output:
```
╔══════════════════════════════════════════════════╗
║         CareerPilot MCP Server v1.0.0            ║
║  Protocol: MCP 2025-11-25 (Streamable HTTP)      ║
╠══════════════════════════════════════════════════╣
║  MCP endpoint:  http://localhost:3001/mcp         ║
║  Health check:  http://localhost:3001/health      ║
╚══════════════════════════════════════════════════╝
```

### Terminal 2 — Start the Next.js Frontend

```bash
npm run dev
```

Open http://localhost:3000

### MCP verification

With Terminal 1's MCP server running:

```bash
npm run test
```

This runs the tool unit tests and MCP HTTP smoke test. The smoke test executes the protocol workflow: `initialize` → session creation → `notifications/initialized` → `tools/list` → `tools/call`. It checks all six tools and session error cases. For a protocol-only run use `npm run test:mcp`; to run only tool unit tests use `npm run test:unit`.

The MCP client must complete initialization and use the returned session ID before listing or calling tools. A standalone `tools/call` request without that handshake is not a valid way to test this server.

---

## Demo Flow

The demo flow:

1. **Open** http://localhost:3000 — show the public landing page.
2. Select **Login** and register a local demo account using the three-step form, or sign in with an existing account.
3. Confirm registration/sign-in opens that account's dashboard and the top navigation offers Dashboard, AI Agent, Opportunities, Profile, and Sign out.
4. Open AI Agent and type: "I want an AI/ML internship in Hyderabad."
5. Watch the activity panel for the real MCP tools selected for the request.
6. Review the returned opportunities, match analysis, and skill gaps. Results vary with the candidate profile and requested criteria.
7. Ask for a career plan and interview preparation, and review the generated results.
8. Open Opportunities and Profile to demonstrate the signed-in account context, then sign out.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_SERVER_URL` | No | MCP server URL (default: http://localhost:3001) |
| `MCP_PORT` | No | MCP server port (default: 3001) |
| `AWS_REGION` | For Bedrock | AWS region (e.g., us-east-1) |
| `AWS_ACCESS_KEY_ID` | For Bedrock | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | For Bedrock | AWS secret key |
| `BEDROCK_MODEL_ID` | No | Bedrock model ID (default: `anthropic.claude-haiku-4-5-20251001-v1:0`; availability depends on the configured region/account) |

---

## Hackathon Track

**Primary Track**: Alexa+
- ✓ Self-hosted MCP server
- ✓ Official @modelcontextprotocol/sdk
- ✓ MCP 2025-11-25 protocol
- ✓ Streamable HTTP transport
- ✓ 6 MCP tools registered and used
- ✓ Agent actually calls MCP tools
- ✓ Simulated Alexa+ web experience

**AWS Builder Mini Challenge**
- ✓ Amazon Bedrock integration (@aws-sdk/client-bedrock-runtime)
- ✓ Environment variable configuration (no hardcoded credentials)
- ✓ Transparent fallback clearly labeled as non-Bedrock
- ✓ Clean AI provider abstraction enabling easy Bedrock activation

---

## Limitations

- **Local demo account storage**: Registered account/profile data is persisted in the git-ignored `.careerpilot-auth.json` file on the local server. It is not multi-instance or production-ready authentication/storage. Updates to built-in demo profiles are in-memory and reset on server restart.
- **No real job scraping**: Opportunity data is a realistic demo dataset. Real job APIs (LinkedIn, Naukri) could be integrated as MCP tools.
- **Fallback mode**: Without Bedrock credentials, AI responses are deterministic templates rather than LLM-generated.
- **Voice input**: Speech Recognition is browser-dependent and not supported in all environments.

---

## Future Improvements

- PostgreSQL integration for profile persistence
- Real-time job scraping via additional MCP tools
- Application tracking with status updates
- Email/calendar integration for deadline reminders
- Resume parser MCP tool
- Production authentication and managed multi-instance storage
- Analytics dashboard for career progress over time
