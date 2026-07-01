"""Tests that verify rate limiting and security headers on the AI service."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

# Minimal valid profile — skips optional numeric fields so the heuristic engine runs.
_VALID_PROFILE = {
    "propertyName": "Test Hotel",
    "propertyType": "hotel",
    "country": "US",
    "city": "New York",
    "unitsCount": 10,
    "currency": "USD",
    "channels": ["airbnb"],
    "biggestChallenge": "more_bookings",
}


def _tight_settings(**overrides: object) -> Settings:
    """Settings with a very small rate limit for fast 429 tests."""
    base: dict[str, object] = dict(
        anthropic_api_key=None,
        model="claude-opus-4-8",
        effort="high",
        service_token=None,
        allowed_origins=("http://localhost:4000",),
        max_output_tokens=4000,
        analyze_rate_limit="2/minute",
        global_rate_limit="5/minute",
    )
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


@pytest.fixture
def limited_client() -> TestClient:
    """Fresh app + client with 2/minute analyze limit. Each test gets its own
    Limiter instance (fresh counters) because create_app() is called anew."""
    return TestClient(create_app(_tight_settings()))


# ── Per-route rate limit ──────────────────────────────────────────────────────


def test_analyze_allows_requests_within_limit(limited_client: TestClient) -> None:
    for _ in range(2):
        res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
        assert res.status_code == 200


def test_analyze_returns_429_when_limit_exceeded(limited_client: TestClient) -> None:
    # Exhaust the 2/minute limit
    for _ in range(2):
        limited_client.post("/v1/analyze", json=_VALID_PROFILE)

    # Next request must be rejected
    res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res.status_code == 429


def test_analyze_429_includes_retry_after_header(limited_client: TestClient) -> None:
    for _ in range(2):
        limited_client.post("/v1/analyze", json=_VALID_PROFILE)

    res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res.status_code == 429
    lower_headers = {k.lower(): v for k, v in res.headers.items()}
    assert "retry-after" in lower_headers, "429 must carry Retry-After header"


# ── Rate-limit response headers on successful requests ────────────────────────


def test_rate_limit_headers_present_on_success(limited_client: TestClient) -> None:
    res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res.status_code == 200
    lower = {k.lower() for k in res.headers}
    assert "x-ratelimit-limit" in lower
    assert "x-ratelimit-remaining" in lower
    assert "x-ratelimit-reset" in lower


def test_remaining_decrements_with_each_request(limited_client: TestClient) -> None:
    res1 = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    res2 = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res1.status_code == 200
    assert res2.status_code == 200
    remaining1 = int(res1.headers["x-ratelimit-remaining"])
    remaining2 = int(res2.headers["x-ratelimit-remaining"])
    assert remaining2 < remaining1, "remaining counter must decrement"


# ── Security headers ──────────────────────────────────────────────────────────


def test_security_headers_on_success(limited_client: TestClient) -> None:
    res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "default-src 'none'" in (res.headers.get("content-security-policy") or "")


def test_security_headers_on_429(limited_client: TestClient) -> None:
    """Security headers must be present even on error responses."""
    for _ in range(2):
        limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    res = limited_client.post("/v1/analyze", json=_VALID_PROFILE)
    assert res.status_code == 429
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"


# ── CORS origin restriction ───────────────────────────────────────────────────


def test_cors_allows_configured_origin(limited_client: TestClient) -> None:
    res = limited_client.get(
        "/health", headers={"Origin": "http://localhost:4000"}
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:4000"


def test_cors_blocks_unknown_origin(limited_client: TestClient) -> None:
    res = limited_client.get(
        "/health", headers={"Origin": "https://evil.example.com"}
    )
    # The response is returned (CORS doesn't block server-side), but the
    # Access-Control-Allow-Origin header must NOT echo back the unknown origin.
    acao = res.headers.get("access-control-allow-origin", "")
    assert "evil.example.com" not in acao
