"""StayBoost AI service (FastAPI).

Internal service: the core API (NestJS) calls it server-to-server. Not exposed to
the browser. Authenticated with a shared service token when configured.
"""

from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.analyzer import AnalyzerService
from app.config import Settings, load_settings
from app.schemas import GrowthReport, PropertyProfileInput

settings: Settings = load_settings()
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
