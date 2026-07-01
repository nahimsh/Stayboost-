"""StayBoost AI service (FastAPI).

Internal service: the core API (NestJS) calls it server-to-server. Not exposed to
the browser. Authenticated with a shared service token when configured.
"""

import os
from typing import Annotated

import sentry_sdk
from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.analyzer import AnalyzerService
from app.config import Settings, load_settings
from app.schemas import GrowthReport, PropertyProfileInput

# Module-level Annotated alias so ruff B008 (no function calls in defaults) is satisfied.
_ProfileBody = Annotated[PropertyProfileInput, Body()]


def _before_send(event: dict, hint: dict) -> dict | None:
    """Drop 4xx HTTP exceptions — only server bugs (5xx / unexpected) go to Sentry."""
    exc_info = hint.get("exc_info")
    if exc_info:
        _, exc_value, _ = exc_info
        if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
            return None
    return event


class _SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds defensive security headers to every response.

    This is an internal JSON API — no browser resources to load, so the
    Content-Security-Policy is maximally restrictive.
    """

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'none'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


def create_app(settings: Settings) -> FastAPI:
    """Create and configure the FastAPI application.

    Factored out so tests can create isolated instances with custom rate limits
    without touching the module-level production singleton.
    """
    # Per-IP rate limiter. Uses in-memory storage — for a multi-instance
    # deployment switch to a Redis URI (storage_uri="redis://...").
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[settings.global_rate_limit],
        storage_uri="memory://",
        headers_enabled=True,
    )

    _app = FastAPI(title="StayBoost AI", version="0.1.0")
    _app.state.limiter = limiter
    _app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Middleware stack (applied last-in = outermost on the way in):
    #   SlowAPIMiddleware  → rate-limit check before reaching the route handler
    #   CORSMiddleware     → CORS headers on all responses (incl. 429s)
    #   SecurityHeaders    → security headers on every response (outermost)
    _app.add_middleware(SlowAPIMiddleware)
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_methods=["POST", "GET"],
        # Restrict to headers this service actually uses — not the wildcard "*"
        allow_headers=["Authorization", "Content-Type", "X-Service-Token"],
    )
    _app.add_middleware(_SecurityHeadersMiddleware)

    _analyzer = AnalyzerService(settings)

    def require_service_token(x_service_token: str | None = Header(default=None)) -> None:
        """Reject calls without the shared secret when one is configured."""
        if settings.service_token and x_service_token != settings.service_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid service token"
            )

    @_app.get("/health")
    def health() -> dict[str, object]:
        return {"status": "ok", "claudeEnabled": settings.claude_enabled}

    @_app.post(
        "/v1/analyze",
        response_model=GrowthReport,
        dependencies=[Depends(require_service_token)],
    )
    @limiter.limit(settings.analyze_rate_limit)
    def analyze(request: Request, profile: _ProfileBody) -> JSONResponse:
        result = _analyzer.analyze(profile)
        return JSONResponse(content=result.model_dump())

    return _app


# ── Module-level initialization ───────────────────────────────────────────────
settings: Settings = load_settings()

# Sentry must be initialized before the app so bootstrap errors are captured.
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=os.environ.get("ENVIRONMENT", "development"),
        traces_sample_rate=0,
        send_default_pii=False,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        before_send=_before_send,
    )

app = create_app(settings)
