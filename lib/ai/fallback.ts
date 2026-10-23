// ============================================================
// CareerPilot — Deterministic Fallback AI Provider
// Used ONLY when Amazon Bedrock credentials are not configured.
// This is NOT Amazon Bedrock and does NOT pretend to be.
// It provides structured, deterministic responses for demo purposes.
// ============================================================
import type { AIMessage, AIResponse, AIProvider } from './types';

export class FallbackProvider implements AIProvider {
  name = 'CareerPilot Demo (Fallback)';

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  async generateResponse(
    messages: AIMessage[],
    _systemPrompt?: string
  ): Promise<AIResponse> {
    const lastMessage = messages[messages.length - 1];
    const userInput = lastMessage?.content?.toLowerCase() ?? '';

    const content = this.generateDeterministicResponse(userInput, messages);

    return {
      content,
      provider: 'CareerPilot Demo (Fallback — not Amazon Bedrock)',
      model: 'deterministic-v1',
    };
  }

  private generateDeterministicResponse(
    input: string,
    history: AIMessage[]
  ): string {
    // Career goal / role search intent
    if (
      (input.includes('want') || input.includes('looking for') || input.includes('find')) &&
      (input.includes('intern') || input.includes('job') || input.includes('opportunit'))
    ) {
      return this.buildOpportunitySearchResponse(input);
    }

    // Match analysis intent
    if (
      input.includes('match') ||
      input.includes('good fit') ||
      input.includes('qualify') ||
      input.includes('suitable')
    ) {
      return this.buildMatchResponse();
    }

    // Skill gap intent
    if (
      input.includes('skill') ||
      input.includes('missing') ||
      input.includes('improve') ||
      input.includes('learn') ||
      input.includes('gap')
    ) {
      return this.buildSkillGapResponse(input);
    }

    // Career plan intent
    if (
      input.includes('plan') ||
      input.includes('roadmap') ||
      input.includes('what should i do') ||
      input.includes('steps') ||
      input.includes('month') ||
      input.includes('week')
    ) {
      return this.buildCareerPlanResponse();
    }

    // Interview prep intent
    if (
      input.includes('interview') ||
      input.includes('prepare') ||
      input.includes('practice') ||
      input.includes('question')
    ) {
      return this.buildInterviewPrepResponse(input);
    }

    // Greeting
    if (
      input.includes('hello') ||
      input.includes('hi') ||
      input.includes('hey') ||
      history.length <= 1
    ) {
      return `Hi! I'm **CareerPilot**, your AI career agent. I'm here to help you turn your career goals into a clear action plan.

Here's what I can do for you:
- 🔍 **Find opportunities** that match your skills and goals
- 📊 **Analyze your match** for any specific role
- 🎯 **Identify skill gaps** and create a learning roadmap
- 📋 **Build a personalized career plan** (today, 7-day, 30-day)
- 🎤 **Prepare you for interviews** with targeted questions

To get started, try telling me your career goal — for example:
> *"I want an AI/ML internship in Hyderabad"*

What's your career goal?`;
    }

    // Default helpful response
    return `I understand you're looking for career guidance. Let me help you with that.

Based on what you've shared, I'd suggest we:
1. **Define your target role** — the more specific, the better
2. **Search for matching opportunities** in your preferred location
3. **Analyze your skill match** against the best opportunities
4. **Build your action plan**

Could you tell me more about your target role and preferred location? For example: *"I want a Python internship in Bangalore"*`;
  }

  private buildOpportunitySearchResponse(input: string): string {
    const location = this.extractLocation(input);
    const role = this.extractRole(input);

    return `Great! I'm searching for **${role}** opportunities${location ? ` in **${location}**` : ''} for you.

I'm using the CareerPilot opportunity database to find the best matches for your profile. Based on your skills in Python, Machine Learning, and SQL, here are the most relevant opportunities I found:

**Top matches identified:**
1. **Qualcomm India** — AI/ML Intern, Hyderabad (87% match)
2. **Microsoft IDC** — Machine Learning Intern, Hyderabad (82% match)
3. **Amazon Dev Center** — Applied Scientist Intern, Hyderabad (79% match)

These opportunities align well with your technical skills. Would you like me to:
- **Analyze your match** for any specific opportunity?
- **Identify skill gaps** to improve your match score?
- **Create a career action plan** based on these opportunities?`;
  }

  private buildMatchResponse(): string {
    return `Based on your profile analysis, here's your match breakdown:

## Your Match Score: 87%

**Strong matches ✓**
- Python — core requirement, you have strong experience
- Machine Learning — your projects demonstrate practical knowledge
- SQL — solid foundation
- Project Experience — 2 relevant ML projects on your profile

**Skill gaps ⚠️**
- TensorFlow/PyTorch advanced usage — intermediate gap
- AWS/Cloud deployment — missing, but learnable in 2 weeks
- Docker — recommended for modern ML workflows

**Why you're a strong match:**
Your Python and machine learning experience directly aligns with the role requirements. Your crop disease detection project demonstrates real-world ML implementation, which is exactly what companies want to see.

**How to improve your score:**
1. Add an AWS or cloud deployment project
2. Complete a Docker basics course (1 week)
3. Contribute to an open-source ML project

Would you like me to create a specific action plan to close these gaps?`;
  }

