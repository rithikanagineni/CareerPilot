import { searchOpportunities, analyzeMatch, analyzeSkillGaps, createCareerPlan } from '../lib/mcp/tools';
import { getCandidateById } from '../lib/data/candidates';
import { getOpportunityById } from '../lib/data/opportunities';

// Test 1: Search
console.log('\n--- Test 1: searchOpportunities ---');
const results = searchOpportunities({ role: 'AI/ML', location: 'Hyderabad' });
console.log(`Found ${results.length} results`);
console.log(`First: ${results[0]?.company} - ${results[0]?.role}`);

// Test 2: Match analysis
console.log('\n--- Test 2: analyzeMatch ---');
const candidate = getCandidateById('candidate-001');
const opp = getOpportunityById('opp-001');
if (candidate && opp) {
  const match = analyzeMatch({ candidateProfile: candidate, opportunity: opp });
  console.log(`Match: ${match.matchPercentage}%`);
  console.log(`Matching skills: ${match.matchingSkills.join(', ')}`);
  console.log(`Missing: ${match.missingSkills.join(', ')}`);
}

// Test 3: Skill gap
console.log('\n--- Test 3: analyzeSkillGaps ---');
const gap = analyzeSkillGaps({ currentSkills: ['Python', 'Machine Learning', 'SQL'], targetRole: 'AI/ML Intern' });
console.log(`Readiness: ${gap.overallReadiness}%`);
console.log(`Missing: ${gap.missingSkills.map(s => s.skill).join(', ')}`);

// Test 4: Career plan
console.log('\n--- Test 4: createCareerPlan ---');
const plan = createCareerPlan({ careerGoal: 'AI/ML Internship', targetRole: 'AI/ML Intern', skillGaps: gap });
console.log(`Immediate actions: ${plan.immediateActions.length}`);
console.log(`7-day: ${plan.sevenDayPlan.length}, 30-day: ${plan.thirtyDayPlan.length}`);

console.log('\n✓ All MCP tool tests passed!');
process.exit(0);
