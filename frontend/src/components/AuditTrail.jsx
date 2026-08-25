import React from 'react';
import { Clock, CheckCircle2, PauseCircle } from 'lucide-react';

/**
 * Every row in the decision log is written by the backend as enum tokens
 * (`cooldown_active`, `sent_whatsapp`, `status_changed:overdue->escalated`).
 * The maps below turn those tokens into the sentence a person would say.
 * The raw token is never thrown away — it stays as secondary text and as the
 * row's hover title, so the log is still auditable.
 */

const STATE_WORDS = {
  created: 'created',
  due_soon: 'due soon',
  overdue: 'overdue',
  promise_made: 'promise made',
  promise_due: 'promise due',
  pending_verification: 'pending verification',
  escalated: 'escalated to a human',
  paid: 'paid',
  written_off: 'written off'
};

const ACTOR_WORDS = {
  ai: 'AI agent',
  system: 'System',
  user: 'Human'
};

const TRIGGER_WORDS = {
  scheduler_tick: 'recovery sweep',
  customer_reply: 'customer reply',
  razorpay_webhook: 'Razorpay webhook',
  invoice_ingested: 'invoice created',
  user_action: 'your action'
};

const tidyNumber = (raw) => {
  const value = parseFloat(raw);
  return Number.isFinite(value) ? String(value) : raw;
};

const capture = (detail, pattern) => {
  const match = (detail || '').match(pattern);
  return match ? match[1] : null;
};

/**
 * "Cooldown active (2.0 of 4 days elapsed since the last touch)."
 * Accepts "2.0 of 4 days" and "2.0/4 days" — rules.py writes the former, but the
 * two have been swapped before and a missed match silently drops the numbers from
 * the most frequently displayed guardrail sentence in the app.
 */
const cooldownProgress = (detail) => {
  const match = (detail || '').match(/([\d.]+)\s*(?:\/|of)\s*([\d.]+)\s*days/i);
  if (!match) return null;
  return { elapsed: tidyNumber(match[1]), total: tidyNumber(match[2]) };
};

/**
 * "Max touches (3) reached." / "maximum touch limit of 3" /
 * "Escalation ladder exhausted after 3 touches."
 * The cap is runtime-configurable, so read it from the detail rather than trusting
 * the default — the ladder-exhausted phrasing has no "max touches" in it at all.
 */
const touchCap = (detail) =>
  capture(detail, /max(?:imum)?\s*touch(?:es)?[^\d]{0,20}(\d+)/i) ||
  capture(detail, /after\s+(\d+)\s*touches/i);

