# Bug Log — Promise-to-Pay Tracker

## Bug #1: Unverified Payment Claim Race Condition

### Symptom / Risk
A customer receiving an automated collection email replies with: *"I already paid this invoice yesterday via UPI"*.
In a naive design, either:
1. The text claim is accepted blindly, setting `invoice.status = paid` without bank/webhook verification, leading to uncollected bad debt.
2. Or the text claim is ignored, and the automated scheduler sends another aggressive nudge 2 days later, damaging customer relations.

### Root Cause Analysis
Customer communication is unstructured and unverified. Text claims must pause outbound automated workflows without granting final settlement status (`PAID`).

### Resolution & Architectural Fix
1. Added intermediate state `PENDING_VERIFICATION` (FR21).
2. Customer text claims automatically trigger a transition to `PENDING_VERIFICATION`.
3. In `PENDING_VERIFICATION`, the scheduler tick engine applies stopping rule `pending_verification_pause` (FR22), logging a `no_op` to `ActionLog`.
4. Only a verified Razorpay `payment.captured` webhook (or manual admin override) can resolve an invoice from `PENDING_VERIFICATION` to `PAID` (FR23).
5. Unit & integration test created: `backend/tests/integration/test_race_condition.py`.

---

## Bug #2: SQLite Multi-Threaded Context Sharing in Async FastAPI TestClient

### Symptom
`sqlite3.ProgrammingError: SQLite objects created in a thread can only be used in that same thread.` during API integration tests.

### Root Cause
FastAPI's TestClient runs request handlers on worker threads, while in-memory SQLite (`sqlite:///:memory:`) creates separate isolated databases per connection thread by default.

### Resolution
Configured test database engine with `StaticPool` and `connect_args={"check_same_thread": False}` in `test_webhook.py`.
