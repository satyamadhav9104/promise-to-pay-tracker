# 🎬 Live Video Demo Cheat Sheet — SMARTINVOICE

Use this cheat sheet during your video demo recording to showcase:
1. **Natural Language Promise Extraction via Gemini LLM**
2. **Closed-Loop Razorpay Webhook Resolution (Live transition to `PAID`)**

---

## 📌 Target Invoice for Demo: `INV-1002` (Apex Cloud Systems)

---

## 1️⃣ Customer Reply Text (Ready to Copy-Paste)

Paste this exact customer reply text into the **"Log Customer Reply"** modal or API test form for invoice **`INV-1002`**:

```text
Hi team, we acknowledge invoice INV-1002 for $12,500. We will complete the payment transfer by August 30, 2026.
```

### 🎯 What Happens on Screen:
- **LLM Intent Extractor** parses invoice ID `INV-1002` and date `2026-08-30`.
- **Confidence score**: `0.95+` (High Confidence).
- **Invoice Status**: Instantly updates from `due_soon` ➔ **`PROMISE_MADE`** with new promised due date!

---

## 2️⃣ Razorpay Test Webhook Payload (Ready to Fire Live)

Fire this webhook payload while recording your screen to demonstrate closed-loop automatic invoice settlement.

### Option A: Python Script (Recommended — 1-Click Execution)
Open a terminal in `backend/` and run:
```bash
python scripts/trigger_demo_webhook.py INV-1002
```

### Option B: PowerShell Command (Windows)
Run in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/webhooks/razorpay" -Method Post -ContentType "application/json" -Body '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_LIVE_DEMO_998877","amount":1250000,"currency":"INR","status":"captured","method":"upi","notes":{"invoice_id":"INV-1002"}}}}}'
```

### Option C: cURL Command (Bash / Command Prompt)
Run in terminal:
```bash
curl -X POST "http://localhost:8000/api/webhooks/razorpay" -H "Content-Type: application/json" -d "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_LIVE_DEMO_998877\",\"amount\":1250000,\"currency\":\"INR\",\"status\":\"captured\",\"method\":\"upi\",\"notes\":{\"invoice_id\":\"INV-1002\"}}}}}"
```

### Option D: Raw JSON Payload for Postman
- **URL**: `POST http://localhost:8000/api/webhooks/razorpay`
- **Header**: `Content-Type: application/json`
- **Body**:
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_LIVE_DEMO_998877",
        "amount": 1250000,
        "currency": "INR",
        "status": "captured",
        "method": "upi",
        "description": "Invoice Payment INV-1002",
        "notes": {
          "invoice_id": "INV-1002"
        }
      }
    }
  }
}
```

---

## 🎥 Video Recording Step-by-Step Sequence

1. **Pre-Demo Refresh**:
   Run database seed so clean invoices are loaded:
   ```bash
   cd backend
   python scripts/seed_invoices.py
   ```
2. **Show Dashboard (`http://localhost:3000`)**:
   - Point out **INV-1002** (Apex Cloud Systems - $12,500).
3. **Perform Promise Extraction**:
   - Click **"Log Customer Reply"** on `INV-1002` (or use API).
   - Paste the customer reply text above.
   - Click **Submit**. Notice status immediately changes to **`PROMISE_MADE`**.
4. **Fire Webhook Live on Camera**:
   - Run `python scripts/trigger_demo_webhook.py INV-1002` in your terminal side-by-side with the browser.
   - Watch the dashboard status automatically update to **`PAID`** live on camera!
