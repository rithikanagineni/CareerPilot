# CareerPilot — Manual Test Checklist

Run these tests after setup to verify everything works.

## Prerequisites
- [ ] `npm run mcp:server` running on port 3001
- [ ] `npm run dev` running on port 3000

---

## MCP Server

- [ ] `GET http://localhost:3001/health` returns 200 with 6 tools listed
- [ ] `POST http://localhost:3001/mcp` with `search_opportunities` returns results
- [ ] `POST http://localhost:3001/mcp` with `get_candidate_profile` returns profile
- [ ] `POST http://localhost:3001/mcp` with `analyze_match` returns match score

---

## Landing Page (/)

- [ ] Logo and tagline visible
- [ ] "Start Career Planning" button navigates to /agent
- [ ] "Explore Opportunities" button navigates to /opportunities
- [ ] Demo conversation card displays correctly
- [ ] Features section shows 6 feature cards
- [ ] How it works section shows 3 steps
- [ ] Tech stack section shows MCP and Bedrock details
- [ ] Responsive on mobile

---

## Dashboard (/dashboard)

- [ ] Profile loads (Priya Sharma by default)
- [ ] Readiness scores show (Profile %, Skill %, Application %)
- [ ] Progress bars render
- [ ] Skills list displays
- [ ] Projects section shows 2 projects
- [ ] Quick Actions links work
- [ ] Loading state shows while fetching

---

## AI Agent (/agent)

- [ ] Welcome message displays on load
- [ ] Suggested prompts are visible
- [ ] Type "Find AI internships in Hyderabad" → agent responds with opportunities
- [ ] Activity panel shows tool execution steps
- [ ] Opportunities appear in right panel
- [ ] Type "Why am I a good match?" → match score appears
- [ ] Type "What skills am I missing?" → skill gap analysis appears
- [ ] Type "Create my 30-day career plan" → career plan appears (with checkboxes)
- [ ] Type "Prepare me for an interview" → interview prep appears
- [ ] Checking career plan items marks them as done
- [ ] Switching between result tabs (opportunities/match/skills/plan/prep) works
- [ ] Error state shows if API fails (try stopping MCP server)
- [ ] Voice input button visible (may not be supported in all browsers)

---

## Opportunities (/opportunities)

- [ ] All 22 opportunities load
- [ ] Filter by domain (AI/ML) works
- [ ] Filter by location (Hyderabad) works
- [ ] Filter by type (internship) works
- [ ] Search by text works
- [ ] "View Match" button navigates to agent with pre-filled prompt
- [ ] Loading skeleton shows while fetching
- [ ] Empty state shows when no results match filters
- [ ] "Clear filters" button resets filters

---

## Profile (/profile)

- [ ] Profile loads with demo data
- [ ] Can edit Name, Target Role, Email fields
- [ ] Can add a new skill (type + press Enter)
- [ ] Can remove a skill (click ×)
- [ ] Can toggle preferred locations
- [ ] Can edit project names and descriptions
- [ ] Save button shows "Saved!" confirmation
- [ ] Changes persist during the session (in-memory)

---

## Automated Tests

```bash
npm test
```

- [ ] All 18 tests pass
- [ ] No test failures

---

## Build Verification

```bash
npm run build
```

- [ ] Build completes without TypeScript errors
- [ ] All pages listed in build output
- [ ] API routes show as Dynamic

---

## Hackathon Compliance

- [ ] MCP server is real (not a fake REST API)
- [ ] `@modelcontextprotocol/sdk` is actually imported and used
- [ ] Streamable HTTP transport is used (not SSE-only or stdio)
- [ ] Agent actually calls MCP tools (verify via activity panel)
- [ ] Bedrock provider is in `lib/ai/bedrock.ts` with real SDK
- [ ] No hardcoded AWS credentials
- [ ] `.env.example` exists with all variable names
- [ ] `.env.local` is in `.gitignore`
- [ ] README documents the MCP and Bedrock integrations accurately
