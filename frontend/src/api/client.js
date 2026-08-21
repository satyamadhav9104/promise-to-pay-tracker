const API_BASE = '/api';

export async function fetchInvoices(statusFilter = '') {
  const url = statusFilter ? `${API_BASE}/invoices?status=${statusFilter}` : `${API_BASE}/invoices`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/invoices/metrics/summary`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchAuditLogs(invoiceId = '') {
  const url = invoiceId ? `${API_BASE}/audit?invoice_id=${invoiceId}` : `${API_BASE}/audit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function triggerSchedulerTick() {
  const res = await fetch(`${API_BASE}/scheduler/tick`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger scheduler tick');
  return res.json();
}

export async function submitCustomerReply(invoiceId, replyText) {
  const res = await fetch(`${API_BASE}/promises/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId, reply_text: replyText })
  });
  if (!res.ok) throw new Error('Failed to process customer reply');
  return res.json();
}

export async function simulatePayment(invoiceId) {
  const res = await fetch(`${API_BASE}/webhooks/simulate-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId })
  });
  if (!res.ok) throw new Error('Failed to simulate payment');
  return res.json();
}