/** "Sent touch #2 via email." / "Escalation touch #2 sent" */
const touchNumber = (detail) => capture(detail, /touch\s*#?\s*(\d+)/i);

const DEFAULT_MAX_TOUCHES = '3';

/**
 * Token -> plain sentence. Keyed by `rule_that_blocked`, `rule_applied` or
 * `action_taken`; whichever is most specific wins (see headlineFor).
 */
const SENTENCES = {
  // --- decisions NOT to act -------------------------------------------------
  cooldown_active: (log) => {
    const progress = cooldownProgress(log.detail);
    return progress
      ? `Held back — only ${progress.elapsed} of ${progress.total} cooldown days have passed`
      : 'Held back — the quiet window since the last touch has not finished';
  },
  max_touches_reached: (log) =>
    `Stopped after ${touchCap(log.detail) || DEFAULT_MAX_TOUCHES} touches, handed to a human`,
  human_handoff_active: (log) =>
    `Stopped after ${touchCap(log.detail) || DEFAULT_MAX_TOUCHES} touches, handed to a human`,
  pending_verification_pause: () =>
    "Paused — customer says they've paid, waiting on Razorpay to confirm",
  unverified_payment_claim_pause: () =>
    "Paused — customer says they've paid, waiting on Razorpay to confirm",
  active_promise_pause: () => "Waiting — customer's promised date hasn't arrived yet",
  no_promise_detected: () => 'Read the reply, found no promise to pay',
  // Reachable by pressing the manual reminder button on a settled invoice, and by
  // the sweep skipping one. Without these the row reads "No action taken", which
  // hides the reason.
  invoice_closed: () => 'Skipped — the invoice is already settled, nothing left to chase',
  terminal_state_guard: () =>
    'Skipped — the invoice is already settled, nothing left to chase',

  // --- decisions to act ----------------------------------------------------
  sent_email: (log) => {
    const touch = touchNumber(log.detail);
    return touch ? `Reminder email sent (touch ${touch})` : 'Reminder email sent';
  },
  email_sent: (log) => {
    const touch = touchNumber(log.detail);
    return touch ? `Reminder email sent (touch ${touch})` : 'Reminder email sent';
  },
  sent_whatsapp: (log) => {
    const touch = touchNumber(log.detail);
    // Deliberately does not cite the cap: it is runtime-configurable and this row
    // has no way to know its value at the time the touch was sent.
    return touch ? `Final notice sent on WhatsApp (touch ${touch})` : 'Final notice sent on WhatsApp';
  },
  promise_proposed_awaiting_approval: () =>
    'Promise found in customer reply — needs your approval',
  human_in_the_loop_review: () => 'Promise found in customer reply — needs your approval',
  auto_accepted_high_confidence: () => 'Promise accepted automatically (high confidence)',
  human_approved_promise: () => 'You approved the promised date',
  human_rejected_promise: () => 'You rejected the promised date',
  promise_date_passed: () => 'Promise date passed without payment',
  promise_broken: () => 'Promise date passed without payment',
  verified_payment_resolution: () => 'Razorpay confirmed the payment — invoice closed',
  payment_captured_verification: () => 'Razorpay confirmed the payment — invoice closed',
  payment_captured_unverified_signature: () =>
    'Invoice closed on a payment webhook whose signature was NOT verified (no webhook secret configured)',
  simulated_payment_no_verification: () =>
    'Invoice closed by a manual simulated payment — no Razorpay webhook was verified',
  razorpay_live_checkout: () => 'Paid through Razorpay checkout — signature verified',
  razorpay_simulated_checkout: () =>
    'Paid through a simulated Razorpay checkout — signature NOT verified',
  invoice_created: () => 'Invoice created',
  no_op: () => 'No action taken'
};

const humaniseToken = (token) =>
  String(token || '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const statusSentence = (actionTaken) => {
  const [from, to] = actionTaken.slice('status_changed:'.length).split('->');
  const fromWords = STATE_WORDS[from] || humaniseToken(from).toLowerCase();
  const toWords = STATE_WORDS[to] || humaniseToken(to).toLowerCase();
  return `Status moved from ${fromWords} to ${toWords}`;
};

/** Most specific plain-language sentence available for a log row. */
export function headlineFor(log) {
  const blocked = log.rule_that_blocked && SENTENCES[log.rule_that_blocked];
  if (blocked) return blocked(log);

  const byRule = log.rule_applied && SENTENCES[log.rule_applied];
  if (byRule) return byRule(log);

  if (typeof log.action_taken === 'string' && log.action_taken.startsWith('status_changed:')) {
    return statusSentence(log.action_taken);
  }

  const byAction = log.action_taken && SENTENCES[log.action_taken];
  if (byAction) return byAction(log);

  return humaniseToken(log.action_taken || log.rule_applied) || 'Decision recorded';
}

export default function AuditTrail({ logs = [], showInvoiceId = false }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        Nothing logged yet. Every decision the agent makes — including every decision not to act —
        will appear here.
      </p>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4 pt-2">
      {sortedLogs.map((log, index) => {
        const isBlocked = Boolean(log.rule_that_blocked);
        const formattedTime = new Date(log.timestamp).toLocaleString();
        const headline = headlineFor(log);
        const rawRule = log.rule_that_blocked || log.rule_applied || log.action_taken;
        const actorWords = ACTOR_WORDS[log.actor] || humaniseToken(log.actor);
        const triggerWords = TRIGGER_WORDS[log.trigger] || humaniseToken(log.trigger).toLowerCase();

        return (
          <div key={log.id || index} className="flex gap-4 relative">
            {index !== sortedLogs.length - 1 && (
              <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-gray-200"></div>
            )}

            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-6 h-6 rounded-full bg-white border-2 ${
                  isBlocked ? 'border-amber-200' : 'border-emerald-100'
                } flex items-center justify-center z-10 relative`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-amber-500' : 'bg-emerald-500'}`}
                ></div>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl shadow-sm flex-1 space-y-1.5 border border-l-4 ${
                isBlocked
                  ? 'bg-amber-50/60 border-amber-100 border-l-amber-400'
                  : 'bg-white border-gray-100 border-l-emerald-400'
              }`}
              title={`${isBlocked ? 'Blocked by rule' : 'Rule applied'}: ${rawRule}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {isBlocked ? (
                    <PauseCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        isBlocked ? 'text-amber-900' : 'text-gray-900'
                      }`}
                    >
                      {headline}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span
                        className={`font-semibold uppercase tracking-wide ${
                          isBlocked ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isBlocked ? 'Held back' : 'Action taken'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        by {actorWords} during {triggerWords}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-gray-400" title="Raw rule name from the engine">
                        {rawRule}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {showInvoiceId && log.invoice_id && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {log.invoice_id}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {formattedTime}
                  </span>
                </div>
              </div>

              {log.detail && (
                <p
                  className={`text-xs mt-1.5 p-2.5 rounded-lg border ${
                    isBlocked
                      ? 'text-amber-900/80 bg-white/70 border-amber-100'
                      : 'text-gray-600 bg-gray-50 border-gray-100'
                  }`}
                >
                  {log.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
