import json
from dataclasses import dataclass
from typing import Any

import pytest
from pydantic import ValidationError

from app.engines.claude import ClaudeEngine, _sanitize_schema
from app.schemas import GrowthReport, PropertyProfileInput


@dataclass
class _Block:
    type: str
    text: str


@dataclass
class _Response:
    content: list[_Block]


def _valid_report_payload() -> dict[str, Any]:
    pillar = lambda name: {  # noqa: E731
        "pillar": name,
        "score": 70,
        "headline": "Headline for " + name,
        "findings": [
            {
                "title": "A concrete finding",
                "severity": "medium",
                "rationale": "Because the numbers say so.",
                "recommendedAction": "Do the thing.",
                "estimatedImpact": "+10%",
            }
        ],
    }
    return {
        "summary": "A grounded growth summary for the property.",
        "overallScore": 70,
        "estimatedMonthlyUplift": {"lowMinor": 50000, "highMinor": 120000, "currency": "EUR"},
        "pillars": [pillar("acquire"), pillar("monetize"), pillar("automate"), pillar("delight")],
        "quickWins": [{"title": "Win one", "action": "Do it now", "pillar": "acquire"}],
        "confidence": 0.8,
        # engine/model/generatedAt are overwritten by the engine — supply throwaways
        "engine": "claude",
        "model": "ignored",
        "generatedAt": "2020-01-01T00:00:00+00:00",
    }


class _FakeMessages:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.last_kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> _Response:
        self.last_kwargs = kwargs
        return _Response(content=[_Block(type="text", text=json.dumps(self._payload))])


class _FakeClient:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


def test_parses_and_validates_structured_output(villa_profile: PropertyProfileInput) -> None:
    client = _FakeClient(_valid_report_payload())
    engine = ClaudeEngine(
        client=client, model="claude-opus-4-8", effort="high", max_output_tokens=4000
    )

    report = engine.analyze(villa_profile)

    assert isinstance(report, GrowthReport)
    assert report.engine == "claude"
    assert report.model == "claude-opus-4-8"  # engine forces trustworthy metadata
    assert client.messages.last_kwargs["model"] == "claude-opus-4-8"
    assert client.messages.last_kwargs["output_config"]["effort"] == "high"


def test_invalid_model_output_raises(villa_profile: PropertyProfileInput) -> None:
    bad = _valid_report_payload()
    bad["overallScore"] = 9999  # out of bounds → Pydantic rejects
    engine = ClaudeEngine(
        client=_FakeClient(bad), model="claude-opus-4-8", effort="high", max_output_tokens=4000
    )
    with pytest.raises(ValidationError):
        engine.analyze(villa_profile)


def test_sanitize_strips_unsupported_constraints() -> None:
    schema = {"type": "string", "minLength": 3, "maxLength": 10, "enum": ["a", "b"]}
    cleaned = _sanitize_schema(schema)
    assert "minLength" not in cleaned and "maxLength" not in cleaned
    assert cleaned["enum"] == ["a", "b"]
