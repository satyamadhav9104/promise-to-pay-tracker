# 🏭 SMARTINVOICE — Production Engineering Plan & Architecture Blueprint

This document outlines the end-to-end plan to take **SmartInvoice (Promise-to-Pay Tracker)** from hackathon/demo stage into a **hardened, scalable, enterprise-grade production platform**.

---

## 🏗️ 1. High-Level Production Architecture

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        Web["React 18 + Tailwind SPA (Vercel / Cloudflare)"]
        Mobile["Mobile Web App"]
    end

    subgraph Edge ["Edge & Security"]
        CDN["Cloudflare CDN & WAF (DDoS / Rate Limiting)"]
        Clerk["Clerk Auth (JWT & JWKS Verification)"]
    end

    subgraph AppCluster ["FastAPI Application Services (Docker / ECS / Render)"]
        API["FastAPI App Cluster (Gunicorn + Uvicorn Workers)"]
        AuthMiddleware["Clerk Bearer JWT Verification"]
        Routes["API Routers: Invoices, Promises, Webhooks, RAG, Razorpay"]
        StateMachine["Deterministic State Machine & Rules Engine"]
    end

    subgraph AsyncWorkers ["Asynchronous Background Services"]
        Scheduler["Background Scheduler (APScheduler / Celery Beat)"]
        EmailWorker["Email Dispatcher (Resend API / SMTP)"]
        LLMService["Gemini 2.5 / Claude Intent Extractor"]
    end

    subgraph DataPersistence ["Data & Persistence Layer"]
        DB[(PostgreSQL / Supabase / AWS RDS with Connection Pool)]
        Redis[(Redis Cache & Idempotency Store)]
        AuditLog[(Immutable ActionLog Table)]
    end

    subgraph ExternalIntegrations ["Third-Party External Services"]
        RazorpayAPI["Razorpay Orders & Payment Links API"]
        RazorpayWebhook["Razorpay Webhook (HMAC-SHA256)"]
        GeminiAPI["Google Gemini 2.5 Pro / Flash"]
        ResendAPI["Resend Email API"]
    end

    Web --> CDN
    CDN --> AuthMiddleware
    AuthMiddleware --> Clerk
    AuthMiddleware --> API
    API --> Routes
    Routes --> StateMachine
    StateMachine --> DB
    StateMachine --> AuditLog
    StateMachine --> RazorpayAPI
    RazorpayWebhook --> Routes
    Scheduler --> DB
    Scheduler --> EmailWorker
    EmailWorker --> ResendAPI
    Routes --> LLMService
    LLMService --> GeminiAPI
    API --> Redis
```

---

## 📋 2. Core Production Enhancements & Phases

| Phase | Category | Action Items | Priority |
| :--- | :--- | :--- | :---: |
| **Phase 1** | **Database & Reliability** | • PostgreSQL & Supabase URL auto-handling (`postgresql://` vs `postgres://`)<br>• Production connection pooling (`pool_pre_ping`, recycle 300s)<br>• Clean Python 3.12+ `datetime.now(timezone.utc)` migration<br>• Automated Alembic migrations on startup | **Critical** |
| **Phase 2** | **Security & Multi-Tenancy** | • Cryptographic Clerk JWT / JWKS token validation<br>• Strict multi-tenant isolation on all invoice/promise queries<br>• Rate limiting (`slowapi`) on public and webhook endpoints<br>• Webhook replay protection & idempotency keys | **Critical** |
| **Phase 3** | **Razorpay Real-World Payments** | • Seamless Live (`rzp_live_...`) & Test (`rzp_test_...`) key switching<br>• Official HMAC-SHA256 webhook signature verification<br>• Frontend Razorpay checkout with live payment feedback<br>• Dynamic payment link generation embedded in reminder emails | **High** |
| **Phase 4** | **LLM & RAG Hardening** | • Google Gemini 2.5 Flash / 1.5 Flash API connector with retries<br>• Fallback date parsing heuristic if LLM times out<br>• Strict JSON Schema validation for promise extraction | **High** |
| **Phase 5** | **Automated Recovery Scheduler** | • Persistent background cron scheduler (`APScheduler` in FastAPI lifespan)<br>• Automated daily sweeps for overdue invoices, touches, and broken promises<br>• Cooldown window enforcement & touch cap guardrails | **High** |
| **Phase 6** | **Email & Delivery Pipeline** | • Transactional email dispatch via Resend API / SMTP<br>• Responsive HTML email templates with dynamic Razorpay button<br>• Delivery status tracking in `ActionLog` | **Medium** |
| **Phase 7** | **Cloud Deployment & CI/CD** | • Multi-stage Dockerfile for Backend & Frontend<br>• Docker Compose for complete one-command local/VPS deployment<br>• Production configuration files for Render, Vercel, Railway, and Fly.io | **High** |

---

## 🔐 3. Production Environment Configuration Checklist

```ini
# --- Core Server ---
ENVIRONMENT=production
APP_VERSION=1.2.0
PORT=8000
ALLOWED_ORIGINS=https://smartinvoice.yourdomain.com,https://smartinvoice-frontend.vercel.app

# --- Database ---
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres

# --- Razorpay Credentials ---
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_HMAC_SECRET

# --- Google Gemini / LLM ---
LLM_PROVIDER=gemini
LLM_API_KEY=YOUR_GEMINI_API_KEY

# --- Transactional Email (Resend) ---
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
SENDER_EMAIL=billing@yourdomain.com
DEFAULT_RECIPIENT_EMAIL=finance@yourdomain.com

# --- Clerk Authentication ---
CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX

# --- Monitoring (Optional) ---
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 🚀 4. Deployment Strategies

### Strategy A: Vercel (Frontend) + Render / Railway (Backend)
- **Frontend**: Deploy `frontend/` to Vercel with `VITE_API_URL=https://api.yourdomain.com` and `VITE_CLERK_PUBLISHABLE_KEY`.
- **Backend**: Deploy `backend/` to Render/Railway as Python Web Service using `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`.
- **Database**: Free Managed PostgreSQL on Supabase or Neon.

### Strategy B: Unified Docker Deployment (Single VPS or AWS ECS / DigitalOcean)
- Single `docker-compose.yml` deploying FastAPI backend, React static SPA via Nginx, and PostgreSQL.
