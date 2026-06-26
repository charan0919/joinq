import os
from typing import Optional
import traceback


# ── WhatsApp Notification Service ────────────────────────────────
# Currently runs as a stub (logs messages instead of sending).
# To enable real WhatsApp sending via Twilio:
# 1. pip install twilio
# 2. Add to .env:
#    TWILIO_ACCOUNT_SID=your_sid
#    TWILIO_AUTH_TOKEN=your_token
#    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
# 3. Uncomment the Twilio block below and remove the stub block.


TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

TWILIO_ENABLED = bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)


async def send_whatsapp_message(phone: str, message: str) -> bool:
    """
    Send a WhatsApp message to a customer.
    Returns True if sent successfully, False otherwise.
    Phone number should be in format: +919876543210
    """
    if not phone.startswith("+"):
        phone = f"+91{phone}"  # Default to India country code

    if TWILIO_ENABLED:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                to=f"whatsapp:{phone}",
                body=message,
            )
            print(f"[WhatsApp] Sent to {phone}: {message}")
            return True
        except Exception as e:
            print(f"[WhatsApp] Failed to send to {phone}: {e}")
            print(traceback.format_exc())
            return False
    else:
        # Stub mode — log instead of sending
        print(f"[WhatsApp STUB] To: {phone} | Message: {message}")
        return True


async def notify_queue_joined(
    phone: str,
    customer_name: str,
    token_number: str,
    queue_name: str,
    business_name: str,
    position: int,
    estimated_wait: int,
) -> bool:
    message = (
        f"Hi {customer_name}! 👋\n\n"
        f"You've joined the queue at *{business_name}*.\n\n"
        f"Queue: {queue_name}\n"
        f"Your Token: *{token_number}*\n"
        f"Position: {position}\n"
        f"Estimated Wait: {estimated_wait} mins\n\n"
        f"We'll notify you when your turn is near. 🙏"
    )
    return await send_whatsapp_message(phone, message)


async def notify_turn_approaching(
    phone: str,
    customer_name: str,
    token_number: str,
    queue_name: str,
    position: int,
) -> bool:
    message = (
        f"Hi {customer_name}! ⏰\n\n"
        f"Your turn is approaching at *{queue_name}*.\n\n"
        f"Your Token: *{token_number}*\n"
        f"Position: {position} ahead of you\n\n"
        f"Please be ready! 🙏"
    )
    return await send_whatsapp_message(phone, message)


async def notify_token_called(
    phone: str,
    customer_name: str,
    token_number: str,
    queue_name: str,
) -> bool:
    message = (
        f"Hi {customer_name}! 🔔\n\n"
        f"It's your turn at *{queue_name}*!\n\n"
        f"Your Token: *{token_number}*\n\n"
        f"Please proceed to the counter now. ✅"
    )
    return await send_whatsapp_message(phone, message)


async def notify_queue_cancelled(
    phone: str,
    customer_name: str,
    token_number: str,
    queue_name: str,
    business_name: str,
) -> bool:
    message = (
        f"Hi {customer_name},\n\n"
        f"Your token *{token_number}* at *{business_name}* ({queue_name}) "
        f"has been cancelled.\n\n"
        f"We hope to serve you soon! 🙏"
    )
    return await send_whatsapp_message(phone, message)