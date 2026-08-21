"""
Notifier service.
Simulates sending outbound communications via Email and WhatsApp.
Per FR20, WhatsApp operations are explicitly simulated and logged.
"""
import logging
from app.core.rules import Channel

logger = logging.getLogger(__name__)


def send_notification(customer_name: str, channel: Channel, touch_number: int, amount: float, due_date_str: str) -> dict:
    """
    Simulates sending an outbound touch (Email or WhatsApp).
    Returns message delivery metadata.
    """
    if channel == Channel.EMAIL:
        if touch_number == 1:
            subject = f"Friendly Reminder: Invoice Payment Due ({due_date_str})"
            body = f"Hi {customer_name}, this is a gentle reminder that your invoice of ${amount:.2f} was due on {due_date_str}. Please let us know when payment will be completed."
        else:
            subject = f"Urgent: Overdue Invoice Payment (${amount:.2f})"
            body = f"Dear {customer_name}, your invoice of ${amount:.2f} is now significantly overdue. Please confirm your payment plan or complete payment immediately."

        logger.info(f"[SIMULATED EMAIL] To: {customer_name} | Subject: {subject}")
        return {
            "channel": "email",
            "touch_number": touch_number,
            "simulated": True,
            "subject": subject,
            "body": body,
            "status": "delivered"
        }

    elif channel == Channel.WHATSAPP:
        message = f"[SIMULATED WHATSAPP] Hi {customer_name}, your invoice for ${amount:.2f} requires immediate attention. Final notice prior to human account escalation."
        logger.info(message)
        return {
            "channel": "whatsapp",
            "touch_number": touch_number,
            "simulated": True,
            "body": message,
            "status": "delivered"
        }

    raise ValueError(f"Unsupported notification channel: {channel}")