  private buildSkillGapResponse(input: string): string {
    return `Here's your skill gap analysis for your target role:

## Skill Gap Analysis

**Skills you have ✅**
- Python — Strong
- Machine Learning — Intermediate
- Java — Intermediate
- SQL — Good

**Missing skills (prioritized):**

### High Priority 🔴
1. **PyTorch** — Core ML framework used by most companies
   → Learn via: PyTorch official tutorials (pytorch.org)
   → Time: 2–3 weeks

2. **AWS / Cloud** — Deployment is expected for ML roles
   → Learn via: AWS Skill Builder (free) + Cloud Practitioner cert
   → Time: 3–4 weeks

### Medium Priority 🟡
3. **Docker** — Container deployment for ML models
   → Learn via: Docker official docs + Udemy course
   → Time: 1 week

4. **MLflow / Experiment Tracking** — Industry standard
   → Learn via: MLflow official documentation
   → Time: 3–5 days

**Overall Readiness: 65%**

Would you like me to create a structured learning plan to close these gaps in 30 days?`;
  }

  private buildCareerPlanResponse(): string {
    return `Here's your personalized career action plan:

## 🎯 Your AI/ML Career Plan

### Today (Immediate Actions)
- [ ] Review the top 3 matched opportunities and shortlist best fits
- [ ] Update your resume to highlight ML projects
- [ ] Set up a structured job application tracker

### This Week (7-Day Plan)
- [ ] Complete Day 1–3 of PyTorch tutorials (pytorch.org)
- [ ] Apply to your top 3 shortlisted internships
- [ ] Practice 15 ML interview questions on LeetCode
- [ ] Build a small project using a missing skill

### This Month (30-Day Plan)
- [ ] Apply to 10+ relevant internships
- [ ] Complete AWS Cloud Practitioner prep
- [ ] Complete 2 mock technical interviews
- [ ] Publish an updated ML project to GitHub
- [ ] Attend 1 virtual tech meetup or hackathon

### Application Strategy
1. Tailor your resume for each JD with relevant keywords
2. Apply early — roles fill within 2 weeks of posting
3. Follow up after 1 week with no response
4. Use LinkedIn, Internshala, and company career pages simultaneously

Ready to start? Which action would you like to tackle first?`;
  }

  private buildInterviewPrepResponse(input: string): string {
    const isMLRole = input.includes('ml') || input.includes('machine learning') || input.includes('ai');

    return `Here's your interview preparation guide:

## 🎤 Interview Prep: ${isMLRole ? 'AI/ML' : 'Technical'} Role

### Technical Questions (practice these)
1. "Explain the bias-variance tradeoff" — discuss underfitting/overfitting
2. "How does gradient descent work?" — explain SGD, Adam, learning rate
3. "How do you handle class imbalance?" — SMOTE, class weights, metrics
4. "Explain regularization techniques" — L1, L2, Dropout
5. "Walk me through a neural network architecture" — layers, activation functions

### Behavioral Questions (STAR format)
1. "Tell me about a challenging ML project you worked on"
2. "Describe a time you had to learn something quickly"
3. "How did you handle a bug that took days to fix?"
4. "Why this company / why AI/ML?"

### Project Questions
- Be ready to walk through your **Crop Disease Detector** project in depth
- Explain your technical choices: why TensorFlow, how you improved accuracy
- Talk about limitations and what you'd improve

### Preparation Topics (priority order)
1. 🔴 ML fundamentals — supervised/unsupervised, evaluation metrics
2. 🔴 Python proficiency — data structures, OOP, libraries
3. 🟡 System design basics — ML pipelines, feature stores
4. 🟡 Statistics — distributions, hypothesis testing, A/B testing
5. 🟢 DSA — arrays, trees, graphs (for coding rounds)

**Recommended resources:**
- LeetCode (ML company problems)
- Kaggle Learn (quick ML courses)
- NeetCode.io (DSA patterns)
- ML cheatsheet (mlcheatsheet.readthedocs.io)

Good luck with your interviews! Would you like more practice questions on a specific topic?`;
  }

  private extractLocation(input: string): string {
    const locations = ['hyderabad', 'bangalore', 'chennai', 'pune', 'mumbai', 'delhi', 'remote'];
    for (const loc of locations) {
      if (input.includes(loc)) {
        return loc.charAt(0).toUpperCase() + loc.slice(1);
      }
    }
    return '';
  }

  private extractRole(input: string): string {
    if (input.includes('ai') || input.includes('ml') || input.includes('machine learning')) return 'AI/ML';
    if (input.includes('data science')) return 'Data Science';
    if (input.includes('python')) return 'Python';
    if (input.includes('full stack') || input.includes('fullstack')) return 'Full Stack';
    if (input.includes('cloud')) return 'Cloud';
    return 'Software Engineering';
  }
}
