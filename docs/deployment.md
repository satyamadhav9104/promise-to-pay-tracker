# Production Deployment Guide

This guide outlines production deployment strategies for the **Promise-to-Pay Tracker** platform across Docker, Render, Vercel, and Cloud infrastructure.

---

## 1. Deploying via Docker Compose (Single Server / VPS)

The easiest way to run the entire stack (Nginx Frontend + Gunicorn FastAPI Backend + MySQL Database) on a single server:

```bash
# 1. Clone repository
git clone https://github.com/satyamadhav9104/promise-to-pay-tracker.git
cd promise-to-pay-tracker

# 2. Build and launch containers in detached mode
docker compose up -d --build
```

### Accessing your stack:
- **Frontend App**: `http://<your-server-ip>`
- **Backend API**: `http://<your-server-ip>:8000`
- **Health Check**: `http://<your-server-ip>:8000/health`

---

## 2. Deploying on Cloud Platforms (Render + Vercel)

### Option A: Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com).
2. Import `satyamadhav9104/promise-to-pay-tracker`.
3. Set Environment Variable:
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_Y29uY3JldGUtc2F3ZmlzaC0zMjQ1LmNsZXJrLmFjY291bnRzLmRldiQ`
4. Click **Deploy**. Vercel will automatically detect `vercel.json` and build the app.

### Option B: Backend on Render.com
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Select **New Blueprints** and connect `satyamadhav9104/promise-to-pay-tracker`.
3. Render will parse `render.yaml` and provision:
   - Backend Web Service (FastAPI + Gunicorn)
   - Frontend Static Site

---

## 3. Production Health Checks & Monitoring

* **Health Endpoint**: `GET /health`
* **Response Payload**:
  ```json
  {
    "status": "ok",
    "database": "healthy",
    "version": "1.0.0"
  }
  ```
* Use this endpoint for AWS ECS / GCP Cloud Run / Kubernetes liveness and readiness probes.
