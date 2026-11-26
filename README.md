# EduSphere: Enterprise Learning Management, Course Authoring & Assessment Platform

EduSphere is a multi-service enterprise-style demo Learning Management System built for enterprise course delivery, sequential curriculum progression, deterministic assessment evaluation, and verifiable digital credentialing.

---

## Live demo on Railway

- [EduSphere website](https://web-production-4feff415.up.railway.app)
- [API readiness](https://api-production-7499d486.up.railway.app/ready)
- [API docs](https://web-production-4feff415.up.railway.app/api/docs)
- [Analytics health](https://analytics-production-44a30124.up.railway.app/health)

Synthetic demo data only. Never enter real student records or payment details. Hosting availability depends on Railway credits.

## 🚀 Quick Start (Localhost)

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **Python**: v3.11+
- **NPM**: v10+

### 2. Installation & Build
```bash
# Clone the repository
git clone https://github.com/nitinsharma2005900-ai/EduSphere.git
cd EduSphere

# Install dependencies
npm install

# Build shared contracts and UI
npm run build:all
```

### 3. Launch Services
```bash
# Terminal 1: Core Express API (Port 4000)
npm run dev --workspace=services/api

# Terminal 2: Python FastAPI Microservice (Port 8000)
cd services/analytics && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 3: Next.js Frontend (Port 3000)
npm run dev --workspace=apps/web
```

---

## 🌐 Localhost Port Mapping
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Core Express REST API**: [http://localhost:4000](http://localhost:4000)
- **Interactive Swagger OpenAPI Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **FastAPI Analytics Microservice Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Public Certificate Verification**: [http://localhost:3000/verify/EDU-2026-PYT-7892](http://localhost:3000/verify/EDU-2026-PYT-7892)

---

## 🔑 Demo Login Credentials (All 5 Roles)
All demo accounts share the password: **`EduSphere2026!`**

| Role | Email Address | Description |
| :--- | :--- | :--- |
| **Learner** | `learner@edusphere.demo` | Enrolled in courses, watch lessons, take quizzes, view certificates. |
| **Instructor** | `instructor@edusphere.demo` | Monitor cohorts, inspect pass rates, view at-risk learner alerts. |
| **Course Author** | `author@edusphere.demo` | Create and edit curricula, modules, video lessons, and questions. |
| **Assessor** | `assessor@edusphere.demo` | Review capstone assignments with multi-criterion rubric scoring. |
| **Administrator** | `admin@edusphere.demo` | Platform metrics, user roles, certificate issuance and revocation audit. |

> **Pro Tip**: The top navigation bar includes a **1-Click Demo Persona Switcher** allowing you to instantly switch identities without logging in and out!

---

## 🧪 Automated Testing
```bash
# Run Node.js & Security Test Suites (30 passing tests)
npm run test:api

# Run Python Grading & Analytics Test Suite (10 passing tests)
npm run test:analytics
```

---

## 🐳 Docker Deployment
```bash
# Launch entire 8-container stack
docker compose up -d --build
```

---

## ☁️ Render Cloud Deployment
EduSphere is pre-configured with a root `render.yaml` Blueprint for one-click deployment to Render.
Detailed instructions, environment variable keys, and free-tier optimization tips are provided in [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

---

## 📋 Implementation map (not an independent compliance score)

| Assessment | Title | Status | Primary Verification Artifact |
| :--- | :--- | :---: | :--- |
| **01** | Architecture & Monorepo Setup | ✅ Complete | Modular architecture, TypeScript contracts, Docker Compose |
| **02** | Authentication, JWT & RBAC | ✅ Complete | JWT access/refresh rotation, 5 user roles, tamper-proof bcrypt |
| **03** | Course Authoring & Curriculum Management | ✅ Complete | Interactive builder, multi-module/lesson structures, syllabus |
| **04** | Course Enrollment & Catalog Navigation | ✅ Complete | Catalog search, category filter, enrollment activation |
| **05** | Video Lesson Player & Content Delivery | ✅ Complete | H.264 streaming player, speed control, download resources |
| **06** | Sequential Learning & Lesson Unlocking | ✅ Complete | Strict server-side prerequisite enforcement, progress state machine |
| **07** | Quiz & Assessment Engine | ✅ Complete | Deterministic grading, single/multi-choice, retry limits |
| **08** | Assignment Submission & Rubric Grading | ✅ Complete | Multi-criterion rubric grading engine, feedback submission |
| **09** | Certificate Generation & Verification | ✅ Complete | Tamper-proof SHA-256 certificate hashing, public verification page |
| **10** | Learning Analytics & Cohort Monitoring | ✅ Complete | FastAPI analytics, cohort pass rates, at-risk student tracking |
| **11** | Background Jobs & Event Notifications | ✅ Complete | In-app notification center, resilient job queue architecture |
| **12** | EdTech System Integrations | ✅ Complete | S3/MinIO, ICS milestone calendar, Stripe sandbox checkout |
| **13** | Enterprise Security & Access Hardening | ✅ Complete | OWASP top 10, SQL injection prevention, rate limiting, helmet |
| **14** | Automated Quality Assurance & Testing | ✅ Complete | 43 passing automated tests in baseline CI (30 Jest + 3 PostgreSQL + 10 pytest) |
| **15** | Production Readiness & Operations | ✅ Complete | Render Blueprint, Docker Compose, incident RCAs, health endpoints |
