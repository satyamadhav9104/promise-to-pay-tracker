"""
Notifier service.
Sends outbound communications via Email (Resend API, real Gmail SMTP, or simulated) and WhatsApp (simulated).
Per FR20, WhatsApp operations are explicitly simulated and logged.
Includes rich HTML email templates with dynamic Razorpay Pay Now button.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings
from app.core.rules import Channel

logger = logging.getLogger(__name__)


def generate_email_html(customer_name: str, amount: float, due_date_str: str, payment_link: str, touch_number: int) -> str:
    """Renders a responsive, modern HTML email template for revenue recovery."""
    badge_color = "#3b82f6" if touch_number == 1 else "#ef4444"
    badge_text = "Payment Reminder" if touch_number == 1 else "Urgent Action Required"
    heading = f"Invoice Payment Reminder" if touch_number == 1 else "Overdue Notice: Urgent Settlement Required"
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" style="max-width:600px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="padding:32px 32px 24px;border-bottom:1px solid #334155;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                                            ⚡ <span style="color:#60a5fa;">Smart</span>Invoice
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="background-color:{badge_color}22;color:{badge_color};border:1px solid {badge_color}44;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                                            {badge_text}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 16px;">Hello {customer_name},</h1>
                            <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 24px;">
                                {"This is a friendly reminder that payment for your invoice is due." if touch_number == 1 else "Your invoice is now overdue. Please settle this amount immediately to maintain active services."}
                            </p>

                            <!-- Invoice Card -->
                            <table width="100%" style="background-color:#0f172a;border-radius:12px;border:1px solid #334155;margin:0 0 28px;">
                                <tr>
                                    <td style="padding:20px 24px;border-bottom:1px solid #1e293b;">
                                        <span style="font-size:13px;color:#64748b;text-transform:uppercase;font-weight:600;">Amount Outstanding</span>
                                        <div style="font-size:28px;font-weight:800;color:#38bdf8;margin-top:4px;">${amount:,.2f}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 24px;">
                                        <table width="100%">
                                            <tr>
                                                <td style="font-size:13px;color:#94a3b8;">Due Date:</td>
                                                <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;">{due_date_str}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Action CTA Button -->
                            <div style="text-align:center;margin:32px 0 24px;">
                                <a href="{payment_link}" style="background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;box-shadow:0 10px 15px -3px rgba(37,99,235,0.4);">
                                    💳 Pay Now with Razorpay →
                                </a>
                            </div>

                            <p style="font-size:13px;line-height:1.5;color:#64748b;text-align:center;margin:0;">
                                Need to propose an alternate payment date? Simply reply to this email with your commitment date.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
                            <div style="font-size:12px;color:#475569;">
                                © 2026 SmartInvoice AI Revenue Recovery. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
    return html


def _send_resend_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Sends a real email using Resend API."""
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
        if html_body:
            params["html"] = html_body

        email_res = resend.Emails.send(params)
        logger.info(f"[RESEND EMAIL SENT] To: {to_email} | ID: {email_res.get('id')}")
        return True
    except Exception as e:
        logger.error(f"[RESEND EMAIL FAILED] Error: {e}")
        return False


def _send_real_smtp_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Sends a real email via Gmail SMTP using Python's built-in smtplib."""
    if not settings.smtp_username or not settings.smtp_password:
        return False

    sender = settings.sender_email or settings.smtp_username

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))
        if html_body:
            msg.attach(MIMEText(html_body, "html", "utf-8"))

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
    if not to_email or "@example.com" in to_email.lower():
        to_email = getattr(settings, 'default_recipient_email', None) or "satyamaadhav@gmail.com"
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

        html_body = generate_email_html(customer_name, amount, due_date_str, payment_link, touch_number)

        # Try Resend API first, then SMTP
        resend_sent = _send_resend_email(to_email, subject, body, html_body=html_body)
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

        smtp_sent = _send_real_smtp_email(to_email, subject, body, html_body=html_body)
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

