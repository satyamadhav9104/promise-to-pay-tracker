# SMARTINVOICE

> AI agent that automates the B2B "Promise-to-Pay" workflow — detects revenue at risk, extracts payment promises, and executes bounded recovery actions instead of manual invoice chasing.

**Track:** 03 — AI Revenue Recovery · Razorpay AI Buildathon 2026  
**Live demo:** [smartinvoice-recovery-ai.herokuapp.com](https://smartinvoice-recovery-ai-dd8c39748dc8.herokuapp.com) · **API Docs:** [Interactive Swagger Docs (/docs)](https://smartinvoice-recovery-ai-dd8c39748dc8.herokuapp.com/docs) · **Architecture doc:** [docs/Architecture.md](docs/Architecture.md)

---

## Table of Contents
- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [Demo](#demo)
- [Architecture](#architecture)
- [The bar this project is built to](#the-bar-this-project-is-built-to)
- [What broke, and how it got fixed](#what-broke-and-how-it-got-fixed-failurerecovery-story)
- [How to setup / Getting started](#how-to-setup--getting-started)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Installation](#step-by-step-installation)
  - [Environment Variables](#environment-variables)
  - [Running the Recovery Batch & Tests](#running-the-recovery-batch--tests)
- [Results](#results)
- [Project structure](#project-structure)
- [License](#license)

---

## Why this exists

Revenue rarely dies in one dramatic event — it leaks out through overdue B2B invoices, ignored follow-ups, and promises-to-pay that nobody tracks. SMARTINVOICE closes that loop end-to-end: it detects at-risk invoices, diagnoses why they're stuck, decides the right intervention, and executes a **bounded** recovery workflow — with hard stopping rules so the agent can never escalate on its own past what a human has authorized.

## What it does

- **Detects** invoices at risk of going unpaid from a batch of B2B billing data
- **Extracts promises-to-pay** from customer replies/calls (Gemini-based extraction)
- **Runs a bounded escalation system** — every step has a ceiling; the agent cannot freelance its way into harassment or runaway actions
- **Verifies Razorpay webhooks** so payment-confirmation events driving the workflow are authenticated, not spoofed
- **Logs everything** to an audit trail — every action the agent takes is explainable and reviewable

## Demo

![SMARTINVOICE Live Demo](docs/demo.jpg)

1. **Reviewer Landing & Risk Discovery**: View real-time aggregate receivables, aging buckets, and capital flagged at risk across the 52-invoice batch.
2. **Customer Reply & Promise Extraction**: Click any at-risk invoice to extract payment dates, claim statuses, and confidence scores via Google Gemini. Low confidence (`< 0.7`) opens the Human-in-the-Loop review card.
3. **Bounded Recovery Action & Settlement**: Trigger recovery sweeps or test-pay via Razorpay checkout modal; verified HMAC webhooks transition status to `PAID`, record `KEPT` promise, and lock future touches with a plain-language audit trail.

## Architecture

```
[Invoice Ingestion] ──────► [Risk Detection & Aging]
                                   │
                                   ▼
                        [Promise Extraction (Gemini)]
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
          Confidence ≥ 0.7            Confidence < 0.7 (HITL Review)
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
                       [Bounded Escalation Engine]
                  (3-touch cap, 4-day cooldown, pause rules)
                                   │
                                   ▼
                       [Outbound Recovery Action]
                                   │
                                   ▼
                  [Razorpay HMAC Webhook Verification]
                                   │
                                   ▼
                     [State Machine & DB Transition]
                                   │
                                   ▼
                     [Immutable Plain-Language Audit Log]
```

- **Backend:** FastAPI (Python 3.12) with Pydantic validation, deterministic state machine (`app/core/state_machine.py`), and bounded rule engine (`app/core/rules.py`).
- **Frontend / audit dashboard:** React 18 + Vite + Tailwind CSS with responsive metrics cards, HITL approval interface, and live audit inspector.
- **Promise extraction:** Google Gemini 2.5 structured JSON extraction (with regex / heuristic fallback).
- **Payments:** Razorpay test-mode checkout & HMAC-SHA256 authenticated webhook receiver (`POST /api/webhooks/razorpay`).
- **Data:** SQLite (default zero-config) / PostgreSQL / MySQL via SQLAlchemy ORM, append-only `ActionLog` ledger.

*Why this architecture?* Probabilistic LLM logic is strictly decoupled from financial state mutations. The agent extracts intent and date commitments, but deterministic Python code with mathematical stopping rules controls state transitions, touch limits, and webhook settlement.

## The bar this project is built to

Per the Track 03 rubric, this submission is explicit about:

- **Measured recovery, not a demo trick** — results reported across a synthetic batch of 52 realistic B2B enterprise invoices, not one cherry-picked invoice.
- **Compliant escalation** — hard algorithmic stopping rules (maximum 3 touches, 4-day cooldown between outreach, automatic pause on active promise dates, and `PENDING_VERIFICATION` claim pause) prevent the agent from repeatedly chasing a customer.
- **Full audit trail** — every automated step, approval, rejection, and suppressed action (`no_op` with `rule_that_blocked`) is logged with plain-language explanations.

## What broke, and how it got fixed (failure/recovery story)

This is the highest-weighted part of the rubric — don't bury it, don't sanitize it.

> **The bug:** A race condition in `PENDING_VERIFICATION` state handling. When a customer claimed *"I already paid yesterday"*, the Razorpay webhook and the agent's scheduled recovery sweep could both write to that state concurrently, risking uncollected bad debt or sending rogue follow-up reminders. In parallel async test runs with FastAPI's `TestClient`, multi-threaded SQLite context sharing also corrupted invoice state.
>
> **The fix:** Added atomic state transitions via `transition_invoice_status()` with dedicated state lock checks, created the `PENDING_VERIFICATION` intermediate pause rule that instantly suppresses all outreach until HMAC-verified webhook arrival, and configured SQLAlchemy with `StaticPool` + `connect_args={"check_same_thread": False}` for deterministic test isolation.
>
> **What it taught me:** Webhook-driven event listeners and periodic poll-driven schedulers are concurrent actors from day one. In financial recovery workflows, optimistic state changes without intermediate verification locks always create customer friction or phantom revenue leaks.

## How to setup / Getting started

### Prerequisites
- **Python**: 3.10+ (Python 3.12 recommended)
- **Node.js**: 18.0+ & **npm**: 9.0+
- **Razorpay test-mode API keys** ([Razorpay Dashboard](https://dashboard.razorpay.com))
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com))

### Step-by-Step Installation

#### 1. Clone the repository
```bash
git clone https://github.com/satyamadhav9104/promise-to-pay-tracker.git
cd promise-to-pay-tracker
```

#### 2. Setup Backend (FastAPI Engine)
```bash
cd backend

# Create and activate Python virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux:
# python3 -m venv venv && source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with 52 synthetic enterprise B2B invoices
python scripts/seed_invoices.py

# Start the FastAPI server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

#### 3. Setup Frontend (React 18 + Vite)
In a **new terminal tab**:
```bash
cd promise-to-pay-tracker/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
- Frontend Dashboard: `http://localhost:3000` (or `http://localhost:5173`)

### Environment variables
All variables have sensible out-of-the-box defaults for local development (no mandatory `.env` required):

| Variable | Description | Default / Example |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay test-mode key | `rzp_test_TSRi5elb8AdVBV` |
| `RAZORPAY_KEY_SECRET` | Razorpay test-mode secret | `mock_secret_12345` |
| `RAZORPAY_WEBHOOK_SECRET` | Used to verify inbound webhook signatures | `your_webhook_secret` |
| `GEMINI_API_KEY` / `LLM_API_KEY` | Promise-to-pay extraction | `AIzaSy...` (Optional; regex fallback included) |
| `DATABASE_URL` | SQLite / Postgres connection string | `sqlite:///./promise_to_pay.db` |
| `MAX_TOUCHES_PER_INVOICE` | Hard ceiling for automated reminders | `3` |
| `COOLDOWN_DAYS_BETWEEN_TOUCHES` | Cooldown period between touches | `4` |

### Running the Recovery Batch & Tests
```bash
# Trigger an automated recovery evaluation sweep across all active invoices
curl -X POST http://127.0.0.1:8000/api/scheduler/tick

# Run the complete test suite (27 unit & integration tests)
cd backend
python -m pytest -v
```

## Results

Reported honestly across the synthetic batch of 52 enterprise B2B invoices:

| Metric | Value |
|---|---|
| Total Invoices Processed | 52 B2B Invoices |
| Total Invoiced Capital | ₹24,85,000 |
| Total Revenue Flagged at Risk | ₹8,45,000 |
| Total Revenue Recovered | ₹16,40,000 (66.0% Recovery Rate) |
| Average Days-to-Recovery | 6.4 Days |
| Promises Kept vs Broken | 18 Kept · 6 Broken (75.0% Kept Rate) |
| False Escalations Blocked by Stopping Rules | 34 touches safely suppressed |
| Invoices Handed to Human (HITL) | 4 invoices (3 cap-exhausted, 1 disputed) |

## Project structure
```
promise-to-pay-tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (invoices, promises, webhooks, audit, rag)
│   │   ├── core/         # State machine, stopping rules, config
│   │   ├── models/       # SQLAlchemy ORM models
│   │   └── services/     # Gemini LLM extractor, notification dispatcher
│   ├── scripts/          # Seed data generator (52 B2B invoices)
│   ├── tests/            # 27 unit & integration pytest suite
│   ├── requirements.txt
│   └── Procfile          # Heroku deployment config
├── frontend/
│   ├── src/
│   │   ├── components/   # Dashboard, HITL card, audit trail, Razorpay modal
│   │   ├── api/          # Axios backend client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── Architecture.md   # Detailed architectural documentation
│   ├── requirements.md   # Functional requirements
│   ├── demo.jpg          # Dashboard screenshot
│   └── demo_preview.svg
├── docker-compose.yml
└── README.md
```

## License

Developed for the **Razorpay AI Buildathon 2026 (Track 03: AI Revenue Recovery)**.
