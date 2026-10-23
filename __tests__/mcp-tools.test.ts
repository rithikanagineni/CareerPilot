// ============================================================
// CareerPilot — MCP Tools Unit Tests
// Run with: npx tsx __tests__/mcp-tools.test.ts
// ============================================================
import {
  searchOpportunities,
  analyzeMatch,
  analyzeSkillGaps,
  createCareerPlan,
  generateInterviewPrep,
  getCandidateProfile,
} from '../lib/mcp/tools';
import { getCandidateById } from '../lib/data/candidates';
import { getOpportunityById } from '../lib/data/opportunities';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ─── get_candidate_profile ───────────────────────────────────
console.log('\n▶ get_candidate_profile');
test('returns profile for valid ID', () => {
  const profile = getCandidateProfile('candidate-001');
  assert(profile !== null, 'Profile should not be null');
  assert(profile!.name === 'Priya Sharma', `Expected Priya Sharma, got ${profile!.name}`);
  assert(profile!.skills.length > 0, 'Profile should have skills');
});

test('returns null for unknown ID', () => {
  const profile = getCandidateProfile('unknown-999');
  assert(profile === null, 'Should return null for unknown ID');
});

// ─── search_opportunities ────────────────────────────────────
console.log('\n▶ search_opportunities');
test('finds AI/ML opportunities in Hyderabad', () => {
  const results = searchOpportunities({ role: 'AI/ML', location: 'Hyderabad' });
  assert(results.length > 0, 'Should find at least 1 result');
  assert(
    results.every((r) => r.location === 'Hyderabad' || r.location === 'Remote'),
    'All results should be in Hyderabad or Remote'
  );
});

test('returns up to 10 results', () => {
  const results = searchOpportunities({ role: 'intern' });
  assert(results.length <= 10, `Should return at most 10 results, got ${results.length}`);
});

test('finds Python opportunities', () => {
  const results = searchOpportunities({ skills: ['Python'] });
  assert(results.length > 0, 'Should find Python opportunities');
});

test('returns empty array for impossible combination', () => {
  const results = searchOpportunities({ role: 'xyzzy-nonexistent-role-abc' });
  assert(results.length === 0, 'Should return no results for nonexistent role');
});

// ─── analyze_match ───────────────────────────────────────────
console.log('\n▶ analyze_match');
test('calculates match percentage 0-100', () => {
  const candidate = getCandidateById('candidate-001')!;
  const opportunity = getOpportunityById('opp-001')!;
  const result = analyzeMatch({ candidateProfile: candidate, opportunity });
  assert(result.matchPercentage >= 0 && result.matchPercentage <= 100, 
    `Match percentage ${result.matchPercentage} should be 0-100`);
});

test('produces deterministic results for same input', () => {
  const candidate = getCandidateById('candidate-001')!;
  const opportunity = getOpportunityById('opp-001')!;
  const r1 = analyzeMatch({ candidateProfile: candidate, opportunity });
  const r2 = analyzeMatch({ candidateProfile: candidate, opportunity });
  assert(r1.matchPercentage === r2.matchPercentage, 
    `Match should be deterministic: ${r1.matchPercentage} !== ${r2.matchPercentage}`);
});

test('identifies matching skills correctly', () => {
  const candidate = getCandidateById('candidate-001')!; // has Python
  const opportunity = getOpportunityById('opp-001')!; // requires Python
  const result = analyzeMatch({ candidateProfile: candidate, opportunity });
  assert(
    result.matchingSkills.some((s) => s.toLowerCase().includes('python')),
    'Python should be in matching skills'
  );
});

test('includes explanation text', () => {
  const candidate = getCandidateById('candidate-001')!;
  const opportunity = getOpportunityById('opp-001')!;
  const result = analyzeMatch({ candidateProfile: candidate, opportunity });
  assert(result.explanation.length > 0, 'Should include explanation');
});

