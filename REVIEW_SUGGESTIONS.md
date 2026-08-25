# Review — suggested changes before submission

Reviewed 2026-08-25 against `docs/requirements.md`, `docs/architecture.md`, `README.md`, and `DEMO_CHEAT_SHEET.md`.
Optimised for two things you asked for: **buildathon judging impact** and **frontend/UX polish**.

## The one-sentence version

The architecture is genuinely good — the state machine, the blocked-action audit rows and the `PENDING_VERIFICATION` race guard are real and well tested. The risk is not the design, it's that **three of your headline claims are not actually backed by the running code**, and the demo path a judge would follow is broken at step one. Fix those and this presents as a serious submission.

The three unbacked claims:

| Claim in your docs/UI | What the code does |
| --- | --- |
| "Confidence < 0.7 routes to human review" (FR5-9) | *Every* promise is flagged for human review regardless of score. The threshold is never read in the live path. |
| "HMAC-verified Razorpay webhook" (`RazorpayModal.jsx` success screen) | Signature verification returns `True` unconditionally under shipped config, and no demo path sends a signature at all. |
| "Max 3 touches, 4-day cooldown" (`AuditPage` guardrail banner) | Enforced in the scheduler, but two UI-reachable routes increment `touch_count` with no cap or cooldown check. |

---

## Tier 0 — demo blockers

These break a fresh clone. Highest value per minute spent.

**1. `backend/scripts/seed_invoices.py` cannot run at all.** ~5 min
`Session` (`:43`, `:122`), `timedelta` (`:82`) and `uuid` (`:88`) are used but never imported. The `Session` annotation is evaluated at def time, so it raises `NameError` on import — before `main()` runs. This is README step 6 *and* cheat-sheet step 1, so on a fresh clone the dashboard opens empty and **there is no `INV-1002`** for the scripted demo to act on. Add the three imports and run it once to confirm 52 invoices land.

**2. Following the README kills the backend.** ~10 min
`README` says `cp .env.example .env`, and `backend/.env.example:9` sets a placeholder Supabase Postgres URL. The SQLite fallback in `db/session.py:49-73` only triggers for `mysql://` URLs, so startup dies in `Base.metadata.create_all` (`main.py:52`). Also `config.py:8` defaults to MySQL with a hardcoded root password while the README's env table claims the default is SQLite. Make SQLite the default in both `config.py:8` and `.env.example`, and let MySQL/Postgres be the opt-in.

**3. Gemini never fires, so extraction silently degrades to keyword matching.** ~15 min
`llm_extractor.py:143` and `:209` gate the LLM on `llm_api_key.startswith("AIza")`. Your on-disk key starts `AQ.Ab`, so the gate always fails and you always get `_heuristic_extractor`. Two knock-on effects:
- the Anthropic branch (`:215`) is unreachable, because the same `AIza` gate wraps it;
- month-name dates need `dateutil` (`:108`), which is missing from the **root** `requirements.txt` (the one `Procfile` uses) — so the cheat sheet's `"by August 30, 2026"` line can return *"no promise detected"* on the deployed build.

Replace the prefix check with a plain truthiness check plus provider switch, and add `python-dateutil` to the root requirements. Until then, demo with the ISO form (`by 2026-09-01`), which the heuristic parses reliably.

**4. The cheat sheet narrates a click that doesn't exist.** ~5 min (or fold into #6)
`DEMO_CHEAT_SHEET.md:24` says status goes `due_soon ➔ PROMISE_MADE` instantly on extract. `promises.py:27-95` only creates a `FLAGGED_HUMAN_REVIEW` promise; the invoice doesn't move until a human clicks Approve. Right now the video would show a status that didn't change while you say it changed. Fixing #6 makes the narration true instead.

**5. `RazorpayModal.jsx` has a hooks-order violation.** ~2 min
`if (!isOpen || !invoice) return null;` at `:19` sits above the `useState` calls at `:21-28`, so the hook count changes between renders. Risk of a red React error overlay on camera. Move the early return below the hooks.

---

## Tier 1 — spec gaps that cost points

Judges read `requirements.md` and then click around. These are the mismatches they'd find.

