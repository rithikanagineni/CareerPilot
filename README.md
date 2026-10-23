# CareerPilot

> **Turn career goals into your next best action.**

CareerPilot is an AI-powered career agent for students and early-career developers. It is built for the **Alexa+ primary track** of the Amazon Developer Hackathon: **Build, Ship, Shape 2026**, using a self-hosted MCP server over Streamable HTTP.

---

## 🚀 Overview

CareerPilot is **not** a generic job listing site or chatbot. It acts as an intelligent career agent that turns a user's career goal into a structured path forward.

### How it works

1. You tell CareerPilot your career goal.
   - Example: *"I want an AI/ML internship in Hyderabad."*
2. The Career Agent understands the intent and selects the appropriate MCP tools.
3. MCP tools search opportunities, retrieve the candidate profile, calculate match scores, and identify skill gaps.
4. CareerPilot explains **why** an opportunity matches and what the candidate is missing.
5. It creates a personalized **today / 7-day / 30-day career action plan**.
6. It generates role-specific interview preparation.

The goal is simple:

> **Discover → Match → Understand → Improve → Prepare**

---

## 🎯 Problem

Students and early-career developers often face:

- Hundreds of generic job listings with no context about their fit
- No clarity on **why** they qualify or don't qualify
- Difficulty identifying the most important skill gaps
- No structured path for improving their profile
- Interview preparation that is scattered and not personalized

CareerPilot addresses these problems by combining opportunity discovery, transparent matching, skill-gap analysis, career planning, and interview preparation into one agentic workflow.

---

## 💡 Solution

CareerPilot uses an AI agent that:

- **Understands** career goals expressed in natural language
- **Retrieves** the candidate's profile and context
- **Searches** matching opportunities using MCP tools
- **Explains** match quality using a transparent scoring formula
- **Identifies** skill gaps with priorities and learning recommendations
- **Creates** a personalized career action plan
- **Generates** role-specific technical and behavioral interview preparation

Unlike a conventional chatbot, CareerPilot uses an agent workflow where the user's intent determines which tools are executed.

---

# ✨ Key Features

- 🔌 **Real MCP Server** — Official `@modelcontextprotocol/sdk`, MCP 2025-11-25, and Streamable HTTP
- ☁️ **Amazon Bedrock** — AI reasoning via Amazon Bedrock when AWS credentials and model access are configured
- 🪂 **Explicit Fallback Mode** — Deterministic responses clearly identify when Bedrock is unavailable
- 🎯 **Career Agent** — Intent-based tool selection instead of brute-force tool calling
- 📊 **Transparent Match Scoring** — Explainable 100-point matching formula
- 📋 **Personalized Career Plans** — Today / 7-day / 30-day action items
- 🎤 **Interview Preparation** — Role-specific technical, behavioral, and project questions
- 🎨 **Career Illustrations** — Local SVG artwork for matching, skills, planning, interviews, profiles, and more
- 🔍 **22+ Opportunities** — Realistic demo opportunities across multiple domains and cities
- 🎙️ **Voice Input** — Browser Speech Recognition with graceful text fallback
- 🔐 **Career Accounts** — Local demo registration, login, profile, and session management

---

## 🔐 Local Demo Authentication

The home page is public and provides login/registration. Dashboard, AI Agent, Opportunities, and Profile routes require an active account session.

Registration uses a three-step flow collecting:

- Account information
- Career information
- Education
- Skills and experience

Accounts created locally are stored in the git-ignored `.careerpilot-auth.json` file in the project working directory.

**Important security notes:**

- `.careerpilot-auth.json` must never be committed or included in the hackathon submission.
- Passwords are scrypt-hashed.
- Session cookies are HTTP-only.
- The file-backed implementation is intended only for a single-instance demonstration.
- Production deployment should use managed database and authentication/session infrastructure.

---

# 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                         │
│                   CareerPilot Web UI                        │
│           Next.js + TypeScript + Tailwind CSS              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                         │
│  /api/agent  /api/mcp  /api/profile  /api/opportunities     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌──────────────────────┐      ┌───────────────────────────┐
│    Career Agent      │      │     AI Provider Layer    │
│    lib/agent/        │      │     lib/ai/              │
│                      │      │                           │
│  • Intent detection  │      │  • Amazon Bedrock        │
│  • Tool selection    │      │  • Fallback Provider     │
│  • Context tracking  │      │                           │
└──────────┬───────────┘      └───────────────────────────┘
           │
           │ MCP Streamable HTTP
           ▼
