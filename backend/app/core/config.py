"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./promise_to_pay.db"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    llm_api_key: str = ""
    llm_provider: str = "anthropic"  # anthropic | gemini

    # Escalation rules (see FR16-FR18 in requirements)
    max_touches_per_invoice: int = 3
    cooldown_days_between_touches: int = 4
    promise_confidence_threshold: float = 0.7

    class Config:
        env_file = ".env"


settings = Settings()
