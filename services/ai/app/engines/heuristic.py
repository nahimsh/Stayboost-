"""Deterministic, offline growth analysis.

This is a genuine baseline analyzer — it derives scores, findings, and a revenue
uplift range from hospitality heuristics applied to the property's own numbers.
It powers local/dev/CI (no API key) and acts as a fast, free fallback in
production. The Claude engine produces richer narrative; this guarantees the
Analyzer always returns something useful and explainable.
"""

from __future__ import annotations

from app.schemas import (
    Finding,
    GrowthReport,
    PillarInsight,
    PropertyProfileInput,
    QuickWin,
    UpliftRange,
)

ENGINE_NAME = "heuristic"
MODEL_VERSION = "heuristic-v1"

# Industry rough benchmarks used as comparison points (intentionally conservative).
_TARGET_OCCUPANCY = 75.0
_TARGET_REVIEW_SCORE = 4.6
_TARGET_RESPONSE_HOURS = 1.0
_TARGET_RESPONSE_RATE = 90.0
_DIRECT_BOOKING_TARGET_SHARE = 0.3


def _clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def _acquire(profile: PropertyProfileInput) -> PillarInsight:
    findings: list[Finding] = []
    score = 70.0

    occupancy = profile.occupancyPctLast30
    if occupancy is not None and occupancy < _TARGET_OCCUPANCY:
        gap = _TARGET_OCCUPANCY - occupancy
        score -= min(35.0, gap)
        findings.append(
            Finding(
                title="Occupancy below market potential",
                severity="high" if gap > 20 else "medium",
                rationale=(
                    f"Last 30 days ran at {occupancy:.0f}% vs a ~{_TARGET_OCCUPANCY:.0f}% "
                    "achievable target for well-priced properties in your segment."
                ),
                recommendedAction="Enable AI dynamic pricing to fill low-demand dates at the right rate.",
                estimatedImpact=f"+{gap:.0f} occupancy points",
            )
        )

    has_direct = "direct" in profile.channels
    if not has_direct:
        score -= 12.0
        findings.append(
            Finding(
                title="No direct booking channel",
                severity="high",
                rationale="Every booking flows through OTAs, paying 15-20% commission you could keep.",
                recommendedAction="Launch a conversion-optimized direct booking funnel.",
                estimatedImpact="Recover 15-20% commission on direct stays",
            )
        )

    if profile.reviewScore is not None and profile.reviewScore < _TARGET_REVIEW_SCORE:
        score -= 8.0
        findings.append(
            Finding(
                title="Review score limits ranking",
                severity="medium",
                rationale="OTA and search ranking rewards higher review scores with more visibility.",
                recommendedAction="Automate review solicitation from happy guests at the optimal moment.",
                estimatedImpact="Higher OTA ranking → more impressions",
            )
        )

    if not findings:
        findings.append(
            Finding(
                title="Demand capture is healthy",
                severity="low",
                rationale="Occupancy and channel mix look solid; focus on protecting rate.",
                recommendedAction="Layer demand forecasting to defend ADR on peak dates.",
                estimatedImpact="Protect peak-season ADR",
            )
        )

    return PillarInsight(
        pillar="acquire",
        score=_clamp_score(score),
        headline="Fill more nights at the right rate",
        findings=findings,
    )


def _monetize(profile: PropertyProfileInput) -> PillarInsight:
    findings: list[Finding] = []
    score = 60.0

    findings.append(
        Finding(
            title="Untapped upsell revenue",
            severity="medium",
            rationale="Pre-arrival upsells (early check-in, upgrades, experiences) typically lift revenue per stay 8-15%.",
            recommendedAction="Turn on automated pre-arrival upsell offers.",
            estimatedImpact="+8-15% revenue per stay",
        )
    )
    if profile.avgNightlyRateMinor:
        score += 10.0
        findings.append(
            Finding(
                title="Length-of-stay and gap nights",
                severity="low",
                rationale="Orphan and gap nights between bookings often sell below potential.",
                recommendedAction="Apply gap-night pricing and minimum-stay rules automatically.",
                estimatedImpact="Recover revenue on hard-to-sell nights",
            )
        )

    return PillarInsight(
        pillar="monetize",
        score=_clamp_score(score),
        headline="Grow revenue from every guest",
        findings=findings,
    )


def _automate(profile: PropertyProfileInput) -> PillarInsight:
    findings: list[Finding] = []
    score = 65.0

    rt = profile.avgResponseTimeHours
    if rt is not None and rt > _TARGET_RESPONSE_HOURS:
        score -= min(30.0, rt * 3.0)
        findings.append(
            Finding(
                title="Guest response time is slow",
                severity="high" if rt > 6 else "medium",
                rationale=f"Averaging {rt:.0f}h to reply; fast responses lift conversion and reviews.",
                recommendedAction="Use the smart inbox with AI reply drafting for instant, on-brand answers.",
                estimatedImpact="Reply in minutes, not hours",
            )
        )

    rr = profile.reviewResponseRatePct
    if rr is not None and rr < _TARGET_RESPONSE_RATE:
        score -= 10.0
        findings.append(
            Finding(
                title="Reviews go unanswered",
                severity="medium",
                rationale=f"Only {rr:.0f}% of reviews get a response; responding builds trust and ranking.",
                recommendedAction="Auto-draft on-brand responses to every review.",
                estimatedImpact="100% review response coverage",
            )
        )

    if not findings:
        findings.append(
            Finding(
                title="Automate the daily grind",
                severity="low",
                rationale="Messaging and task busywork still consume operator hours.",
                recommendedAction="Automate booking-lifecycle messaging and housekeeping tasks.",
                estimatedImpact="Save hours every week",
            )
        )

    return PillarInsight(
        pillar="automate",
        score=_clamp_score(score),
        headline="Reclaim hours every week",
        findings=findings,
    )