┌──────────────────────────────┐
│         MCP Server           │
│         mcp/server.ts        │
│                              │
│ Protocol: MCP 2025-11-25     │
│ Transport: Streamable HTTP   │
│ Port: 3001                   │
│ Endpoint: POST /mcp          │
│                              │
│ MCP Tools:                   │
│ • get_candidate_profile      │
│ • search_opportunities       │
│ • analyze_match              │
│ • analyze_skill_gaps         │
│ • create_career_plan         │
│ • generate_interview_prep    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Demo Data Layer       │
│                              │
│ • 22+ opportunities          │
│ • 3 candidate profiles       │
└──────────────────────────────┘
```

---

# 🔌 Alexa+ Primary Track

CareerPilot implements the **Alexa+ primary track** using a self-hosted MCP server.

The Career Agent communicates with the MCP server over **Streamable HTTP** and invokes registered tools according to user intent.

## MCP Server

- **SDK:** Official `@modelcontextprotocol/sdk` v1.32.1
- **Protocol:** MCP 2025-11-25
- **Transport:** Streamable HTTP via `StreamableHTTPServerTransport`
- **Port:** 3001 by default
- **Endpoint:** `POST /mcp`
- **Sessions:** MCP sessions are created during initialization and reused for subsequent requests

### MCP Endpoint

```text
POST http://localhost:3001/mcp
```

The endpoint uses JSON-RPC 2.0 and supports streaming responses.

---

## 🧰 MCP Tools

| Tool | Purpose |
|---|---|
| `get_candidate_profile` | Retrieve candidate education, skills, projects, and career goals |
| `search_opportunities` | Search 22+ internships/jobs by role, location, and skills |
| `analyze_match` | Calculate an explainable match percentage |
| `analyze_skill_gaps` | Identify missing skills and learning recommendations |
| `create_career_plan` | Generate personalized today/7-day/30-day plans |
| `generate_interview_prep` | Generate role-specific technical, behavioral, and project questions |

---

## 🤖 Agentic Tool Selection

CareerPilot does not blindly execute every available tool.

The Career Agent detects intent and selects the appropriate MCP tools.

| User Intent | Tools Called |
|---|---|
| "Find AI internships in Hyderabad" | `get_candidate_profile` → `search_opportunities` → `analyze_skill_gaps` |
| "Why am I a good match?" | `get_candidate_profile` → `analyze_match` |
| "What skills am I missing?" | `get_candidate_profile` → `analyze_skill_gaps` |
| "Create my 30-day plan" | `get_candidate_profile` → `create_career_plan` |
| "Prepare me for an interview" | `get_candidate_profile` → `generate_interview_prep` |

This makes the system an **agentic workflow**, rather than simply a conversational interface.

---

# 🎙️ Simulated Alexa+ Experience

Because the hackathon permits a simulated Alexa+ experience, CareerPilot provides a web-based interface demonstrating the experience.

The `/agent` page includes:

- Conversational agent interface
- Voice-style interaction
- Real-time activity indicators
- MCP tool execution visibility
- Suggested prompts
- Opportunity result cards
- Match explanations
- Skill-gap analysis
- Career plans
- Interview preparation

The interface demonstrates how an Alexa+-style agent could orchestrate career-related capabilities through MCP.

---

# ☁️ Amazon Bedrock

CareerPilot uses **Amazon Bedrock** for AI reasoning and natural-language generation when AWS credentials and model access are configured.

### Bedrock Integration

- **SDK:** `@aws-sdk/client-bedrock-runtime`
- **Default model:** `anthropic.claude-haiku-4-5-20251001-v1:0`
- **Configuration:** `BEDROCK_MODEL_ID`
- **Provider layer:** `lib/ai/`
- **Credentials:** Supplied securely through the local AWS environment

No AWS credentials are hardcoded into the application or exposed to the browser.

### Request Flow

```text
User message
     ↓
