# CareerPilot — Hackathon Friction Log

This document records the main development friction encountered while building CareerPilot for the Amazon Developer Hackathon: Build, Ship, Shape 2026.

---

## 1. MCP Runtime Validation

### Task Attempted
Implement and validate a self-hosted MCP server using **MCP specification 2025-11-25** and **Streamable HTTP**.

### Steps Taken
I implemented the MCP server using the official MCP SDK and added the CareerPilot tools for:

- Candidate profile retrieval
- Opportunity search
- Match analysis
- Skill-gap analysis
- Career planning
- Interview preparation

I then added protocol-level tests covering initialization, notifications, session handling, tool discovery, and MCP tool behavior.

### Expected Result
The MCP server should complete the MCP protocol handshake correctly, maintain the expected session behavior, and expose the CareerPilot tools to the MCP client.

### Actual Result
The implementation required additional debugging and protocol-level validation before the complete MCP test suite passed.

### Severity
**Medium**

### Workaround / Resolution
I separated MCP protocol testing from the user interface and iterated on the server implementation until the complete MCP test suite passed.

### Actionable Suggestion
An official lightweight MCP validation tool specifically focused on Alexa+ integrations would help developers identify protocol, session, and transport issues earlier in development.

---

## 2. Amazon Bedrock Configuration

### Task Attempted
Integrate **Amazon Bedrock** as the AI reasoning provider for CareerPilot.

### Steps Taken
I configured the Bedrock provider, model configuration, AWS environment, and application-level AI provider selection.

### Expected Result
CareerPilot should use the configured Bedrock model when valid AWS credentials, permissions, region configuration, and model access are available.

### Actual Result
The integration depends on several AWS configuration requirements, including credentials, region configuration, permissions, and model availability.

### Severity
**Medium**

### Workaround / Resolution
I separated the AI provider from the core application architecture and implemented a transparent fallback mode so that the main CareerPilot workflow remains testable when Bedrock access is unavailable.

### Actionable Suggestion
More beginner-focused documentation showing the minimum required permissions, model-access steps, regional availability, and a simple first successful Bedrock request would make onboarding easier.

---

## 3. AI-Assisted Development Tool Limits

### Task Attempted
Complete the application's UI refinement and final development using an AI coding assistant.

### Steps Taken
I used an AI coding assistant during development and continued the work with another VS Code-based AI coding tool when the initial tool reached its usage limit.

### Expected Result
Development should continue without interruption through the final implementation, testing, and UI refinement.

### Actual Result
The initial AI coding tool reached its usage limit before all visual refinement work was completed.

### Severity
**Low**

### Workaround / Resolution
I continued development using another AI-assisted coding workflow while preserving the existing MCP implementation, tests, and application architecture.

### Actionable Suggestion
Better visibility into remaining usage limits and smoother project continuity when switching between AI coding tools would make AI-assisted hackathon development more predictable.

---

## Overall Impact

The friction encountered did not prevent the project from being completed.

The final CareerPilot implementation was locally verified through:

- Application linting
- Application tests
- MCP protocol tests
- Production build
- Manual end-to-end testing

The MCP implementation successfully passed the project's protocol-level validation, and the completed application was tested manually before submission.

---

## Key Learning

The biggest lesson from these challenges was that an agentic application requires more than an AI model. Reliable tool communication, protocol validation, cloud configuration, fallback behavior, and clear separation between the agent and its capabilities are all important parts of the overall system.

These challenges helped me better understand how to build and validate an AI agent using **MCP, Streamable HTTP, and Amazon Bedrock** in a practical application.