// ─── analyze_skill_gaps ──────────────────────────────────────
console.log('\n▶ analyze_skill_gaps');
test('identifies missing skills for AI/ML role', () => {
  const gap = analyzeSkillGaps({
    currentSkills: ['Python', 'SQL'],
    targetRole: 'AI/ML Intern',
  });
  assert(gap.missingSkills.length > 0, 'Should identify missing skills');
  assert(gap.overallReadiness < 100, 'Readiness should be less than 100%');
});

test('shows 100% readiness when all skills present', () => {
  // Provide all skills for the target
  const gap = analyzeSkillGaps({
    currentSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics', 'NumPy', 'Pandas'],
    targetRole: 'AI/ML Intern',
  });
  assert(gap.overallReadiness === 100, `Expected 100%, got ${gap.overallReadiness}%`);
  assert(gap.missingSkills.length === 0, 'Should have no missing skills');
});

test('existing skills are preserved in output', () => {
  const gap = analyzeSkillGaps({
    currentSkills: ['Python', 'Machine Learning'],
    targetRole: 'AI/ML Intern',
  });
  assert(
    gap.existingSkills.some((s) => s === 'Python'),
    'Python should be in existing skills'
  );
});

test('assigns priority levels', () => {
  const gap = analyzeSkillGaps({
    currentSkills: ['SQL'],
    targetRole: 'AI/ML Intern',
  });
  const priorities = gap.missingSkills.map((s) => s.priority);
  assert(
    priorities.some((p) => p === 'high'),
    'Should have at least one high-priority gap'
  );
});

// ─── create_career_plan ──────────────────────────────────────
console.log('\n▶ create_career_plan');
test('generates plans with all required sections', () => {
  const gap = analyzeSkillGaps({ currentSkills: ['Python'], targetRole: 'AI/ML Intern' });
  const plan = createCareerPlan({
    careerGoal: 'Get an AI/ML internship',
    targetRole: 'AI/ML Intern',
    skillGaps: gap,
  });
  assert(plan.immediateActions.length > 0, 'Should have immediate actions');
  assert(plan.sevenDayPlan.length > 0, 'Should have 7-day plan');
  assert(plan.thirtyDayPlan.length > 0, 'Should have 30-day plan');
  assert(plan.applicationStrategy.length > 0, 'Should have application strategy');
});

test('plan items have unique IDs', () => {
  const gap = analyzeSkillGaps({ currentSkills: [], targetRole: 'AI/ML Intern' });
  const plan = createCareerPlan({
    careerGoal: 'test',
    targetRole: 'AI/ML Intern',
    skillGaps: gap,
  });
  const allIds = [
    ...plan.immediateActions,
    ...plan.sevenDayPlan,
    ...plan.thirtyDayPlan,
  ].map((i) => i.id);
  const uniqueIds = new Set(allIds);
  assert(uniqueIds.size === allIds.length, 'All plan item IDs should be unique');
});

// ─── generate_interview_prep ─────────────────────────────────
console.log('\n▶ generate_interview_prep');
test('generates interview questions for ML role', () => {
  const prep = generateInterviewPrep({
    targetRole: 'AI/ML Intern',
    candidateSkills: ['Python', 'Machine Learning'],
    missingSkills: ['TensorFlow', 'PyTorch'],
  });
  assert(prep.technicalQuestions.length > 0, 'Should have technical questions');
  assert(prep.behavioralQuestions.length > 0, 'Should have behavioral questions');
  assert(prep.projectQuestions.length > 0, 'Should have project questions');
  assert(prep.preparationTopics.length > 0, 'Should have preparation topics');
});

test('includes missing skills as preparation topics', () => {
  const prep = generateInterviewPrep({
    targetRole: 'AI/ML Intern',
    candidateSkills: ['Python'],
    missingSkills: ['TensorFlow'],
  });
  const allTopics = prep.preparationTopics.map((t) => t.topic.toLowerCase());
  assert(
    allTopics.some((t) => t.includes('tensorflow') || t.includes('improve')),
    'Missing skills should appear in preparation topics'
  );
});

// ─── Summary ─────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✓ All tests passed!\n');
  process.exit(0);
}