Career Agent
     ↓
Intent detection + tool selection
     ↓
MCP tools
     ↓
Candidate / opportunity / analysis results
     ↓
Amazon Bedrock
     ↓
Natural-language response
     ↓
CareerPilot UI
```

### Required Permission

The AWS identity running the application needs permission to invoke the selected Bedrock model.

Example permission:

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0"
}
```

> Model availability depends on the AWS account, region, and Bedrock access configuration.

---

## 🔐 Recommended AWS Credential Setup

For local development, prefer the AWS CLI/profile or another secure AWS credential provider rather than placing long-lived credentials directly in `.env.local`.

For example:

```bash
aws configure
```

Then configure:

```text
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```

If environment variables are used instead, never commit `.env.local` or real AWS credentials.

**Never share AWS access keys in screenshots, GitHub, Devpost, or the demo video.**

---

## 🪂 Transparent Fallback

CareerPilot remains demonstrable even when Bedrock is unavailable.

If Bedrock credentials are not configured or a Bedrock request fails:

- A deterministic fallback response is returned
- The UI clearly identifies fallback mode
- MCP-derived career results continue to be displayed
- The application remains functional for demonstration

Fallback responses are explicitly labeled:

```text
CareerPilot Demo (Fallback — not Amazon Bedrock)
```

This prevents the fallback system from being confused with Amazon Bedrock output.

---

# 📊 Match Scoring

The `analyze_match` MCP tool uses a transparent deterministic scoring formula.

```text
skill_score    = (matched_required_skills / total_required_skills) × 50 pts

location_score = location_match ? 20 : 5

role_score     = (target_role_terms_matched / total_terms) × 20 pts

project_score  = relevant_projects > 0 ? 10 : 0

─────────────────────────────────────────────

Total: maximum 100 points
```

The resulting score is accompanied by the factors contributing to the match, making the recommendation more explainable than a simple black-box percentage.

---

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| MCP Server | `@modelcontextprotocol/sdk` v1.32.1 |
| MCP Transport | Streamable HTTP, MCP 2025-11-25 |
| AI Provider | Amazon Bedrock via `bedrock-runtime` |
| Default Model | Claude Haiku 4.5 |
| Fallback AI | Deterministic response templates |
| Runtime | Node.js 20+ / tested on Node.js 24 |
| Data Layer | In-memory demo data |
| Animations | Framer Motion |
| Voice | Browser Speech Recognition API |

---

# 📦 Local Setup

## Prerequisites

- Node.js 20+
- npm 10+
- AWS account with Amazon Bedrock access if testing Bedrock mode

## Installation

```bash
git clone <your-repo-url>
cd CareerPilot
npm install
```

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the MCP server:

```env
MCP_SERVER_URL=http://localhost:3001
MCP_PORT=3001
```

For Bedrock:

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```

If your environment requires explicit AWS credentials, configure them securely through your AWS credential provider. Do not commit credentials to the repository.

---

# ▶️ Running the Application

## Terminal 1 — Start MCP Server

```bash
npm run mcp
```

Expected output:

```text
╔══════════════════════════════════════════════════╗
║         CareerPilot MCP Server v1.0.0            ║
║  Protocol: MCP 2025-11-25 (Streamable HTTP)      ║
╠══════════════════════════════════════════════════╣
║  MCP endpoint:  http://localhost:3001/mcp        ║
║  Health check:  http://localhost:3001/health     ║
╚══════════════════════════════════════════════════╝
```

## Terminal 2 — Start Next.js

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Testing

Run the complete test suite:

```bash
npm test
```

Run the MCP protocol tests:

```bash
npm run test:mcp
```

Run unit tests only:

```bash
npm run test:unit
```

The MCP smoke test verifies the protocol workflow:

```text
initialize
    ↓
session creation
    ↓
notifications/initialized
    ↓
tools/list
    ↓
