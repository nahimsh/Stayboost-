from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID = {
    "propertyName": "Sea Breeze Villa",
    "propertyType": "villa",
    "country": "Portugal",
    "city": "Lagos",
    "unitsCount": 2,
    "currency": "EUR",
    "channels": ["airbnb", "booking_com"],
    "biggestChallenge": "more_bookings",
}


def test_health() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_analyze_returns_valid_report() -> None:
    res = client.post("/v1/analyze", json=VALID)
    assert res.status_code == 200
    body = res.json()
    assert len(body["pillars"]) == 4
    assert body["engine"] in {"heuristic", "claude"}
    assert 0 <= body["overallScore"] <= 100


def test_analyze_rejects_invalid_payload() -> None:
    res = client.post("/v1/analyze", json={**VALID, "channels": []})
    assert res.status_code == 422


def test_analyze_rejects_unknown_property_type() -> None:
    res = client.post("/v1/analyze", json={**VALID, "propertyType": "spaceship"})
    assert res.status_code == 422