def _delight(profile: PropertyProfileInput) -> PillarInsight:
    findings: list[Finding] = []
    score = 72.0

    if profile.reviewScore is not None and profile.reviewScore < _TARGET_REVIEW_SCORE:
        score -= (_TARGET_REVIEW_SCORE - profile.reviewScore) * 20.0
        findings.append(
            Finding(
                title="Guest experience has headroom",
                severity="medium",
                rationale=f"Review score of {profile.reviewScore:.1f} trails the ~{_TARGET_REVIEW_SCORE:.1f} that drives bookings.",
                recommendedAction="Add a 24/7 multilingual AI concierge and proactive sentiment monitoring.",
                estimatedImpact="Lift review score over time",
            )
        )
    else:
        findings.append(
            Finding(
                title="Delight guests around the clock",
                severity="low",
                rationale="A 24/7 concierge answers guest questions instantly in any language.",
                recommendedAction="Enable the AI concierge for pre-, in-, and post-stay support.",
                estimatedImpact="Faster answers, happier guests",
            )
        )

    return PillarInsight(
        pillar="delight",
        score=_clamp_score(score),
        headline="Earn more 5-star reviews",
        findings=findings,
    )


_CHALLENGE_QUICK_WIN: dict[str, QuickWin] = {
    "more_bookings": QuickWin(
        title="Turn on dynamic pricing",
        action="Let AI recommend nightly rates to fill more dates at the best price.",
        pillar="acquire",
    ),
    "pricing": QuickWin(
        title="Review AI pricing recommendations",
        action="Approve AI rate suggestions for the next 30 days in one click.",
        pillar="acquire",
    ),
    "save_time": QuickWin(
        title="Enable the smart inbox",
        action="Let AI draft guest replies so you respond in seconds.",
        pillar="automate",
    ),
    "reviews": QuickWin(
        title="Automate review responses",
        action="AI drafts an on-brand reply to every review for your approval.",
        pillar="delight",
    ),
    "guest_experience": QuickWin(
        title="Launch the AI concierge",
        action="Give guests instant 24/7 multilingual answers.",
        pillar="delight",
    ),
}


def _uplift(profile: PropertyProfileInput, overall: int) -> UpliftRange:
    """Conservative monthly revenue uplift range in minor units."""
    rate = profile.avgNightlyRateMinor or 12_000  # assume ~120/night if unknown
    occupancy = (profile.occupancyPctLast30 or 55.0) / 100.0
    monthly_revenue = rate * 30 * occupancy * profile.unitsCount
    # The more headroom (lower overall score), the larger the opportunity.
    headroom = (100 - overall) / 100.0
    low = int(monthly_revenue * headroom * 0.06)
    high = int(monthly_revenue * headroom * 0.18)
    return UpliftRange(lowMinor=low, highMinor=max(high, low), currency=profile.currency)


class HeuristicEngine:
    name = ENGINE_NAME

    def analyze(self, profile: PropertyProfileInput) -> GrowthReport:
        pillars = [
            _acquire(profile),
            _monetize(profile),
            _automate(profile),
            _delight(profile),
        ]
        overall = round(sum(p.score for p in pillars) / len(pillars))

        quick_wins = [_CHALLENGE_QUICK_WIN[profile.biggestChallenge]]
        for p in sorted(pillars, key=lambda x: x.score):
            win = _CHALLENGE_QUICK_WIN_BY_PILLAR.get(p.pillar)
            if win and win.title not in {q.title for q in quick_wins}:
                quick_wins.append(win)
            if len(quick_wins) >= 3:
                break

        uplift = _uplift(profile, overall)
        summary = (
            f"{profile.propertyName} scores {overall}/100 on growth readiness. "
            f"Your biggest opportunities are in "
            f"{', '.join(p.pillar for p in sorted(pillars, key=lambda x: x.score)[:2])}. "
            "StayBoost estimates a meaningful monthly revenue uplift by acting on the findings below."
        )

        return GrowthReport(
            summary=summary,
            overallScore=overall,
            estimatedMonthlyUplift=uplift,
            pillars=pillars,
            quickWins=quick_wins[:5],
            confidence=0.55,
            model=MODEL_VERSION,
            engine=ENGINE_NAME,
            generatedAt=GrowthReport.now_iso(),
        )


_CHALLENGE_QUICK_WIN_BY_PILLAR: dict[str, QuickWin] = {
    "acquire": _CHALLENGE_QUICK_WIN["more_bookings"],
    "automate": _CHALLENGE_QUICK_WIN["save_time"],
    "delight": _CHALLENGE_QUICK_WIN["guest_experience"],
    "monetize": QuickWin(
        title="Add pre-arrival upsells",
        action="Offer upgrades and early check-in automatically before arrival.",
        pillar="monetize",
    ),
}