tools/call
```

It verifies the registered MCP tools and session error cases.

> A standalone `tools/call` request without first completing the MCP initialization handshake is not a valid MCP client workflow.

---

# 🎬 Demo Flow

A recommended demonstration flow:

1. Open the CareerPilot landing page.
2. Register or sign in using the local demo account.
3. Show the dashboard and candidate profile.
4. Open **AI Agent**.
5. Enter:

   > **"I want an AI/ML internship in Hyderabad."**

6. Show the agent activity panel and MCP tools being selected.
7. Show the returned opportunities.
8. Open the match explanation.
9. Show the candidate's skill gaps.
10. Ask CareerPilot to create a 30-day plan.
11. Ask for interview preparation.
12. Briefly show the MCP architecture and Amazon Bedrock integration.
13. Close with the CareerPilot value proposition.

---


# 🏆 Hackathon Submission

## Amazon Developer Hackathon: Build, Ship, Shape 2026

### Primary Track

**Alexa+**

CareerPilot demonstrates a simulated Alexa+ experience backed by a real self-hosted MCP server.

Implemented:

- ✅ Self-hosted MCP server
- ✅ Official `@modelcontextprotocol/sdk`
- ✅ MCP 2025-11-25
- ✅ Streamable HTTP transport
- ✅ `POST /mcp` endpoint
- ✅ MCP session initialization
- ✅ Six registered MCP tools
- ✅ Career Agent that actually invokes MCP tools
- ✅ Web-based simulated Alexa+ experience

### AWS Builder Mini Challenge

CareerPilot integrates **Amazon Bedrock** as its AI provider.

Implemented:

- ✅ Amazon Bedrock integration
- ✅ `@aws-sdk/client-bedrock-runtime`
- ✅ Configurable Bedrock model
- ✅ Secure credential configuration
- ✅ AI provider abstraction
- ✅ Clearly identified non-Bedrock fallback mode

---

# 🧩 Why MCP Matters in CareerPilot

MCP provides a structured interface between the Career Agent and career capabilities.

Instead of putting every career operation directly inside the conversational layer, CareerPilot exposes reusable tools:

```text
Career Agent
     │
     ├── get_candidate_profile
     ├── search_opportunities
     ├── analyze_match
     ├── analyze_skill_gaps
     ├── create_career_plan
     └── generate_interview_prep
```

This makes the architecture extensible.

Additional career capabilities can be added as MCP tools without redesigning the entire agent experience.

---

# 📁 Project Structure

```text
CareerPilot/
│
├── app/                    # Next.js application routes and pages
├── lib/
│   ├── agent/              # Career Agent logic
│   ├── ai/                 # Bedrock + fallback providers
│   └── data/               # Demo opportunities and candidates
│
├── mcp/
│   └── server.ts           # Self-hosted MCP server
│
├── public/
│   └── images/
│       └── career/         # Career illustration assets
│
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

# ⚠️ Limitations

- **Local demo authentication:** Account/profile data is stored in the git-ignored `.careerpilot-auth.json` file and is not production-ready authentication.
- **Demo opportunity data:** Opportunities are based on a realistic local dataset rather than live job-market APIs.
- **Fallback AI:** Without Bedrock credentials, responses use deterministic templates.
- **Voice input:** Browser Speech Recognition support varies by browser/environment.
- **Single-instance storage:** The current local data layer is intended for demonstration rather than production-scale deployment.

---

# 🔮 Future Improvements

- PostgreSQL-backed profile persistence
- Real-time job APIs through additional MCP tools
- Application tracking and status updates
- Email/calendar integrations for application deadlines
- Resume parsing MCP tool
- Production authentication
- Managed multi-instance storage
- Career progress analytics
- Additional agent capabilities and MCP integrations

---

# 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

---

# 👥 Hackathon Submission Links

**GitHub Repository:**  
`https://github.com/rithikanagineni/CareerPilot`

**Demo Video:**  
_Add public YouTube/Vimeo link before submission._

**Hackathon:**  
Amazon Developer Hackathon — Build, Ship, Shape 2026

**Primary Track:** Alexa+

**Mini Challenge:** AWS Builder

---

# 🙌 Built for the Hackathon

CareerPilot was built to explore how an agentic career assistant can combine **MCP, Amazon Bedrock, structured tools, and an Alexa+-style experience** into one practical workflow.

> **Don't just find your next opportunity. Know why it fits, what you're missing, and what to do next.**

**CareerPilot — Turn career goals into your next best action.**