**6. Wire the 0.7 confidence threshold (FR5-FR9).** ~20 min — *best points-per-minute in the whole list*
`promise_confidence_threshold` (`config.py:32`) is referenced only in `langgraph_recovery_agent.py`, which is dead code. `promises.py:70` sets `FLAGGED_HUMAN_REVIEW` unconditionally, so a 0.94 promise and a 0.45 promise take identical paths and the `Confidence >= 0.7 → PROMISE_MADE` branch in your own architecture diagram (`docs/architecture.md:15`) does not exist. Branch on the score: at or above threshold, auto-transition to `PROMISE_MADE` and log `auto_accepted_high_confidence`; below it, keep the human-review card. This single change fixes the diagram, fixes the cheat sheet, gives the Settings slider something to control, and makes your "AI proposes, rules decide" story demonstrable in one screen.

**7. Close the two cap/cooldown bypasses.** ~20 min
`invoices.py:101-102` (`POST /api/invoices/{id}/send-email`, wired to a UI button) and `promises.py:205-206` (`reject_promise`, which then auto-sends) both do `touch_count += 1` without reading `max_touches_per_invoice` or `cooldown_days_between_touches`. A judge clicking "Send Link Email" five times drives `touch_count` to 5 and directly disproves your headline guardrail. Extract the rule check from `scheduler/tick.py:74-125` into a `core/rules.py` helper (e.g. `check_touch_allowed(invoice, now) -> (bool, reason)`) and call it from all three sites. Bonus: it makes the invariant testable and gives you a clean thing to point at.

**8. Pause escalation while a promise is active.** ~15 min
`scheduler/tick.py` has no branch for `PROMISE_MADE` with a future `promised_date`, so an invoice whose promise you just approved keeps getting chased once cooldown clears. That contradicts the premise of the product. `langgraph_recovery_agent.py:63` even declares a `blocked_active_promise` state that nothing ever produces — add it to the real tick and log it as a blocked row.

**9. Stop the audit trail filling with duplicate no-ops.** ~10 min
`tick.py:32-34` excludes only `PAID`/`WRITTEN_OFF`, so every escalated invoice gets a fresh `human_handoff_active` row every 300s (`main.py:33`). By demo time the audit page — your differentiator — is mostly identical amber rows. Exclude `ESCALATED` from the sweep, or only log the handoff row on the transition into it. Related: `tick.py:41-51` flips a promise to `BROKEN` with **no** audit row unless the invoice is exactly `PROMISE_MADE`, which is a real hole in "every decision is logged".

**10. Make webhook signature verification real, then show it rejecting.** ~30 min
Four independent bypasses under shipped config: `webhooks.py:38` skips verification when the header is absent; `razorpay_client.py:149-151` returns `True` when the secret is empty (the default); `webhooks.py:45` treats a payload with no `event` key as a capture; and `razorpay_client.py:96-97` returns `True` when `key_secret == "mock_secret_12345"` (also the default). Note `payment_reconciliation.py:18-19` already contains the *correct* stricter version — it's just never imported. Set a real webhook secret, sign the payload in `trigger_demo_webhook.py`, reject on mismatch, and add a second script that fires a **bad** signature. "Here's it rejecting a forged webhook" is a strong 15 seconds of demo and it's the obvious question to be asked.

**11. Either wire the Settings sliders or mark them read-only.** ~20 min
`SettingsPage.jsx:39-62` writes Max Touches / Cooldown Days / Confidence Threshold to `localStorage` only. A judge who sets cooldown to 0, re-runs the sweep and sees nothing change has just found a fake control. Cheapest honest fix: a `PATCH /api/settings` writing to a small config table read per tick. Cheaper still: relabel as "Current guardrails (configured server-side)" and show the live values from the API.

**12. Auth is not enforced on any endpoint.** ~30 min, or accept and disclose
`core/auth.py` (`get_current_user`, `require_auth`) is imported by zero route modules. Tenancy is the spoofable `X-User-Id` header, and `invoices.py:150` also returns every invoice with a null/empty `user_id` to *all* users — which is exactly what the seeder produces. Meanwhile `DELETE /api/invoices/clear-all` (`invoices.py:71-78`) is unauthenticated and deletes the entire "immutable" audit trail. If your Heroku URL is in the submission, assume someone will poke it. At minimum put `require_auth` on the destructive routes.

---

## Tier 2 — frontend and UX polish

