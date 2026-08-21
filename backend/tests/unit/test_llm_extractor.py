"""Unit tests for LLM promise extraction and confidence threshold enforcement."""
from app.services.llm_extractor import extract_promise_from_reply, _heuristic_extractor
from app.core.config import settings


def test_explicit_date_promise_extraction():
    res = _heuristic_extractor("We will transfer the payment by 2026-09-01.")
    assert res.is_promise is True
    assert res.is_payment_claim is False
    assert res.promised_date is not None
    assert res.confidence_score >= settings.promise_confidence_threshold


def test_payment_claim_extraction():
    res = _heuristic_extractor("I already paid this invoice yesterday via UPI.")
    assert res.is_promise is False
    assert res.is_payment_claim is True
    assert res.confidence_score >= 0.90


def test_vague_promise_low_confidence():
    res = _heuristic_extractor("We are working on it and will try to pay soon.")
    assert res.is_promise is True
    assert res.confidence_score < settings.promise_confidence_threshold
