"""StayBoost AI service (FastAPI).

Internal service: the core API (NestJS) calls it server-to-server. Not exposed to
the browser. Authenticated with a shared service token when configured.
"""

from __future__ import annotations

import os

import sentry_sdk
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.analyzer import AnalyzerService
from app.config import Settings, load_settings
from app.schemas import GrowthReport, PropertyProfileInput

settings: Settings = load_settings()


def _before_send(event: dict, hint: dict) -> dict | None:
    """Drop 4xx HTTP exceptions — only server bugs (5xx / unexpected) go to Sentry."""
    exc_info = hint.get("exc_info")
    if exc_info:
        _, exc_value, _ = exc_info
        if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
            return None
    return event


# Initialize Sentry before the app is created so startup errors are captured.
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=os.environ.get("ENVIRONMENT", "development"),
        traces_sample_rate=0,  # Error monitoring only
        send_default_pii=False,  # Never auto-attach user IP or session data
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        before_send=_before_send,
    )

analyzer = AnalyzerService(settings)

app = FastAPI(title="StayBoost AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def require_service_token(x_service_token: str | None = Header(default=None)) -> None:
    """Reject calls without the shared secret when one is configured."""
    if settings.service_token and x_service_token != settings.service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid service token"
        )


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "claudeEnabled": settings.claude_enabled}


@app.post("/v1/analyze", response_model=GrowthReport, dependencies=[Depends(require_service_token)])
def analyze(profile: PropertyProfileInput) -> GrowthReport:
    return analyzer.analyze(profile)