**13. Your dashboard metrics tell the wrong story.** ~45 min — *biggest visual win*
`Dashboard.jsx:85-91` computes all four cards client-side and never renders the `metrics` you actually fetched at `:39`. So the real metrics endpoint (recovery rate, avg days to recovery, promises kept/broken, human escalations — `invoices.py:157-218`) is computed and thrown away, while the cards show generic invoicing numbers. Worse, `"+12.5% vs last month"` at `:163` is hardcoded, and "Total Revenue" is the sum of *all* invoices regardless of status. A hardcoded growth number is the fastest way to make a judge distrust everything else on screen.

Swap the four cards for the numbers that are *your* thesis, from the real endpoint:

```
Recovered           Promises kept        Actions blocked       Awaiting review
₹4.2L / 12 inv      18 kept · 6 broken   34 by guardrails      3 low-confidence
avg 6.4 days        75% kept rate        cap · cooldown · pause needs a human
```

"Actions blocked by guardrails" is the card nobody else will have. It makes restraint measurable.

**14. Humanise the audit trail — this is your differentiator, so let it read.** ~40 min
FR27-30 promises a *plain-language* audit log. `AuditTrail.jsx` currently renders raw enum values: `sent_email`, `[Rule: cooldown_enforcement]`, `BLOCKED: max_touches_reached`, and `actor • trigger` in monospace. The `detail` string underneath is decent prose, but the headline of each row is engineer vocabulary. Add a lookup map from `rule_applied`/`action_taken` to sentences, keep the raw rule as small secondary text or a hover:

- `cooldown_active` → "Held back — 2 of 4 cooldown days elapsed"
- `max_touches_reached` → "Stopped after 3 touches, handed to a human"
- `pending_verification_pause` → "Paused — customer says they've paid, waiting on Razorpay"
- `sent_whatsapp` → "Final notice sent via WhatsApp (touch 3 of 3)"

Also give blocked and executed rows a clearer visual split, and drop `actor • trigger` from the headline into the expanded detail. A judge should be able to read one screen and narrate your guardrails back to you — that's the whole pitch.

**15. Fix the three mislabelled buttons.** ~10 min
"Generate Report" (`:256`) opens the create-invoice modal. "Setup Now" (`:288`) runs the scheduler sweep. "Sync Metrics" (`:267`) and "View All" (`:224`) both just reload. A control should say what it does — and a judge clicking "Generate Report" and getting a form reads as unfinished. Rename to "New invoice", "Run recovery sweep", "Refresh".

