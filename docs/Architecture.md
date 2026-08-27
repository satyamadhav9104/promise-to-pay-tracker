# SMARTINVOICE — Architecture Explainer

> **Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery**
Autonomous B2B Promise-to-Pay Tracker, Closed-Loop Razorpay Webhook Verification, and RAG Cash Flow Advisor.
> 

<aside>
💡

SMARTINVOICE combines a **deterministic state machine** (so accounting never gets corrupted by AI hallucination) with a **stateful LangGraph AI agent** (so recovery outreach is smart and personalized) — bounded by strict compliance rules and kept in sync in real time via Razorpay webhooks.

</aside>

# 1. High-Level System Overview

The full request path: client UI → API gateway → state machine/rules engine → AI agent → database & Razorpay.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (React + Vite + Tailwind)"]
        UI_DASH["Executive Dashboard (AR vs AP)"]
        UI_HITL["Human-in-the-Loop Promise Reviewer"]
        UI_COPILOT["RAG AI Cash Flow Copilot"]
        UI_AUDIT["Audit Trail Viewer"]
        UI_PAY["Razorpay Payment Modal"]
    end

    subgraph APILayer ["API Gateway (FastAPI)"]
        AUTH["Multi-Tenant Auth Guard"]
        IDEMP["Idempotency Middleware"]
        ROUTERS["API Routers"]
    end

    subgraph StateMachineLayer ["Deterministic State Machine & Rules Engine"]
        SM["State Transition Engine"]
        RULES["Compliance Rules Engine"]
        SCHED["Recovery Batch Scheduler"]
    end

    subgraph AgentLayer ["LangGraph Recovery Agent"]
        N_RET["1. Context Retrieval"]
        N_INT["2. Intent & Date Extractor (Gemini 2.5)"]
        N_GRD["3. Guardrail Supervisor"]
        N_HITL["4. HITL Approval Router"]
        N_RAG["5. RAG Nudge Generator"]
        N_EXEC["6. Action Dispatcher"]
    end

    subgraph DataLayer ["Persistence & Integration"]
        DB[("Relational DB")]
        RZP_API["Razorpay Payment Link API"]
        RZP_HOOK["Razorpay Webhook Receiver"]
    end

    ClientLayer -->|REST/HTTPS| AUTH
    AUTH --> IDEMP
    IDEMP --> ROUTERS

    ROUTERS --> SM
    SCHED --> RULES
    RULES --> SM

    SM <-->|Orchestration| AgentLayer
    N_RET --> N_INT
    N_INT --> N_GRD
    N_GRD -->|Needs Approval| N_HITL
    N_GRD -->|Automated OK| N_RAG
    N_HITL --> UI_HITL
    N_RAG --> N_EXEC
    N_EXEC --> SM

    SM -->|State Commits & Logs| DB
    N_RET -->|Fetch Profile & History| DB
    ROUTERS --> RZP_API
    RZP_HOOK -->|Verify & Settle| SM
    RZP_API -.->|Payment Links| ClientLayer
```

<aside>
🧩

**Why this layering matters:** the AI agent can only *propose* actions — the deterministic state machine is the sole authority that commits state changes. This means an LLM hallucination can never directly corrupt the ledger.

</aside>

---

# 2. Invoice Lifecycle (State Machine)

Every invoice moves through a strict, auditable set of states. This is the backbone that keeps the system trustworthy.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Invoice Created
    DRAFT --> SENT : Dispatched to Customer
    SENT --> OVERDUE : Due Date Passed

    OVERDUE --> PROMISE_MADE : Customer Gives Date (HITL Approved)
    OVERDUE --> DISPUTED : Customer Disputes Invoice
    OVERDUE --> ESCALATED : Max 3 Touches / Broken Promise

    PROMISE_MADE --> PROMISE_KEPT : Webhook Verifies Payment
    PROMISE_MADE --> PROMISE_BROKEN : Promise Date Passed, No Payment

    PROMISE_BROKEN --> ESCALATED : Strict Escalation Policy
    PROMISE_BROKEN --> OVERDUE : Grace Period Re-evaluation

    SENT --> PAID : Instant Settlement
    OVERDUE --> PAID : Instant Settlement
    PROMISE_MADE --> PAID : Instant Settlement
    PROMISE_KEPT --> PAID : Ledger Reconciled

    PAID --> [*]
```

- State reference table
    
    
    | **State** | **Description** | **Recovery Behavior** |
    | --- | --- | --- |
    | DRAFT | Invoice created, unissued | Inactive |
    | SENT | Dispatched to client | Monitored until due date |
    | OVERDUE | Past due, no promise | Autonomous RAG nudge evaluation active |
    | PROMISE_MADE | Client promised date T | All automated nudges paused until T |
    | PROMISE_KEPT | Paid on/before T | Success logged, all actions stop |
    | PROMISE_BROKEN | T passed, no payment | Escalation flag raised |
    | PAID | Fully settled | Terminal state; complete halt |
    | DISPUTED | Client flagged billing issue | Paused for human resolution |
    | ESCALATED | 3 touches exhausted / broken promise | Routed to Senior Finance Executive |

