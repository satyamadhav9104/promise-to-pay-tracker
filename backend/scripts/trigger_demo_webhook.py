"""
Demo webhook helper.

Fires a Razorpay `payment.captured` webhook at the local backend to move an invoice
(default: INV-1002) to PAID live on camera.

The payload is signed with RAZORPAY_WEBHOOK_SECRET exactly the way Razorpay signs it,
so this exercises the real verification path instead of routing around it.

Usage:
    python scripts/trigger_demo_webhook.py                # sign properly, expect 200
    python scripts/trigger_demo_webhook.py INV-1004       # a different invoice
    python scripts/trigger_demo_webhook.py INV-1002 --forge   # bad signature, expect 400
"""
import json
import os
import sys
import urllib.error
import urllib.request

# Add the backend root to sys.path so `app.*` imports resolve when run directly.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.razorpay_client import sign_webhook_payload

DEFAULT_URL = "http://127.0.0.1:8000/api/webhooks/razorpay"


def build_payload(invoice_id: str) -> dict:
    return {
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
                    "notes": {"invoice_id": invoice_id}
                }
            }
        }
    }


def fire_webhook(invoice_id: str = "INV-1002", target_url: str = DEFAULT_URL, forge: bool = False) -> int:
    payload = build_payload(invoice_id)

    # Sign the exact bytes that get sent. Signing a re-serialised copy would produce
    # a digest for different whitespace and the server would correctly reject it.
    data = json.dumps(payload).encode("utf-8")

    headers = {"Content-Type": "application/json"}
    signature = sign_webhook_payload(data.decode("utf-8"))

    if forge:
        headers["X-Razorpay-Signature"] = "0" * 64
        print("\n[forge] Sending a deliberately invalid signature. A 400 here is the correct result.")
    elif signature:
        headers["X-Razorpay-Signature"] = signature
        print(f"\nSigned the payload with RAZORPAY_WEBHOOK_SECRET (HMAC-SHA256).")
    else:
        print(
            "\nNOTE: RAZORPAY_WEBHOOK_SECRET is not set, so this request carries no signature.\n"
            "      The server will accept it but will record in the audit trail that the\n"
            "      payment was never cryptographically verified. Set the secret in backend/.env\n"
            "      to demo real verification."
        )

    print(f"Firing 'payment.captured' for {invoice_id} -> {target_url}")

    req = urllib.request.Request(target_url, data=data, headers=headers)

    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            print(f"\nHTTP {response.status}")
            print(body)
            try:
                parsed = json.loads(body)
                if parsed.get("signature_verified"):
                    print(f"\nInvoice '{invoice_id}' is PAID, on a cryptographically verified webhook.")
                else:
                    print(f"\nInvoice '{invoice_id}' is PAID, but the signature was NOT verified (see the audit trail).")
            except json.JSONDecodeError:
                pass
            return 0
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8")
        print(f"\nHTTP {e.code} — request rejected")
        print(detail)
        if forge and e.code == 400:
            print("\nThat is the expected outcome: a forged signature cannot close an invoice.")
            return 0
        return 1
    except urllib.error.URLError as e:
        print(f"\nCould not reach the server ({e}). Is the backend running on http://127.0.0.1:8000 ?")
        return 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    target_invoice = args[0] if args else "INV-1002"
    sys.exit(fire_webhook(target_invoice, forge="--forge" in sys.argv))
