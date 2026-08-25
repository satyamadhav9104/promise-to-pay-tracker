# Before you submit

Two short sections: three commands I could not run for you, and five judgement calls I left
to you rather than changing unilaterally.

---

## 1. Run these on Windows

I could not run any of these in my sandbox — PyPI is blocked there, and this repo's
`node_modules` contains only Windows binaries.

```bash
cd backend && pytest                 # 27 tests
```

```bash
cd frontend && npm run dev           # then click through the demo
```

**The `npm run dev` check matters most.** The Tailwind CDN `<script>` is gone from
`index.html` and the CSS is now compiled from `src/index.css`. I verified this offline by
compiling the stylesheet and diffing all 646 class names used in the JSX against the output
(636 resolve, the other 10 are prose leaking out of ternaries, not classes) — but a
compile-time check is not the same as looking at it. If something went wrong the failure is
loud and instant: the page renders as unstyled HTML. Worth 30 seconds.

```bash
cd frontend && npm run build         # confirms the production bundle still builds
```

Then a cold-start pass: wipe the DB, `python scripts/seed_invoices.py`, and walk
`DEMO_CHEAT_SHEET.md` top to bottom once. Every number in that file is verified against the
source, but I have never seen the app run.

---

## 2. Your call, not mine

### Your personal email is hardcoded in the repo

`backend/app/services/notifier.py:182-184` rewrites any `@example.com` recipient to a
hardcoded fallback address — your own gmail. Every seeded invoice uses `@example.com`, so
every reminder in a demo goes to your inbox. That is useful while building and probably not
what you want in a public submission. I left it alone because changing where mail goes
mid-demo is exactly the kind of surprise you do not want on recording day.

### Seed dates are frozen, so the data rots

`seed_invoices.py` writes absolute dates rather than dates relative to today. Right now
**7 of the 13 `due_soon` invoices are already past their due date** while still badged "Due
Soon". This gets worse every day you leave it. Two options: rebase the seed dates off
`date.today()`, or just re-seed immediately before recording. The second is zero risk and
takes one command, which is why I did not touch the first.

### The sweep can mark a not-yet-due invoice overdue

`scheduler/tick.py:181-188` moves `CREATED`/`DUE_SOON` to `OVERDUE` without comparing
against `due_date`. Combined with the frozen seed dates above you are unlikely to notice,
but if a judge creates a fresh invoice dated next month and runs the sweep, it will go
overdue on screen. A one-line `if invoice.due_date < now` guard fixes it. I flagged rather
than fixed because it changes sweep behaviour, and the sweep is on the demo path.

### Two small wording mismatches

- The manual reminder button toasts "Reminder sent" while the audit row underneath says
  "Provider: simulated". Both true, mildly awkward side by side.
- The manual button's hand-off row explains the invoice was handed to a human but does not
  set status to `ESCALATED`, so the badge does not change.

### `db/session.py:49-73` falls back to SQLite silently

If `DATABASE_URL` points at a Postgres that is down, the app starts anyway on SQLite with a
fresh empty DB. Good for demo resilience, confusing if you are ever debugging why your data
vanished. Leaving as-is is a defensible choice — just know it is there.

---

## What changed, in one line each

Everything below is done and verified as far as it can be without running the app.

**Demo blockers:** seed script imports fixed; the 0.7 confidence threshold actually routes;
Gemini's API-key gate accepts the `AQ.Ab…` key format; dashboard renders server-side metrics
instead of recomputing them client-side; the hardcoded "+12.5% vs last month" is gone.

**Spec gaps:** cap and cooldown now run through a single `check_touch_allowed()` shared by
all three call sites (sweep, manual send, promise rejection) — previously two of them
bypassed it; webhook HMAC is verified over the raw request body, and a forged signature is
rejected with a 400; settings persist server-side and reload at startup.

**Truthfulness fixes** — cases where the UI or the audit log claimed something false:

| Was | Now |
|---|---|
| Invented `'Aug 30, 2026'` as a promise date when none existed | "no date given" |
| Rejected promises badged `APPROVED` until reload | Server status always wins |
| "Razorpay confirmed the payment" logged for the simulate button | "no Razorpay webhook was verified" |
| "Razorpay Payment Verified" logged for an unsigned checkout | "signature NOT verified" |
| Metrics badged `promises_kept` as "Verified via Razorpay" | "Closed on a payment event" |
| Checkout sheet footer: "256-bit SSL Encrypted / Razorpay Verified" | "No card data is sent anywhere / Razorpay test mode" |
| Missing invoice still returned `{"status": "paid"}` | 404 |
| Touch counter hardcoded `/ 3` while the cap is editable | Reads the live setting |

**Auth enforcement is still off** — you excluded it, so no route enforces `core/auth.py`.
Worth a sentence in your submission notes if judges ask, since it is a deliberate scope call
rather than a gap.