---

# 3. LangGraph Recovery Agent (the "brain")

A cyclical, stateful graph that decides what to do about each overdue invoice.

```mermaid
flowchart LR
    START((START)) --> RETRIEVE["1. Context Retrieval"]
    RETRIEVE --> EXTRACT["2. Intent & Date Extractor"]
    EXTRACT --> SUPERVISOR{"3. Guardrail Supervisor"}

    SUPERVISOR -->|Rule Violation / Max Touches| BLOCKED["Log Blocked Action"]
    SUPERVISOR -->|Low Confidence / Complex| HITL_NODE["4. HITL Routing"]
    SUPERVISOR -->|Eligible| RAG_NUDGE["5. RAG Nudge Generator"]

    HITL_NODE --> HUMAN_DECISION{"Human Review"}
    HUMAN_DECISION -->|Approved| COMMIT_PROMISE["Commit Promise Date"]
    HUMAN_DECISION -->|Rejected| ESCALATE_INV["Escalate Invoice"]

    RAG_NUDGE --> DISPATCH["6. Execution & Dispatcher"]
    COMMIT_PROMISE --> DISPATCH
    ESCALATE_INV --> DISPATCH
    BLOCKED --> DISPATCH
    DISPATCH --> AUDIT_LOG[("Immutable ActionLog")]
    AUDIT_LOG --> END_NODE((END))
```

**What each node does:**

- **Context Retrieval** — pulls customer reliability rating, payment history, invoice details, past touches
- **Intent & Date Extractor** — Gemini 2.5 converts natural language ("next Wednesday post-audit") into ISO-8601 dates
- **Guardrail Supervisor** — checks business rules before anything goes out
- **HITL Routing** — sends ambiguous cases to a human for one-click approval
- **RAG Nudge Generator** — writes personalized recovery messages per channel (Email/WhatsApp/SMS)
- **Execution & Dispatcher** — commits DB changes, sends the message, writes the audit log

---

# 4. "The Bar" — Compliance & Stopping Rules

Hard invariants that stop the AI from spamming customers or acting outside policy.

```mermaid
flowchart TD
    EVAL["Evaluate Invoice for Recovery Action"] --> C1{"Status is PAID, DRAFT, or DISPUTED?"}
    C1 -- Yes --> STOP1["Block: Terminal State Invariant"]
    C1 -- No --> C2{"Active Promise or Claim Present?"}

    C2 -- Yes --> STOP2["Block: Promise Grace Period Active"]
    C2 -- No --> C3{"Touch Count >= 3?"}

    C3 -- Yes --> STOP3["Block: Max Touches Exhausted -> ESCALATE"]
    C3 -- No --> C4{"Within 48h Cooldown?"}

    C4 -- Yes --> STOP4["Block: Cooldown Active"]
    C4 -- No --> DISPATCH_OK["Allow RAG Nudge Generation & Dispatch"]
```

<aside>
🛑

**Key invariants:** max 3 autonomous touches per invoice · channel escalation Email → WhatsApp → urgent SMS · active promises silence all reminders · a payment claim pauses nudges until webhook/bank verification · every evaluation (allowed or blocked) is written to `action_logs`.

</aside>

---

# 5. Closed-Loop Razorpay Webhook Verification

How a real payment turns into a verified, atomic state change — this is what makes the recovery loop trustworthy.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as B2B Customer
    participant RZP as Razorpay Gateway
    participant Webhook as FastAPI Webhook Handler
    participant SM as State Machine & Rules Engine
    participant DB as Relational Database
    actor Controller as Finance Controller

    Customer->>RZP: Completes Invoice Payment via Link
    RZP->>Webhook: POST /api/webhooks/razorpay (Payload + Signature)
    Webhook->>Webhook: Verify HMAC-SHA256 Signature
    alt Signature Valid
        Webhook->>SM: Trigger Payment Settlement Event
        SM->>DB: Atomic Update: Invoice -> PAID
        SM->>DB: Atomic Update: Active Promises -> KEPT
        SM->>DB: Reset Touch Count, Cancel Pending Schedulers
        SM->>DB: Append ActionLog (payment_verified_webhook)
        Webhook-->>RZP: HTTP 200 OK
        Controller->>DB: Reads Updated Dashboard & Audit Lineage
    else Signature Invalid
        Webhook-->>RZP: HTTP 400 Bad Request (Fraud/Tamper Alert)
    end
