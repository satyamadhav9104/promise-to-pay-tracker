const API_BASE = '/api';

let tokenGetter = null;

export function setClerkTokenGetter(getter) {
  tokenGetter = getter;
}

async function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  try {
    if (tokenGetter) {
      const token = await tokenGetter();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // Session token retrieval exception fallback
  }
  return headers;
}

export async function fetchInvoices(statusFilter = '') {
  const url = statusFilter ? `${API_BASE}/invoices?status=${statusFilter}` : `${API_BASE}/invoices`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function fetchMetrics() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/invoices/metrics/summary`, { headers });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchAuditLogs(invoiceId = '') {
  const url = invoiceId ? `${API_BASE}/audit?invoice_id=${invoiceId}` : `${API_BASE}/audit`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function triggerSchedulerTick() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/scheduler/tick`, { method: 'POST', headers });
  if (!res.ok) throw new Error('Failed to trigger scheduler tick');
  return res.json();
}

export async function submitCustomerReply(invoiceId, replyText) {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE}/promises/extract`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ invoice_id: invoiceId, reply_text: replyText })
  });
  if (!res.ok) throw new Error('Failed to process customer reply');
  return res.json();
}

export async function simulatePayment(invoiceId) {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE}/webhooks/simulate-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ invoice_id: invoiceId })
  });
  if (!res.ok) throw new Error('Failed to simulate payment');
  return res.json();
}

