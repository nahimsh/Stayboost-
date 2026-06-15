"""Claude-backed growth analysis (primary engine in production).

Grounds the analysis in the property's own numbers and returns a schema-validated
GrowthReport via structured outputs. The Anthropic client is injected so the
prompt-building and response-parsing are unit-testable without network or a key.
"""

from __future__ import annotations

import json
from typing import Any, Protocol

from app.schemas import GrowthReport, PropertyProfileInput

ENGINE_NAME = "claude"

_SYSTEM_PROMPT = (
    "You are StayBoost's hospitality Growth Analyst. Given a property's profile, "
    "produce an honest, specific growth report across four pillars: acquire (more "
    "bookings), monetize (revenue per guest), automate (operator time saved), and "
    "delight (guest experience). Ground every finding in the numbers provided. "
    "Revenue uplift must be a transparent RANGE in integer minor units of the "
    "property's currency — never a guarantee, never a single number. Scores are "
    "0-100. Be concrete and actionable; no fluff, no invented data. Return exactly "
    "four pillars (acquire, monetize, automate, delight) and 1-5 quick wins."
)

# Structured-output constraints (minLength/maximum/etc.) are not enforced by the
# format schema, so we keep the schema to types + enums + required + closed objects
# and re-validate the full Pydantic model (with bounds) after parsing.
_UNSUPPORTED_KEYS = frozenset(
    {"minLength", "maxLength", "minimum", "maximum", "multipleOf", "minItems", "maxItems"}
)


def _sanitize_schema(node: Any) -> Any:
    if isinstance(node, dict):
        return {k: _sanitize_schema(v) for k, v in node.items() if k not in _UNSUPPORTED_KEYS}
    if isinstance(node, list):
        return [_sanitize_schema(v) for v in node]
    return node


class _MessagesClient(Protocol):
    def create(self, **kwargs: Any) -> Any: ...


class _AnthropicLike(Protocol):
    @property
    def messages(self) -> _MessagesClient: ...


def _build_user_prompt(p: PropertyProfileInput) -> str:
    lines = [
        f"Property: {p.propertyName} ({p.propertyType}) in {p.city}, {p.country}",
        f"Units: {p.unitsCount}",
        f"Currency: {p.currency}",
        f"Channels: {', '.join(p.channels)}",
        f"Biggest stated challenge: {p.biggestChallenge}",
    ]
    if p.avgNightlyRateMinor is not None:
        lines.append(f"Average nightly rate (minor units): {p.avgNightlyRateMinor}")
    if p.occupancyPctLast30 is not None:
        lines.append(f"Occupancy last 30 days: {p.occupancyPctLast30}%")
    if p.reviewScore is not None:
        lines.append(f"Review score: {p.reviewScore}/5")
    if p.reviewResponseRatePct is not None:
        lines.append(f"Review response rate: {p.reviewResponseRatePct}%")
    if p.avgResponseTimeHours is not None:
        lines.append(f"Average guest response time: {p.avgResponseTimeHours}h")
    return "\n".join(lines)


def _extract_text(response: Any) -> str:
    parts = [
        getattr(block, "text", "")
        for block in getattr(response, "content", [])
        if getattr(block, "type", None) == "text"
    ]
    text = "".join(parts).strip()
    if not text:
        raise ValueError("Claude returned no text content")
    return text


class ClaudeEngine:
    name = ENGINE_NAME

    def __init__(
        self,
        client: _AnthropicLike,
        model: str,
        effort: str,
        max_output_tokens: int,
    ) -> None:
        self._client = client
        self._model = model
        self._effort = effort
        self._max_tokens = max_output_tokens
        self._format_schema = _sanitize_schema(GrowthReport.model_json_schema())

    def analyze(self, profile: PropertyProfileInput) -> GrowthReport:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=_SYSTEM_PROMPT,
            output_config={
                "effort": self._effort,
                "format": {"type": "json_schema", "schema": self._format_schema},
            },
            messages=[{"role": "user", "content": _build_user_prompt(profile)}],
        )
        data = json.loads(_extract_text(response))
        # Re-validate against the full bounded schema; force trustworthy metadata.
        report = GrowthReport.model_validate(
            {
                **data,
                "engine": ENGINE_NAME,
                "model": self._model,
                "generatedAt": GrowthReport.now_iso(),
            }
        )
        return report
