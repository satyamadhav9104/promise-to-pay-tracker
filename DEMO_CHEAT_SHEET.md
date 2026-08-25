# Live Demo Cheat Sheet — SmartInvoice

Four things worth showing a judge, in the order they build on each other:

1. The agent reads a customer reply and **decides for itself** whether it is confident enough to act.
2. It **refuses to act** when a guardrail says no — and logs the refusal.
3. A customer *claiming* they paid is **not** enough to close an invoice.
4. Only a **signature-verified** Razorpay webhook closes it.

Target invoice throughout: **`INV-1002` — Apex Cloud Systems, 12,500**

---

## 0. Before recording

Load a clean data set (52 synthetic invoices plus a few sample replies):

```bash
cd backend
python scripts/seed_invoices.py          # wipes and reseeds
python scripts/seed_invoices.py --if-empty   # only seeds if the DB is empty
```

Or skip the terminal entirely: the dashboard's empty state has a **Load demo data** button
(`POST /api/demo/seed`).

Then start both halves:

```bash
cd backend && uvicorn app.main:app --reload     # http://localhost:8000
cd frontend && npm run dev                      # http://localhost:3000
```

> **Sign in — do not click "Try Demo" on the landing page.** That button switches the
> frontend to a static mock dataset, and none of the steps below actually run: no real
> extraction, no guardrails, no webhooks. Every moment in this script needs the live
> backend. If the numbers never change when you act, you are in demo mode.

> **The confidence numbers below assume the offline extractor.** With `LLM_API_KEY` set in
> `backend/.env`, replies go to Gemini and the scores are whatever the model returns — the
> routing still works, but the exact 0.94 / 0.45 will differ, and each reply waits on a
> network call. For a predictable recording, comment out `LLM_API_KEY`: the deterministic
> heuristic extractor is fast, offline, and produces exactly the numbers quoted here.

---

## 1. High confidence — the agent acts on its own

Click **Reply** on `INV-1002` (Apex Cloud Systems, 12,500 — `due_soon`, and one of the
invoices with no reply already seeded against it). The box is pre-filled with a promise
dated a week out, generated relative to today so it never goes stale. Or paste this:

```text
Hi team, we acknowledge invoice INV-1002 for 12,500. We will complete the payment transfer by August 30, 2026.
```

> Recording **after 30 Aug 2026**? Change that date to something in the future. A promise
> for a past date is correctly treated as already broken, which looks like a bug on camera.
> The pre-filled text has no such problem — prefer it if you are unsure.

**What happens, and what to say:**

| On screen | The line to say |
|---|---|
| Confidence **0.94** | "It pulled the date out at 0.94 confidence." |
| Status ➔ **`promise_made`** | "That's above the 0.70 threshold, so it acted without asking me." |
| Due date moves to the promised date | "And it rescheduled to the date the customer actually committed to." |
| Audit row: *Promise accepted automatically (high confidence)* | "Every decision is written down, including why." |

The threshold is real and live-editable on the **Settings** page — raise it above 0.94,
re-run the same reply on another invoice, and the identical text now routes to a human
instead. That is the most convincing 20 seconds in the demo.

## 2. Low confidence — the agent asks a human

Use **Reply** on a *fresh* invoice — `INV-1011`, `INV-1013` or `INV-1014` all work
(`INV-1004` already has this exact reply seeded, so its promise is on screen before you
start):

```text
We are reviewing our cash flow and will try to pay soon.
```

Confidence **0.45**, below the threshold ➔ no status change, no email. It creates a
**review card** with Approve / Reject buttons and logs *"Promise found in customer reply —
needs your approval."*

> This is the pair that matters. Same extractor, same code path, two different decisions,
> and the number that separated them is on screen.

## 3. The guardrail visibly refuses

Seeded **overdue** invoices already carry one touch from two days ago, and the cooldown is
four days — so the guardrail fires on the *first* click, no setup required. Click
**Send Link Email** on any overdue invoice:

- **Amber** toast: "Not sent. Held back — only 2 of 4 cooldown days have passed."

Say: *"The manual button obeys the same cap as the automated sweep — the guardrail belongs
to the system, not to one code path."* Then expand the audit trail: the refusal is recorded
as its own amber row with the rule that caused it.

To show a *successful* send instead, use a `due_soon` invoice (`INV-1017`, `INV-1034`) —
those carry no `last_touch_at`, so the first click goes through and reads "Reminder sent —
that was touch 2 for this invoice" (the seed gives them one prior touch already). Click
again and it is withheld by the cooldown.

To reach the 3-touch handoff, set **Cooldown days** to `0` in Settings and keep clicking:
the invoice stops escalating and hands off to a human rather than chasing forever.

## 4. A payment *claim* does not close an invoice

**Reply** on a fresh invoice (`INV-1015`, `INV-1018`):

```text
I already paid this invoice yesterday via Razorpay UPI. Reference ID #RP192837.
```

Status ➔ **`pending_verification`**. Outbound chasing pauses, so you stop nagging someone who
may genuinely have paid — but the invoice is **not** marked paid.

Say: *"A customer's word pauses the agent. It does not close the invoice."*

`INV-1003` is seeded with this reply already, so you can also just point at it as a
pre-existing example.

## 5. Only a verified webhook closes it

Now fire the real thing, side by side with the browser:

```bash
cd backend
python scripts/trigger_demo_webhook.py INV-1002
```

The script signs the payload with `RAZORPAY_WEBHOOK_SECRET` exactly the way Razorpay does,
so this exercises the real verification path. Status flips to **`paid`**, promises are marked
**kept**, and the response includes `"signature_verified": true`.

### The moment worth recording: show a forgery being rejected

```bash
python scripts/trigger_demo_webhook.py INV-1002 --forge
```

`HTTP 400` — the invoice does not move. Say: *"A forged signature cannot close an invoice.
That's the difference between a demo and a payment system."*

> Requires `RAZORPAY_WEBHOOK_SECRET` to be set in `backend/.env`. With no secret configured
> the event is still accepted so the app runs offline, but the audit trail records that the
> payment was **never cryptographically verified** — the log never overstates what happened.

**If a judge asks about the in-app "Pay Now" button:** that opens a test-mode checkout sheet,
and with the placeholder key secret nothing is signed, so it logs *"Paid through a simulated
Razorpay checkout — signature NOT verified."* Point at that row — it is the same distinction
you just demonstrated, applied to your own UI. Good answer to have ready: *"The log tells you
which payments were proven and which were simulated. It never rounds one up to the other."*

### Firing it by hand instead

These send **no signature**, so they only work when no webhook secret is configured. With a
secret set they are correctly rejected with a 400.

PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/webhooks/razorpay" -Method Post -ContentType "application/json" -Body '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_LIVE_DEMO_998877","amount":1250000,"currency":"INR","status":"captured","method":"upi","notes":{"invoice_id":"INV-1002"}}}}}'
```

cURL:
```bash
curl -X POST "http://localhost:8000/api/webhooks/razorpay" -H "Content-Type: application/json" -d "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_LIVE_DEMO_998877\",\"amount\":1250000,\"currency\":\"INR\",\"status\":\"captured\",\"method\":\"upi\",\"notes\":{\"invoice_id\":\"INV-1002\"}}}}}"
```

Replaying the same `payment.captured` twice is safe — the second is absorbed by idempotency
protection and does not double-count recovery.

---

## Closing line

Open the **Audit** tab and filter by actor.

> "Every row here is a decision, including every decision *not* to act. The blocked count on
> the dashboard isn't errors — it's the agent choosing restraint. That's the difference between
> automation you'd actually point at your customers and a mail merge."
