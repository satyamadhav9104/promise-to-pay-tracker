"""
Notifier service.
Sends outbound communications via Email (Resend API, real Gmail SMTP, or simulated) and WhatsApp (simulated).
Per FR20, WhatsApp operations are explicitly simulated and logged.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings
from app.core.rules import Channel

logger = logging.getLogger(__name__)


def _send_resend_email(to_email: str, subject: str, body: str) -> bool:
    """Sends a real email using Resend free API (3,000 free emails/month)."""
    if not settings.resend_api_key:
        return False

    try:
        import resend
        resend.api_key = settings.resend_api_key

        sender = settings.sender_email or "onboarding@resend.dev"
        params = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "text": body,
        }
        email_res = resend.Emails.send(params)
        logger.info(f"[RESEND EMAIL SENT] To: {to_email} | ID: {email_res.get('id')}")
        return True
    except Exception as e:
        logger.error(f"[RESEND EMAIL FAILED] Error: {e}")
        return False


def _send_real_smtp_email(to_email: str, subject: str, body: str) -> bool:
    """Sends a real email via Gmail SMTP using Python's built-in smtplib."""
    if not settings.smtp_username or not settings.smtp_password:
        return False

    sender = settings.sender_email or settings.smtp_username

    try:
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"[REAL SMTP EMAIL SENT] To: {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"[SMTP EMAIL FAILED] Error: {e}")
        return False


def send_notification(
    customer_name: str,
    channel: Channel,
    touch_number: int,
    amount: float,
    due_date_str: str,
    recipient_email: Optional[str] = None
) -> dict:
    """
    Sends an outbound touch (Email or WhatsApp).
    Dispatches via Resend API or SMTP if configured. Otherwise logs simulated delivery.
    """
    to_email = recipient_email or f"{customer_name.lower().replace(' ', '.')}@example.com"
    payment_link = f"https://rzp.io/l/pay_{customer_name.lower().replace(' ', '')}_inv"

    if channel == Channel.EMAIL:
        if touch_number == 1:
            subject = f"Friendly Reminder: Invoice Payment Due ({due_date_str})"
            body = (
                f"Hi {customer_name},\n\n"
                f"This is a gentle reminder that your invoice of ${amount:,.2f} was due on {due_date_str}.\n\n"
                f"💳 Instant Razorpay Payment Link:\n{payment_link}\n\n"
                f"Please reply with your expected payment date or complete payment via Razorpay link above.\n\n"
                f"Thank you,\nCollections Team"
            )
        else:
            subject = f"Urgent: Overdue Invoice Payment (${amount:,.2f})"
            body = (
                f"Dear {customer_name},\n\n"
                f"Your invoice of ${amount:,.2f} is now significantly overdue.\n\n"
                f"💳 Instant Razorpay Payment Verification Link:\n{payment_link}\n\n"
                f"Please settle payment immediately via Razorpay link above to prevent account escalation.\n\n"
                f"Sincerely,\nFinance & Accounts Department"
            )

        # Try Resend API first, then SMTP
        resend_sent = _send_resend_email(to_email, subject, body)
        if resend_sent:
            return {
                "channel": "email",
                "touch_number": touch_number,
                "simulated": False,
                "provider": "resend",
                "recipient": to_email,
                "subject": subject,
                "body": body,
                "status": "sent_via_resend"
            }

        smtp_sent = _send_real_smtp_email(to_email, subject, body)
        if smtp_sent:
            return {
                "channel": "email",
                "touch_number": touch_number,
                "simulated": False,
                "provider": "smtp",
                "recipient": to_email,
                "subject": subject,
                "body": body,
                "status": "sent_via_smtp"
            }

        # Fallback to simulated delivery
        logger.info(f"[SIMULATED EMAIL] To: {customer_name} ({to_email}) | Subject: {subject}")
        return {
            "channel": "email",
            "touch_number": touch_number,
            "simulated": True,
            "provider": "simulated",
            "recipient": to_email,
            "subject": subject,
            "body": body,
            "status": "delivered_simulated"
        }

    elif channel == Channel.WHATSAPP:
        message = f"[SIMULATED WHATSAPP] Hi {customer_name}, your invoice for ${amount:,.2f} requires immediate attention. Final notice prior to human account escalation."
        logger.info(message)
        return {
            "channel": "whatsapp",
            "touch_number": touch_number,
            "simulated": True,
            "provider": "simulated",
            "body": message,
            "status": "delivered_simulated"
        }

    raise ValueError(f"Unsupported notification channel: {channel}")
