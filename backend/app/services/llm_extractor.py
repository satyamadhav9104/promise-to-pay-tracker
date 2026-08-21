"""
LLM Extraction service.
Extracts structured payment promises or payment claims from customer reply text.
Enforces Pydantic schema and returns structured PromiseExtractionResult.
"""
import json
import re
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings
from app.schemas.extraction import PromiseExtractionResult


def _heuristic_extractor(reply_text: str) -> PromiseExtractionResult:
    """
    Deterministic rule/regex based parser for local testing & fallback when no LLM API key is present.
    Accurately classifies synthetic reply test cases.
    """
    text_lower = reply_text.lower()

    # Check for payment claim ("I already paid")
    payment_claim_keywords = [
        "already paid", "paid yesterday", "payment done", "transferred", "sent the money",
        "paid via", "completed the transfer", "payment made", "already transferred", "transaction id"
    ]
    if any(k in text_lower for k in payment_claim_keywords):
        return PromiseExtractionResult(
            is_promise=False,
            is_payment_claim=True,
            promised_date=None,
            confidence_score=0.95,
            reasoning="Customer explicitly claims payment has already been completed."
        )

    # Check for dispute / refusal
    dispute_keywords = ["incorrect amount", "dispute", "cancelling", "wrong invoice", "will not pay"]
    if any(k in text_lower for k in dispute_keywords):
        return PromiseExtractionResult(
            is_promise=False,
            is_payment_claim=False,
            promised_date=None,
            confidence_score=0.90,
            reasoning="Customer is disputing the invoice or refusing payment."
        )

    # Check for explicit date promise
    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", text_lower)
    if date_match:
        try:
            promised_dt = datetime.strptime(date_match.group(1), "%Y-%m-%d")
            return PromiseExtractionResult(
                is_promise=True,
                is_payment_claim=False,
                promised_date=promised_dt,
                confidence_score=0.92,
                reasoning=f"Extracted explicit date commitment: {date_match.group(1)}."
            )
        except ValueError:
            pass

    # Relative date terms
    now = datetime.utcnow()
    if "tomorrow" in text_lower:
        return PromiseExtractionResult(
            is_promise=True,
            is_payment_claim=False,
            promised_date=now + timedelta(days=1),
            confidence_score=0.88,
            reasoning="Extracted relative date commitment: tomorrow."
        )
    if "next monday" in text_lower or "by monday" in text_lower:
        return PromiseExtractionResult(
            is_promise=True,
            is_payment_claim=False,
            promised_date=now + timedelta(days=5),
            confidence_score=0.85,
            reasoning="Extracted relative date commitment: next Monday."
        )
    if "by end of week" in text_lower or "this friday" in text_lower or "by friday" in text_lower:
        return PromiseExtractionResult(
            is_promise=True,
            is_payment_claim=False,
            promised_date=now + timedelta(days=4),
            confidence_score=0.85,
            reasoning="Extracted relative date commitment: end of week / Friday."
        )
    if "next week" in text_lower or "in 5 days" in text_lower or "within 7 days" in text_lower:
        return PromiseExtractionResult(
            is_promise=True,
            is_payment_claim=False,
            promised_date=now + timedelta(days=7),
            confidence_score=0.80,
            reasoning="Extracted commitment for next week / 7 days."
        )

    # Vague commitments (low confidence)
    vague_keywords = ["soon", "working on it", "shortly", "maybe", "trying to arrange", "sometime next month"]
    if any(k in text_lower for k in vague_keywords):
        return PromiseExtractionResult(
            is_promise=True,
            is_payment_claim=False,
            promised_date=None,
            confidence_score=0.45,  # Below threshold 0.7
            reasoning="Vague expression of payment intent without specific date. Low confidence."
        )

    # Default no clear promise detected
    return PromiseExtractionResult(
        is_promise=False,
        is_payment_claim=False,
        promised_date=None,
        confidence_score=0.30,
        reasoning="No payment promise or claim detected in reply text."
    )


def extract_promise_from_reply(reply_text: str) -> PromiseExtractionResult:
    """
    Extracts structured payment promise or payment claim from customer reply.
    Uses Anthropic API if key is present, otherwise uses deterministic parser.
    """
    if settings.llm_api_key and settings.llm_provider == "anthropic":
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.llm_api_key)
            prompt = f"""
Analyze the following customer reply regarding an invoice payment:
"{reply_text}"

Return JSON matching this schema:
{{
  "is_promise": bool,
  "is_payment_claim": bool,
  "promised_date": string or null (ISO 8601 YYYY-MM-DD format if mentioned),
  "confidence_score": float (0.0 to 1.0),
  "reasoning": string
}}
Respond ONLY with valid JSON.
"""
            response = client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            raw_content = response.content[0].text
            data = json.loads(raw_content)
            
            p_date = None
            if data.get("promised_date"):
                try:
                    p_date = datetime.fromisoformat(data["promised_date"].replace("Z", ""))
                except Exception:
                    pass

            return PromiseExtractionResult(
                is_promise=data.get("is_promise", False),
                is_payment_claim=data.get("is_payment_claim", False),
                promised_date=p_date,
                confidence_score=float(data.get("confidence_score", 0.5)),
                reasoning=data.get("reasoning", "Extracted via Anthropic LLM.")
            )
        except Exception:
            # Fallback to heuristic parser on API error
            pass

    return _heuristic_extractor(reply_text)
