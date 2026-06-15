from app.analyzer import AnalyzerService
from app.config import Settings
from app.schemas import GrowthReport, PropertyProfileInput


def _settings(**overrides: object) -> Settings:
    base = dict(
        anthropic_api_key=None,
        model="claude-opus-4-8",
        effort="high",
        service_token=None,
        allowed_origins=("http://localhost:4000",),
        max_output_tokens=4000,
    )
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


def test_uses_heuristic_when_claude_disabled(villa_profile: PropertyProfileInput) -> None:
    service = AnalyzerService(_settings())
    report = service.analyze(villa_profile)
    assert report.engine == "heuristic"


def test_falls_back_to_heuristic_when_claude_raises(villa_profile: PropertyProfileInput) -> None:
    service = AnalyzerService(_settings())

    class _Boom:
        def analyze(self, _profile: PropertyProfileInput) -> GrowthReport:
            raise RuntimeError("model exploded")

    service._claude = _Boom()  # type: ignore[assignment]
    report = service.analyze(villa_profile)
    assert report.engine == "heuristic"  # never propagates the failure
