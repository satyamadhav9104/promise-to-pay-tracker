# 🚀 SMARTINVOICE — AI Revenue Recovery Engine
> **Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery**  
> *Autonomous B2B Promise-to-Pay Tracker, Closed-Loop Razorpay Webhook Verification, and RAG Cash Flow Advisor.*

[![CI/CD Pipeline](https://github.com/satyamadhav9104/promise-to-pay-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/satyamadhav9104/promise-to-pay-tracker/actions)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat&logo=heroku)](https://smartinvoice-recovery-ai-dd8c39748dc8.herokuapp.com)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)

---

## 🎬 Live Demo

👉 **[Launch Live Demo Application](https://smartinvoice-recovery-ai-dd8c39748dc8.herokuapp.com)**

![SMARTINVOICE Live Demo](docs/demo.jpg)  

![SMARTINVOICE Live Demo Preview](docs/demo_preview.svg)

---

## 📌 Executive Summary

Revenue loss in B2B digital commerce rarely happens in a single clean event. It degrades over time through abandoned checkouts, overdue invoices, broken payment commitments, and fragmented payment gateways. 

**SMARTINVOICE** is an AI-native revenue recovery agent built specifically for the **Razorpay AI Buildathon 2026 (Track 03)**. It closes the operational loop from **detecting revenue at risk**, **extracting customer promise intent via LLMs**, **enforcing strict compliance & stopping rules**, and **instantly resolving invoices via closed-loop Razorpay Webhooks**.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["React + Tailwind CSS Frontend"]
        UI["Dashboard & Dual Metrics"]
        HITL["Human-in-the-Loop Approval UI"]
        RAG_UI["AI Cash Flow Advice Card"]
    end

    subgraph CoreEngine ["FastAPI Backend Engine"]
        API["REST API Routes (/api/invoices, /api/promises, /api/rag)"]
        SM["Deterministic State Machine (state_machine.py)"]
        RULES["Bounded Rule Engine (rules.py)"]
        SCHED["Batch Recovery Evaluator (scheduler.py)"]
    end

    subgraph AIPipeline ["LLM & RAG Pipeline"]
        GEMINI["Google Gemini 2.5 LLM"]
        RAG["RAG Context Retriever (rag_service.py)"]
    end

    subgraph Integration ["Razorpay & Audit Log"]
        RZP_HOOK["Razorpay Webhook Handler (webhooks.py)"]
        AUDIT["Immutable ActionLog DB (action_logs)"]
    end

    UI --> API
    API --> SM
    SM --> RULES
    RULES -->|Check Max 3 Touches & Pauses| SCHED
    SCHED -->|Retrieve Customer History| RAG
    RAG --> GEMINI
    GEMINI -->|Extract Date / Draft Nudge| HITL
    HITL -->|Approve Date| SM
    RZP_HOOK -->|Verify HMAC Signature| SM
    SM -->|Transition to PAID| AUDIT
```

---

## 🌟 Key Features & Buildathon Rubric Alignment

### 1. 🎯 Bounded AI Revenue Recovery Engine
- **Revenue at Risk Calculation**: Scans all active B2B invoices and dynamically calculates capital tied up in overdue or broken promises.
- **Batch Evaluation**: Evaluates batch invoices against rule conditions without human fatigue.
- **Implementation**: [`backend/app/services/scheduler.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/services/scheduler.py)

---

### 2. 🧠 Natural Language Promise Extractor (Google Gemini 2.5)
- **Customer Intent Parsing**: When a customer replies (e.g., *"We will process payment for invoice INV-1001 by August 23"*), Gemini parses the text, extracts the date, and calculates confidence score.
- **Human-in-the-Loop (HITL) Approval**: Displays a purple **Mail Reply Received** review card. The finance manager can click **`✓ Approve Date`** (updates invoice due date to Aug 23 and sets status to `PROMISE_MADE`) or **`✕ Reject Date`** (escalates invoice).
- **Implementation**: [`backend/app/api/routes/promises.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/api/routes/promises.py) & [`frontend/src/components/InvoiceList.jsx`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/frontend/src/components/InvoiceList.jsx)

---

### 3. 💳 Closed-Loop Razorpay Webhook Resolution
- **Instant Payment Verification**: Outbound emails embed a direct Razorpay payment verification link.
- **HMAC-SHA256 Verification**: When the customer pays via Razorpay, the webhook endpoint (`POST /api/webhooks/razorpay`) verifies the signature, atomically marks the invoice as **`PAID`**, marks active promises as **`KEPT`**, and immediately halts all further automated nudges.
- **Implementation**: [`backend/app/api/routes/webhooks.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/api/routes/webhooks.py)

---

### 4. 📊 Accounts Receivable vs. Accounts Payable Dual Engine
- **Receivables (Money to Receive)**: Tracks customer collection pipeline.
- **Payables (Pending Vendor Bills)**: Manages vendor bill commitments.
- **RAG AI Cash Flow Advisor**: Uses RAG to analyze expected customer receivables against vendor bill due dates, recommending optimal payment timing (e.g. *"Settle vendor bill for Acme Corp after receivables arrive on Aug 23"*).
- **Implementation**: [`backend/app/services/rag_service.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/services/rag_service.py) & [`backend/app/api/routes/rag.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/api/routes/rag.py)

---

### 5. 🛡️ Compliant Stopping Rules & Audit Trail ("The Bar")
- **Max 3 Touches Rule**: Never spams customers. Stops automated nudges after 3 touches.
- **Claim & Promise Pauses**: Pauses recovery actions when a customer makes an active payment promise or unverified payment claim.
- **Immutable ActionLog**: Logs every decision—including blocked actions (`no_op`)—in the `action_logs` database table with `rule_applied`, `rule_that_blocked`, and `actor` (`ai` | `system` | `human`).
- **Implementation**: [`backend/app/core/rules.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/core/rules.py) & [`frontend/src/components/AuditTrail.jsx`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/frontend/src/components/AuditTrail.jsx)

---

### 6. 🔒 Multi-Tenancy Isolation & 50-Invoice Demo Mode
- **Account Isolation**: `X-User-Id` header filtering ensures User A can **never** view or access User B's invoices.
- **50 B2B Mock Invoices**: Demo mode renders 50 realistic mock invoices across top tech companies (Zomato, Swiggy, Razorpay Merchant Services, Flipkart, etc.).
- **Strict Separation**: Demo invoices are hidden when a user signs in, and user real invoices are hidden in demo mode.
- **Implementation**: [`frontend/src/utils/mockData.js`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/frontend/src/utils/mockData.js) & [`backend/app/api/routes/invoices.py`](file:///C:/Users/Satyam/OneDrive/Desktop/moneyback%20promise/promise-to-pay-tracker/backend/app/api/routes/invoices.py)

---

## 📊 Summary Rubric Verification Table

| Track 03 Rubric Criterion | Implementation Proof | Status |
| :--- | :--- | :---: |
| **Detect Revenue at Risk** | Batch scan overdue & broken promise capital | ✅ 100% |
| **Bounded Interventions** | Max 3 touches cap & strict cooldown periods | ✅ 100% |
| **LLM Date Intent Extractor** | Gemini 2.5 parsing customer reply strings | ✅ 100% |
| **Human-in-the-Loop** | One-click Approve/Reject date promise card | ✅ 100% |
| **Razorpay Webhook Closed-Loop** | Signature verification & auto-status transition to PAID | ✅ 100% |
| **RAG Cashflow Advice** | Receivables vs Payables optimization | ✅ 100% |
| **Explainable Audit Trail** | Full `ActionLog` DB with `rule_that_blocked` | ✅ 100% |
| **Batch Size & Multi-Tenancy** | 50 Mock Invoices + `X-User-Id` account privacy | ✅ 100% |

---

## 🚀 How to Run Locally

Follow this complete step-by-step guide to run **SMARTINVOICE** on your local machine.

---

### 📋 Prerequisites

Ensure you have the following installed on your system:

| Dependency | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10+` | `3.12+` | Backend FastAPI engine |
| **Node.js** | `18.0+` | `20.0+` | React + Vite frontend framework |
| **npm** | `9.0+` | `10.0+` | Node package manager |
| **Git** | `2.30+` | `Latest` | Version control |
| **Docker** *(Optional)* | `24.0+` | `Latest` | For containerized execution |
| **MySQL** *(Optional)* | `8.0+` | `8.0+` | Database (Embedded SQLite auto-used as zero-config fallback) |

---

### 🛠️ Method 1: Native Local Setup (Recommended for Development)

#### Step 1: Clone Repository & Open Terminal
```bash
git clone https://github.com/satyamadhav9104/promise-to-pay-tracker.git
cd promise-to-pay-tracker
```

#### Step 2: Start Backend Server (FastAPI Engine)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment File (`.env`):
   ```bash
   cp .env.example .env
   ```
   *(Zero-config default settings work out-of-the-box using SQLite and Regex LLM parser if API keys are omitted).*

5. Seed Database with 52 B2B Mock Invoices:
   ```bash
   python scripts/seed_invoices.py
   ```
   *Output: `Successfully seeded 52 synthetic invoices into database.`*

6. Launch the FastAPI Uvicorn Server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - 🌐 **API Root**: `http://127.0.0.1:8000`
   - 📚 **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`
   - 📖 **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

#### Step 3: Start Frontend App (React + Vite + Tailwind)

1. Open a **new terminal tab/window** and navigate to `frontend`:
   ```bash
   cd promise-to-pay-tracker/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Launch Vite Development Server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit:
   - **`http://localhost:3000`** (or `http://localhost:5173`)

---

### 🐳 Method 2: Docker & Docker Compose Setup

If you prefer containerized deployment, launch MySQL, FastAPI, and Nginx in Docker:

```bash
# Run from repository root
docker-compose up --build
```

- **Frontend Container**: `http://localhost:80`
- **Backend API**: `http://localhost:8000`
- **MySQL Container**: Port `3306`

To stop all containers:
```bash
docker-compose down
```

---

### ⚙️ Environment Variables Reference

| Variable Key | Description | Default / Recommended |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./promise_to_pay.db` (or `mysql+pymysql://root:password@localhost:3306/promise_to_pay_db`) |
| `LLM_PROVIDER` | AI LLM Engine provider (`gemini` / `anthropic`) | `gemini` |
| `LLM_API_KEY` | Google Gemini or Anthropic API Key | `your_api_key` (Regex parser fallback if empty) |
| `RAZORPAY_KEY_ID` | Razorpay API Test Key ID | `rzp_test_TSRi5elb8AdVBV` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Test Key Secret | `mock_secret_12345` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for HMAC-SHA256 Signature Verification | `your_webhook_secret` |
| `RESEND_API_KEY` | Resend API Key for sending B2B reminder emails | `re_...` |
| `MAX_TOUCHES_PER_INVOICE` | Max allowed collection outreach touches | `3` |
| `COOLDOWN_DAYS_BETWEEN_TOUCHES` | Cooldown period between automated touches | `4` |
| `PROMISE_CONFIDENCE_THRESHOLD` | Threshold for auto-approving promise dates | `0.7` |
| `CLERK_PUBLISHABLE_KEY` | Clerk Authentication publishable key | `pk_test_...` |

---

### 🧪 Running Unit & Integration Tests

To run the complete test suite (State machine, compliance rules, LLM extraction, race conditions, Razorpay webhooks):

```bash
cd backend
python -m pytest
```

Run specific test modules:
```bash
# Test Razorpay Webhooks
python -m pytest tests/integration/test_webhook.py

# Test Compliance Rules & Touch Cap
python -m pytest tests/unit/test_rules.py

# Test LLM Customer Reply Extractor
python -m pytest tests/unit/test_llm_extractor.py
```

---

### 🔌 API Endpoints Cheat Sheet

Once backend is running at `http://localhost:8000`:
- **Health Check**: `GET /health`
- **List Invoices**: `GET /api/invoices`
- **Extract Customer Promise**: `POST /api/promises/extract`
  ```json
  {
    "invoice_id": "INV-1001",
    "reply_text": "We will process payment for invoice INV-1001 by 2026-09-01."
  }
  ```
- **Approve Promise (HITL)**: `POST /api/promises/{promise_id}/approve`
- **Razorpay Webhook Endpoint**: `POST /api/webhooks/razorpay`
- **RAG Cash Flow Advice**: `GET /api/rag/advise`
- **Audit Logs**: `GET /api/audit/logs`

---

### ❓ Frequently Asked Questions & Troubleshooting

#### 1. **MySQL connection failed error?**
> **No action required.** The app automatically detects if MySQL is offline and seamlessly falls back to an embedded SQLite database (`sqlite:///./promise_to_pay.db`).

#### 2. **ModuleNotFoundError when running uvicorn or seed scripts?**
> Ensure your virtual environment is active (`source venv/bin/activate` or `.\venv\Scripts\Activate.ps1`) and execute commands as `python -m uvicorn app.main:app`.

#### 3. **Port 8000 or 3000 already in use?**
> Specify a custom port for uvicorn: `python -m uvicorn app.main:app --port 8001`.


