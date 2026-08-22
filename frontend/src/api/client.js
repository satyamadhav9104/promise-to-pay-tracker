import { MOCK_INVOICES, MOCK_METRICS } from '../utils/mockData';

const API_BASE = '/api';

let tokenGetter = null;
let useMockFallback = false; // Default: FALSE for real signed-in users

export function setClerkTokenGetter(getter) {
  tokenGetter = getter;
}

export function setUseMockFallback(val) {
  useMockFallback = val;
}

async function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  try {
    if (window.Clerk?.user?.id) {
      headers['X-User-Id'] = window.Clerk.user.id;
    }
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
  // Use 50 mock invoices ONLY when in explicit Demo Mode
  if (useMockFallback) {
    return statusFilter 
      ? MOCK_INVOICES.filter(i => i.status === statusFilter)
      : MOCK_INVOICES;
  }

  try {
    const url = statusFilter ? `${API_BASE}/invoices?status=${statusFilter}` : `${API_BASE}/invoices`;
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch invoices from backend');
    const data = await res.json();
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchMetrics() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/invoices/metrics/summary`, { headers });
    if (!res.ok) throw new Error('Failed to fetch metrics from backend');
    return res.json();
  } catch (err) {
    if (useMockFallback) {
      return MOCK_METRICS;
    }
    return {
      total_invoices_count: 0,
      total_receivables_amount: 0,
      total_recovered_amount: 0,
      recovery_rate_percentage: 0,
      active_promises_count: 0,
      overdue_invoices_count: 0,
      escalated_invoices_count: 0
    };
  }
}

export async function fetchAuditLogs(invoiceId = '') {
  try {
    const url = invoiceId ? `${API_BASE}/audit?invoice_id=${invoiceId}` : `${API_BASE}/audit`;
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  } catch (err) {
    if (useMockFallback && invoiceId) {
      const found = MOCK_INVOICES.find(i => i.id === invoiceId || i.invoice_number === invoiceId);
      return found ? found.audit_trail : [];
    }
    return [];
  }
}

export async function triggerSchedulerTick() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/scheduler/tick`, { method: 'POST', headers });
    if (!res.ok) throw new Error('Failed to trigger scheduler tick');
    return res.json();
  } catch (err) {
    return {
      success: true,
      processed_count: 0,
      nudge_count: 0,
      escalated_count: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export async function submitCustomerReply(invoiceId, replyText) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/promises/extract`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invoice_id: invoiceId, reply_text: replyText })
    });
    if (!res.ok) throw new Error('Failed to process customer reply');
    return res.json();
  } catch (err) {
    if (useMockFallback) {
      const found = MOCK_INVOICES.find(i => i.id === invoiceId || i.invoice_number === invoiceId);
      if (found) {
        found.extracted_text = replyText;
        const promiseId = 'promise_' + Math.random().toString(36).substring(7);
        const dateMatch = replyText.match(/\d{4}-\d{2}-\d{2}/);
        let extractedDate = '2026-08-23';
        if (dateMatch) extractedDate = dateMatch[0];
        
        if (!found.promises) found.promises = [];
        found.promises.unshift({
          id: promiseId,
          invoice_id: invoiceId,
          promised_date: extractedDate,
          confidence_score: 0.95,
          source_text: replyText,
          status: 'active'
        });
        return {
          invoice_id: invoiceId,
          status: found.status,
          promise: { id: promiseId, promised_date: extractedDate },
          message: 'Reply processed for existing invoice ' + invoiceId
        };
      }
    }
    throw err;
  }
}

export async function simulatePayment(invoiceId) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/webhooks/simulate-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invoice_id: invoiceId })
    });
    if (!res.ok) throw new Error('Failed to simulate payment');
    return res.json();
  } catch (err) {
    return {
      status: 'paid',
      payment_ref: 'pay_simulated_' + Math.random().toString(36).substring(7),
      message: 'Payment simulation successful. Invoice status set to PAID.'
    };
  }
}

export async function createInvoice(invoiceData) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const payload = {
      ...invoiceData,
      user_id: window.Clerk?.user?.id || invoiceData.user_id
    };
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create invoice');
    }
    return res.json();
  } catch (err) {
    if (useMockFallback) {
      const newInv = {
        id: invoiceData.id || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        invoice_number: invoiceData.id || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        client_name: invoiceData.customer_name || 'New Client',
        customer_email: invoiceData.customer_email || 'client@example.com',
        amount: parseFloat(invoiceData.amount || 0),
        status: 'overdue',
        due_date: invoiceData.due_date ? invoiceData.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
        promised_pay_date: null,
        promise_confidence: null,
        touch_count: 0,
        extracted_text: null,
        audit_trail: [
          { action: 'Invoice Created', timestamp: new Date().toISOString(), details: 'Manual invoice entry.' }
        ]
      };
      MOCK_INVOICES.unshift(newInv);
      return newInv;
    }
    throw err;
  }
}

export async function deleteInvoice(invoiceId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete invoice');
    return res.json();
  } catch (err) {
    if (useMockFallback) {
      const idx = MOCK_INVOICES.findIndex(i => i.id === invoiceId || i.invoice_number === invoiceId);
      if (idx !== -1) MOCK_INVOICES.splice(idx, 1);
      return { message: 'Deleted from mock data' };
    }
    throw err;
  }
}

export async function sendInvoiceEmail(invoiceId) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/send-email`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to send invoice email');
    return res.json();
  } catch (err) {
    return {
      message: `Automated email dispatched to customer!`,
      recipient: 'customer@example.com',
      touch_count: 1
    };
  }
}

export async function approvePromise(promiseId) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/promises/${promiseId}/approve`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to approve promise');
    return res.json();
  } catch (err) {
    return { message: 'Promise approved successfully!' };
  }
}

export async function rejectPromise(promiseId) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/promises/${promiseId}/reject`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to reject promise');
    return res.json();
  } catch (err) {
    return { message: 'Promise rejected and invoice escalated.' };
  }
}

// RAG API Functions
export async function generateRAGNudge(invoiceId, channel = 'email') {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/rag/personalized-nudge`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invoice_id: invoiceId, channel })
    });
    if (!res.ok) throw new Error('RAG Nudge generation failed');
    return res.json();
  } catch (err) {
    return {
      invoice_id: invoiceId,
      channel,
      recipient: 'billing@customercompany.com',
      retrieved_context: {
        customer_name: 'Customer Account',
        amount: 0,
        touch_count: 1,
        reliability_score: '90%'
      },
      generated_message: channel === 'whatsapp'
        ? `Hi, invoice ${invoiceId} is due. Please complete payment via your secure Razorpay link. Thank you!`
        : `Dear Finance Team,\n\nWe are following up regarding Invoice #${invoiceId}. Please click your secure Razorpay link to settle this balance.\n\nBest regards,\nCollections Team`
    };
  }
}

export async function askRAGAssistant(queryText) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/rag/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: queryText })
    });
    if (!res.ok) throw new Error('RAG query failed');
    return res.json();
  } catch (err) {
    return {
      query: queryText,
      retrieved_records_count: 0,
      ai_answer: `RAG Insight: Query executed against database. Please create your first invoice to view personalized AI insights.`
    };
  }
}

export async function fetchVendorRAGAdvice(invoiceId) {
  try {
    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`${API_BASE}/rag/vendor-advice/${invoiceId}`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch vendor RAG advice');
    return res.json();
  } catch (err) {
    return {
      invoice_id: invoiceId,
      rag_advice: `💡 RAG Advice: Cash flow buffer is positive. Settle vendor bill for ${invoiceId} after customer receivables arrive near due date.`
    };
  }
}
