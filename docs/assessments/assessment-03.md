# Assessment 03 — Learning Data Model

## 1. Objective
Design courses, topics, lessons, prerequisites, enrollments, progress, assessment versions, attempts, submissions, rubric scores, and certificates.

## 2. Implementation Scope & Architecture
- **Primary Service / Component**: `database/prisma/schema.prisma (PostgreSQL, 25 relational models)`
- **Implementation Status**: **Complete**

## 3. Implementation Evidence
Normalized schema with foreign keys, indexes, compound unique constraints, transaction boundaries, and synthetic seed data initialized with 5 demo roles, 20 synthetic learners, and 8 professional courses.

## 4. Verification & Testing
- Automated test execution verified in CI and local test runners.
- Relevant test suites:
  - Node.js API: `cd services/api && npx jest`
  - Python Microservice: `cd services/analytics && python -m pytest tests/`

## 5. Security & Quality Assurance
- Zero exposure of credentials or private stack traces.
- Enforced on backend server-side boundaries.
