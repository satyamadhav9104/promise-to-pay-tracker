"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://root:123456789@localhost:3306/promise_to_pay_db"
    razorpay_key_id: str = "rzp_test_mock12345"
    razorpay_key_secret: str = "mock_secret_12345"
    razorpay_webhook_secret: str = ""
    llm_api_key: str = ""
    llm_provider: str = "anthropic"  # anthropic | gemini

    # Free Email (Gmail SMTP / Custom SMTP) configuration
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""  # Your Gmail address: e.g. user@gmail.com
    smtp_password: str = ""  # Gmail App Password (16 chars)
    sender_email: str = ""   # e.g. user@gmail.com

    # Escalation rules (see FR16-FR18 in requirements)
    max_touches_per_invoice: int = 3
    cooldown_days_between_touches: int = 4
    promise_confidence_threshold: float = 0.7

    class Config:
        env_file = ".env"


settings = Settings()
