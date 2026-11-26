# Assessment 06 — FastAPI Learning Analytics

## 1. Objective
Provide course completion, learner progress, cohort performance, and at-risk indicators using transparent rules and synthetic data.

## 2. Implementation Scope & Architecture
- **Primary Service / Component**: `services/analytics/app/services/analytics.py`
- **Implementation Status**: **Complete**

## 3. Implementation Evidence
Rule-based transparent heuristic model evaluating inactivity, low quiz averages, and assignment backlogs. Tested in tests/test_analytics.py and visualised in instructor dashboard.

## 4. Verification & Testing
- Automated test execution verified in CI and local test runners.
- Relevant test suites:
  - Node.js API: `cd services/api && npx jest`
  - Python Microservice: `cd services/analytics && python -m pytest tests/`

## 5. Security & Quality Assurance
- Zero exposure of credentials or private stack traces.
- Enforced on backend server-side boundaries.
