# Promise-to-Pay Tracker — Complete Requirements

Track 03: AI Revenue Recovery — Razorpay AI Buildathon

## 1. Problem statement
B2B invoice collections lose money not at the "unpaid" stage but at the "promised but not tracked" stage — a customer commits to a payment date, nobody systematically verifies the promise was kept, and follow-up either never happens or happens in a way that risks the relationship. This project builds a closed-loop agent that extracts payment promises from customer communication, verifies them against real payment events, and executes a bounded, auditable escalation sequence when promises are broken.

## 2. Key Requirements
- **FR1-FR4**: Single transition function `transition_invoice_status` enforcing state machine invariants.
- **FR5-FR9**: LLM structured extraction of `promised_date`, `confidence_score`, `reasoning`. Confidence threshold (< 0.7) routes to human review.
- **FR10-FR13**: Razorpay test-mode integration, webhook handler for `payment.captured`, atomic transition to `PAID`.
- **FR14-FR20**: Scheduler tick engine, escalation ladder (Email -> Email -> Simulated WhatsApp), hard caps (max 3 touches), cooldown enforcement (4 days).
- **FR21-FR23**: Race condition safety — "I already paid" claims pause automated actions via `PENDING_VERIFICATION` state until webhook verification.
- **FR24-FR26**: Complete immutable audit trail (`ActionLog`) logging every decision and stopping rule.
- **FR27-FR30**: React Web UI with expandable plain-language audit log and batch recovery metrics.