**16. Bring the webhook leg into the UI.** ~30 min
`POST /api/webhooks/razorpay` has zero frontend callers — the closed-loop centrepiece only exists in a terminal. Keep the terminal fire for authenticity (it's more convincing), but add a live event strip on the dashboard so the browser visibly reacts: *"Razorpay payment.captured received · signature verified · INV-1002 → PAID"*. Related: `InvoicesPage.jsx:17,30` polls every 3s with `setLoading(true)` on each pass, so a spinner flashes over the table continuously. Make refresh silent and keep the 3s cadence — then the webhook reveal looks instant and the rest of the demo stops strobing.

**17. Demo Mode currently dead-ends.** ~30 min, or delete it
Mock invoices render on Dashboard and Invoices, but `fetchMetrics` (`client.js:62`) and the Audit page still hit the live API, so in Demo Mode the metrics page and audit trail go blank while 50 invoices show behind them. `MOCK_METRICS` (`mockData.js:762`) has 2 of the 8 fields `MetricsPage.jsx` reads, so the rest render blank or `NaN`. And every action button 404s, because mock ids are `INV-2026-xxx` while the DB has `INV-10xx`. Either make it self-consistent (align ids with the seed fixtures, add mock audit rows and full mock metrics) or cut it — a judge exploring a broken demo mode is worse than no demo mode. Note `client.js` also swallows API errors into `[]` and fabricates a success response for `triggerSchedulerTick` (`:99-107`), so a dead backend looks like an empty-but-healthy app. During judging you want the opposite: fail loudly.

**18. Turn the empty state into a "Load demo data" button.** ~20 min — *kills the #1 risk*
Right now an empty DB shows "No Invoices Created Yet" and the only fix is a CLI script that crashes. Add `POST /api/demo/seed` calling the (fixed) seeder and put a button in the empty state. Now a judge cloning your repo, or you on a strange laptop, is one click from a populated dashboard. This is the single best insurance policy for a live demo.

**19. Drop the Tailwind CDN.** ~2 min
`frontend/index.html` loads `cdn.tailwindcss.com` *in addition to* your PostCSS build. It needs internet, prints a "should not be used in production" console warning, and can flash unstyled content. Venue wifi is not a thing to bet a demo on. `checkout.razorpay.com/v1/checkout.js` is also loaded and never used.

---

## Tier 3 — cleanup a browsing judge will notice

Repo hygiene, in rough order of how bad it looks:

- **`services/langgraph_recovery_agent.py`** — 564 lines, zero imports repo-wide, a complete parallel escalation engine that duplicates state-machine writes and touch increments. `langgraph>=1.2.0` sits in requirements for it. A dead second brain reads worse than no LangGraph at all. Delete it, or extract the one genuinely useful thing (it's the only place the confidence threshold routes) into item #6 and then delete it.
- **`services/payment_reconciliation.py`**, **`core/security_hotfix.py`**, **`schemas/profile.py`**, **`hooks/useInvoices.js`** (0 bytes) — all unimported. Note `security_hotfix.sanitize_input_text` is never called, so no route sanitises `reply_text` before storing it.
- **Duplicate `POST /api/scheduler/tick`** — defined in both `audit.py:51` and `main.py:93`; audit.py wins and the dead one is visible in `/docs` with a different response shape.
- **`alembic/versions/` is empty** — zero migrations, schema comes from `create_all`. Either generate an initial migration or drop alembic from requirements.
- **Rate limiting is inert** — `main.py:25,72-73` configures `Limiter` but never adds `SlowAPIMiddleware` and no route is decorated.
- **README accuracy** — it references `backend/app/services/scheduler.py`, which doesn't exist (it's `app/scheduler/tick.py`), and its env-var table contradicts `config.py` on the default database.
- **`vercel.json`** rewrites `/api/*` to `your-backend-api.onrender.com` — an unreplaced placeholder, so a Vercel deploy has no API.
- **Secrets in the repo** — a real Clerk publishable key is committed in `render.yaml`, `app.json` and `docker-compose.yml`; `config.py:8` has a hardcoded MySQL root password; `config.py:20` and `notifier.py:184` hardcode `satyamaadhav@gmail.com` as the fallback recipient for *every* outbound email, and `notifier.py:182` synthesises `{customer}@example.com` then rewrites it to that address. Also `main.py:76-82` sets CORS `allow_origins=["*"]` with credentials while `config.py:9`'s `allowed_origins` is never read.
- **Unused deps** — `celery`, `redis`, `sentry-sdk`, `twilio`, `google-generativeai`, `anthropic` are all installed and never imported. Twilio settings exist in config but WhatsApp is always a `logger.info`.
- **`main.py:149-155`** returns `{"error": "Not Found"}` with HTTP **200** for unmatched paths, and `None` when `index.html` is missing.

---

## Two upgrades if you have spare time

**A. Make the escalation emails actually RAG-personalised.** `rag_service.py` does real work — pulls the invoice, its full action history, its promises, and computes a per-customer reliability score from the paid ratio (`:55-58`). But `notifier.py` never imports it and sends static templates, so RAG is a read-only sidecar panel. Calling `generate_personalized_nudge_rag` from the notifier turns "we have a chatbot" into "the agent's outreach is grounded in that customer's payment history" — a much stronger claim for one import. Two caveats first: `rag_service.py:33-43` fabricates a fake "Acme Corp / reliability 85%" record for unknown invoice ids, `:164-170` invents a 5-invoice portfolio when the DB is empty, and `:200` hardcodes customer names in its fallback answer. Fabricated data in a *judged* AI feature is a serious risk — make those paths say "no data" instead.

**B. Add a "why didn't you chase this one?" view.** You already log every blocked decision with the rule that blocked it. A small panel listing currently-suppressed invoices with reasons — *"3 paused: 1 awaiting payment verification, 1 in cooldown, 1 handed to a human"* — is the most direct demonstration that the agent is bounded, and it's mostly a query over data you already have.

---

## Suggested order if you have one evening

1. Items **1-5** (Tier 0) — about an hour, and without them a fresh clone doesn't demo.
2. Item **6** (confidence threshold) — 20 minutes, closes the most visible spec gap.
3. Items **13** and **14** (dashboard metrics + humanised audit trail) — this is where the visual impact is.
4. Item **18** (Load demo data button) — cheap insurance.
5. Items **7-9** — the guardrail claims judges are most likely to test.
6. Item **10** if you can — "watch it reject a forged webhook" is a memorable moment.
