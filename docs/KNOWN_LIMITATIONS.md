# EduSphere Known Limitations & Assumptions

As required by Assessment 12 and the project guidelines, the following transparent limitations and design assumptions are documented:

1. **Payment Processing**: Sandbox mode is enabled by default (`STRIPE_SANDBOX` / `RAZORPAY_SANDBOX`). Real credit cards are never charged. Mock webhooks simulate payment intent success and enrollment activation.
2. **Video Provider**: Uses legal, public domain H.264 sample videos (Big Buck Bunny, Elephants Dream) served through an adaptive streaming adapter with strict server-side authorization checks.
3. **Local Docker Accessibility**: When Docker is not installed on the developer workstation, EduSphere includes a zero-dependency in-memory PostgreSQL-compatible transactional store initialized with the full relational dataset, allowing full application execution without external daemons.
4. **Third-Party AI LLMs**: As explicitly mandated in the prompt instructions, external non-deterministic AI LLMs (such as Gemini or OpenAI) are excluded to ensure deterministic grading and transparent rule-based analytics.
5. **Render Free-Tier Sleeping**: Render web services on the free tier spin down after 15 minutes of inactivity. The initial incoming HTTP request triggers a cold-start requiring approximately 30-50 seconds before responding.
6. **Render Free PostgreSQL 30-Day Limit**: Render free-tier managed databases expire after 30 days. For permanent free production storage, developers can supply a free-tier connection string from Neon.tech or Supabase via the `DATABASE_URL` environment variable.
7. **Render Redis Tier**: Render does not offer a free Redis service ($7/mo min). EduSphere includes a resilient in-memory fallback queue for background operations when `REDIS_URL` is omitted, or supports zero-cost serverless Redis from Upstash (10,000 commands/day free).
