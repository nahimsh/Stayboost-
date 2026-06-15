from app.engines.heuristic import HeuristicEngine
from app.schemas import PropertyProfileInput


def test_returns_four_pillars_with_valid_scores(villa_profile: PropertyProfileInput) -> None:
    report = HeuristicEngine().analyze(villa_profile)
    assert {p.pillar for p in report.pillars} == {"acquire", "monetize", "automate", "delight"}
    assert all(0 <= p.score <= 100 for p in report.pillars)
    assert 0 <= report.overallScore <= 100
    assert report.engine == "heuristic"


def test_uplift_range_is_ordered_and_in_currency(villa_profile: PropertyProfileInput) -> None:
    report = HeuristicEngine().analyze(villa_profile)
    uplift = report.estimatedMonthlyUplift
    assert uplift.lowMinor <= uplift.highMinor
    assert uplift.currency == "EUR"


def test_is_deterministic(villa_profile: PropertyProfileInput) -> None:
    a = HeuristicEngine().analyze(villa_profile)
    b = HeuristicEngine().analyze(villa_profile)
    assert a.overallScore == b.overallScore
    assert [p.score for p in a.pillars] == [p.score for p in b.pillars]


def test_no_direct_channel_is_flagged_high(villa_profile: PropertyProfileInput) -> None:
    report = HeuristicEngine().analyze(villa_profile)
    acquire = next(p for p in report.pillars if p.pillar == "acquire")
    titles = [f.title for f in acquire.findings]
    assert any("direct" in t.lower() for t in titles)


def test_quick_win_reflects_stated_challenge(villa_profile: PropertyProfileInput) -> None:
    report = HeuristicEngine().analyze(villa_profile)
    assert report.quickWins[0].pillar == "acquire"  # more_bookings → acquire
