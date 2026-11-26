# EduSphere Deployment & Operations Guide

## 1. Local Development Setup (Standalone)
EduSphere can be launched locally without requiring external container runtimes:

```bash
# 1. Install dependencies
npm install

# 2. Build shared packages
npm run build --workspace=packages/shared

# 3. Start Core API (Port 4000)
npm run dev --workspace=services/api

# 4. In a second terminal, start Python FastAPI Service (Port 8000)
cd services/analytics
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. In a third terminal, start Next.js Frontend (Port 3000)
npm run dev --workspace=apps/web
```

---

## 2. Production Docker Compose Setup
To launch the full enterprise architecture with PostgreSQL, Redis, MinIO, Mailpit, Express, FastAPI, and Nginx:

```bash
# Build and launch all 8 services
docker compose up -d --build

# Inspect logs
docker compose logs -f

# Shut down
docker compose down
```

---

## 3. Automated Backups & Restoration
```bash
# Perform manual or cron backup
./infrastructure/scripts/backup.sh

# Restore from a backup archive
./infrastructure/scripts/restore.sh ./backups/edusphere_db_20261126.sql.gz
```

---

## 4. Render Cloud Deployment (Blueprint Setup)

EduSphere includes a production-ready `render.yaml` Blueprint file at the repository root.

### Blueprint Architecture on Render
1. **Database:** `edusphere-postgres` (Render Free PostgreSQL Instance)
2. **FastAPI Microservice:** `edusphere-analytics` (Python 3.11 Web Service)
3. **Core API Backend:** `edusphere-api` (Node.js/Express Web Service)
4. **Web Frontend:** `edusphere-web` (Next.js 14 App Router Web Service)

### Step-by-Step Render Deployment:
1. Push your EduSphere repository to GitHub (see Section 5 below).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** in the top navigation and select **"Blueprint"**.
4. Connect your GitHub account and select your `EduSphere` repository.
5. Render will automatically parse `render.yaml` and discover the 4 components:
   - Database: `edusphere-postgres`
   - Service: `edusphere-analytics`
   - Service: `edusphere-api`
   - Service: `edusphere-web`
6. Click **"Apply"**.
7. Render will provision the PostgreSQL database first, auto-generate secure secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_SERVICE_KEY`), and deploy the services.
8. Once `edusphere-api` and `edusphere-analytics` are live, note their allocated URLs (e.g., `https://edusphere-api.onrender.com` and `https://edusphere-analytics.onrender.com`).
9. Update `edusphere-web` environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://edusphere-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_ANALYTICS_URL`: `https://edusphere-analytics.onrender.com`
10. Trigger a rebuild of `edusphere-web` so the client bundle compiles with the production URLs.

### Free Tier Considerations & Suitable Alternatives:
- **Web Services Sleep**: Free tier web services go to sleep after 15 minutes of silence. A ping or initial visit will wake them up in ~30 seconds.
- **Render PostgreSQL 30-Day Expiry**: Free databases on Render expire after 30 days. To retain data indefinitely without paying, you can create a free account at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) and set the `DATABASE_URL` environment variable in `edusphere-api` and `edusphere-analytics`.
- **Redis Queue**: Render does not have a free Redis tier ($7/month). EduSphere includes a built-in resilient in-memory queue fallback that works out-of-the-box, or you can connect a free serverless Redis instance from [Upstash](https://upstash.com) by setting `REDIS_URL`.

---

## 5. GitHub Public Repository Setup Guide

To push your local repository to a new public GitHub repository:

```bash
# 1. Verify working directory is clean and secrets are excluded
git status

# 2. Add your GitHub remote repository (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/EduSphere.git

# 3. Rename default branch to main if needed
git branch -M main

# 4. Push code and commits to GitHub
git push -u origin main
```

> **Security Note:** All credentials, `.env` files, build caches (`.next`, `dist`), and binary test logs are strictly excluded via `.gitignore`. Sensitive keys use runtime environment variables or secure defaults in `.env.example`.
