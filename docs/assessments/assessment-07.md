# Assessment 07 — Progress and Assessment Engine

## 1. Objective
Implement sequential unlocks, prerequisite evaluation, deadlines, attempt policies, grading states, re-evaluation, and certificate eligibility.

## 2. Implementation Scope & Architecture
- **Primary Service / Component**: `services/api/src/services/progress.service.ts, assessment.service.ts`
- **Implementation Status**: **Complete**

## 3. Implementation Evidence
Backend enforces that Lesson N cannot be completed if Lesson N-1 is incomplete. Attempt limit strictly enforced (maxAttempts = 3).

## 4. Verification & Testing
- Automated test execution verified in CI and local test runners.
- Relevant test suites:
  - Node.js API: `cd services/api && npx jest`
  - Python Microservice: `cd services/analytics && python -m pytest tests/`

## 5. Security & Quality Assurance
- Zero exposure of credentials or private stack traces.
- Enforced on backend server-side boundaries.
