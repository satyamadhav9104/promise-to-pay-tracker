"""
Demo Webhook Helper Script
Fires a Razorpay payment.captured webhook to the local FastAPI backend
to transition an invoice (default: INV-1002) to PAID live on camera.
"""
import sys
import json
import urllib.request
import urllib.error

def fire_webhook(invoice_id="INV-1002", target_url="http://127.0.0.1:8000/api/webhooks/razorpay"):
    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_LIVE_DEMO_{invoice_id.replace('-', '')}",
                    "amount": 1250000,
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi",
                    "description": f"Live Demo Payment for {invoice_id}",
                    "notes": {
                        "invoice_id": invoice_id
                    }
                }
            }
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        target_url,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    print(f"\n🚀 Firing Razorpay 'payment.captured' Webhook for invoice {invoice_id}...")
    print(f"Target URL: {target_url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print("\n✅ Webhook Response:")
            print(res_body)
            print(f"\n🎉 Invoice '{invoice_id}' successfully transitioned to PAID live!")
    except urllib.error.URLError as e:
        print(f"\n❌ Error connecting to server ({e}). Make sure backend is running on http://127.0.0.1:8000")

if __name__ == "__main__":
    target_invoice = sys.argv[1] if len(sys.argv) > 1 else "INV-1002"
    fire_webhook(target_invoice)
