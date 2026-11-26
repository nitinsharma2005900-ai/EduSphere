# EduSphere System Architecture & Design Specification

## 1. Monorepo Architecture Overview
EduSphere is designed as an enterprise-grade multi-service Learning Management and Assessment Platform adhering to bounded contexts, modular controller-service-repository patterns, and deterministic domain execution.

```
                              [ Browser Client (Next.js 14 App Router) ]
                                                │
                                                ▼
                                    [ Reverse Proxy (Nginx) ]
                                       Port 80 / 443
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
    [ Core Backend API (Node.js/Express) ]              [ Learning Analytics Service (FastAPI) ]
              Port 4000                                              Port 8000
                     │                                                     │
        ┌────────────┴────────────┐                                        │
        ▼                         ▼                                        │
[ PostgreSQL 16 ]           [ Redis 7 / BullMQ ]                           │
   Port 5432                     Port 6379                                 │
 (System of Record)         (Cache & Queues)                               │
        │                         │                                        │
        └─────────────────────────┴────────────────────────────────────────┘
```

## 2. Service Responsibilities & Boundaries

### A. Next.js Web Frontend (`apps/web`)
- User Interface built with React 18, Next.js 14 App Router, TypeScript, and Tailwind CSS.
- Implements 5 dedicated role portals: Learner, Instructor, Course Author, Assessor, and Administrator.
- Instant persona switcher in demo mode enabling seamless evaluator inspection.

### B. Core Business API (`services/api`)
- Express.js REST API with strict request validation (Zod) and TypeScript typings.
- Implements RBAC and resource-level ownership authorization.
- Interfaces with PostgreSQL via Prisma ORM for relational persistence.
- Enforces sequential lesson unlocks, assessment attempt limits, and server-side certificate eligibility.

### C. Learning Analytics & Grading Microservice (`services/analytics`)
- Python 3.13 microservice built with FastAPI and Pydantic.
- Responsible for:
  - 100% deterministic MCQ, multi-choice, and True/False grading with partial credit.
  - Standardized rubric aggregation.
  - Cohort analytics and transparent rule-based at-risk learner indicators.
  - Cryptographic SHA-256 certificate metadata preparation.

### D. Relational Database & Background Infrastructure
- **PostgreSQL 16**: Authoritative system of record.
- **Redis 7 & BullMQ**: Asynchronous email notifications and background task processing.
- **MinIO**: S3-compatible object storage for assignment uploads and learning assets.
- **Mailpit**: SMTP sandbox for local email verification.