```

---

# 6. RAG Pipeline (Cash Flow Copilot)

How the system answers natural-language questions and drafts nudges, grounded in real data (not hallucinated).

```mermaid
flowchart TD
    subgraph TriggerLayer ["1. Trigger & Query Input"]
        Q1["Cron: Overdue Invoices"]
        Q2["Inbound Customer Reply"]
        Q3["Executive Prompt (Ask Receivables)"]
    end

    subgraph RetrievalLayer ["2. Structured Context Retrieval"]
        DB_FETCH[("Database Query")]
        C_INV["Invoice Metadata"]
        C_CUST["Customer Profile"]
        C_LOGS["Historical Audit Trail"]
        C_AP["Accounts Payable (Cashflow Context)"]
    end

    subgraph AugmentationLayer ["3. Prompt Augmentation"]
        PROMPT_ASM["Structured Context Assembly + Guardrail Directives"]
    end

    subgraph LLMLayer ["4. Inference"]
        GEMINI["Gemini 2.5 Pro / Flash"]
    end

    subgraph OutputLayer ["5. Structured Output"]
        OUT_NUDGE["Personalized Nudge Draft"]
        OUT_INTENT["Extracted Promise Date + Confidence"]
        OUT_ADVICE["Cash Flow Timing Advisory"]
    end

    TriggerLayer --> DB_FETCH
    DB_FETCH --> C_INV & C_CUST & C_LOGS & C_AP
    C_INV & C_CUST & C_LOGS & C_AP --> PROMPT_ASM
    PROMPT_ASM --> GEMINI
    GEMINI --> OutputLayer
```

---

# 7. Database Schema (ER Diagram)

```mermaid
erDiagram
    USERS ||--o{ INVOICES : "owns"
    INVOICES ||--o{ PROMISES : "has many"
    INVOICES ||--o{ ACTION_LOGS : "logs events"

    USERS {
        string user_id PK
        string email
        string company_name
        datetime created_at
    }

    INVOICES {
        string id PK
        string user_id FK
        string invoice_number
        string customer_name
        string customer_email
        string customer_phone
        float amount
        string currency
        date due_date
        string status
        int touch_count
        datetime last_touch_at
        datetime created_at
        datetime updated_at
    }

    PROMISES {
        string id PK
        string invoice_id FK
        date promised_date
        float promised_amount
        float confidence_score
        string status
        string raw_reply_text
        string created_by
        datetime created_at
        datetime updated_at
    }

    ACTION_LOGS {
        string id PK
        string invoice_id FK
        string action_type
        string rule_applied
        string rule_that_blocked
        string actor
        string channel
        json metadata_payload
        datetime timestamp
    }

    IDEMPOTENCY_KEYS {
        string key PK
        string request_path
        json response_data
        int status_code
        datetime expires_at
    }
```

---

# 8. Production Deployment Topology

```mermaid
flowchart TB
    subgraph EdgeLayer ["Edge & CDN"]
        CF["Cloudflare DNS & SSL"]
    end

    subgraph ClientHost ["Frontend Hosting (Vercel / Render Static)"]
        SPA["React 18 SPA (Vite Build)"]
    end

    subgraph BackendCluster ["Backend Cluster (Render / Docker)"]
        GUNICORN["Uvicorn/Gunicorn ASGI Workers"]
        API_APP["FastAPI Application"]
        BG_WORKER["Background Scheduler (APScheduler)"]
    end

    subgraph ManagedServices ["External Managed Services"]
        DB_PROD[("Managed MySQL/PostgreSQL")]
        GEMINI_API["Gemini 2.5 Generative AI API"]
        RZP_SERVICE["Razorpay Merchant & Webhook Gateway"]
        EMAIL_SVC["Transactional Mail (SendGrid/SES/SMTP)"]
    end

    CF --> SPA
    CF --> GUNICORN
    GUNICORN --> API_APP
    API_APP --> BG_WORKER
    API_APP --> DB_PROD
    API_APP --> GEMINI_API
    API_APP --> RZP_SERVICE
    API_APP --> EMAIL_SVC
    RZP_SERVICE -->|Webhooks over HTTPS| API_APP
```

---

# 9. Resilience & Security Guardrails

1. **Multi-Tenant Data Privacy** — every query filters by `user_id`; no cross-tenant leakage at the ORM layer
2. **Deterministic LLM Output Validation** — Pydantic/JSON schemas validate every Gemini response before it can change system state
3. **Fail-Safe Fallback Parser** — regex-based date extraction if Gemini latency spikes or rate limits hit
4. **Idempotent Webhook Processing** — duplicate `payment_id` deliveries can't create duplicate credits
5. **Full Action Auditability** — every permitted, blocked, or escalated decision is written to `action_logs` with explainable telemetry
