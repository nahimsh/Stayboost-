"""Analyzer service: routes to the best available engine and applies guardrails.

Uses Claude when configured; falls back to the deterministic heuristic engine on
missing key or any Claude/parse failure, so the endpoint always returns a valid,
schema-checked report.
"""

from __future__ import annotations

import logging

from app.config import Settings
from app.engines.claude import ClaudeEngine
from app.engines.heuristic import HeuristicEngine
from app.schemas import GrowthReport, PropertyProfileInput

logger = logging.getLogger("stayboost.ai.analyzer")


def _guard(report: GrowthReport) -> GrowthReport:
    """Enforce business invariants the model/engine output must satisfy."""
    uplift = report.estimatedMonthlyUplift
    if uplift.highMinor < uplift.lowMinor:
        uplift.lowMinor, uplift.highMinor = uplift.highMinor, uplift.lowMinor
    pillars = {p.pillar for p in report.pillars}
    if pillars != {"acquire", "monetize", "automate", "delight"}:
        raise ValueError("Report must contain exactly the four StayBoost pillars")
    return report


class AnalyzerService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._heuristic = HeuristicEngine()
        self._claude: ClaudeEngine | None = None
        if settings.claude_enabled:
            # Imported lazily so the package works without the SDK installed offline.
            from anthropic import Anthropic

            self._claude = ClaudeEngine(
                client=Anthropic(api_key=settings.anthropic_api_key),
                model=settings.model,
                effort=settings.effort,
                max_output_tokens=settings.max_output_tokens,
            )

    def analyze(self, profile: PropertyProfileInput) -> GrowthReport:
        if self._claude is not None:
            try:
                return _guard(self._claude.analyze(profile))
            except Exception:  # noqa: BLE001 - fall back, never fail the request
                logger.exception("Claude engine failed; falling back to heuristic")
        return _guard(self._heuristic.analyze(profile))
