"""Runtime configuration for the StayBoost AI service.

Settings come from the environment. When ANTHROPIC_API_KEY is absent the service
runs the deterministic heuristic engine — a real offline baseline, never a stub —
so the Analyzer works in local/dev/CI without a key.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

# Primary model per docs/07 and the Anthropic model catalog. Do not downgrade.
DEFAULT_MODEL = "claude-opus-4-8"
DEFAULT_EFFORT = "high"


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str | None
    model: str
    effort: str
    # Shared secret the core API presents to call this internal service.
    service_token: str | None
    allowed_origins: tuple[str, ...]
    max_output_tokens: int
    # Fields below have defaults so they remain optional in dev/test.
    # Sentry DSN for error monitoring (leave empty in dev/CI)
    sentry_dsn: str | None = None
    # Rate limits — override in tests with small values ("2/minute")
    analyze_rate_limit: str = "10/minute"
    global_rate_limit: str = "100/minute"

    @property
    def claude_enabled(self) -> bool:
        return bool(self.anthropic_api_key)


def load_settings() -> Settings:
    origins = os.environ.get("AI_ALLOWED_ORIGINS", "http://localhost:4000")
    return Settings(
        anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY") or None,
        model=os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL),
        effort=os.environ.get("AI_EFFORT", DEFAULT_EFFORT),
        service_token=os.environ.get("AI_SERVICE_TOKEN") or None,
        allowed_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
        max_output_tokens=int(os.environ.get("AI_MAX_OUTPUT_TOKENS", "4000")),
        sentry_dsn=os.environ.get("AI_SENTRY_DSN") or None,
        analyze_rate_limit=os.environ.get("ANALYZE_RATE_LIMIT", "10/minute"),
        global_rate_limit=os.environ.get("GLOBAL_RATE_LIMIT", "100/minute"),
    )
