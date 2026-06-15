"""Engine interface. Both the heuristic baseline and the Claude engine implement
this, so the analyzer service can swap them without callers caring."""

from __future__ import annotations

from typing import Protocol

from app.schemas import GrowthReport, PropertyProfileInput


class AnalyzerEngine(Protocol):
    name: str

    def analyze(self, profile: PropertyProfileInput) -> GrowthReport: ...
