"""Pydantic models mirroring packages/domain analyzer contracts.

Kept byte-for-byte aligned (field names, enums, bounds) with the TypeScript Zod
schemas so the API and AI service agree on the wire format.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

PropertyType = Literal["homestay", "villa", "resort", "hotel"]
Channel = Literal["direct", "airbnb", "booking_com", "expedia", "vrbo", "other"]
Challenge = Literal["more_bookings", "pricing", "save_time", "reviews", "guest_experience"]
Pillar = Literal["acquire", "monetize", "automate", "delight"]
Severity = Literal["high", "medium", "low"]

PILLARS: tuple[Pillar, ...] = ("acquire", "monetize", "automate", "delight")


class PropertyProfileInput(BaseModel):
    model_config = {"extra": "forbid"}

    propertyName: str = Field(min_length=2, max_length=160)
    propertyType: PropertyType
    country: str = Field(min_length=2, max_length=80)
    city: str = Field(min_length=1, max_length=120)
    unitsCount: int = Field(ge=1, le=10_000)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    avgNightlyRateMinor: int | None = Field(default=None, ge=0, le=100_000_00)
    occupancyPctLast30: float | None = Field(default=None, ge=0, le=100)
    channels: list[Channel] = Field(min_length=1)
    reviewScore: float | None = Field(default=None, ge=0, le=5)
    reviewResponseRatePct: float | None = Field(default=None, ge=0, le=100)
    avgResponseTimeHours: float | None = Field(default=None, ge=0, le=720)
    biggestChallenge: Challenge

    @field_validator("channels")
    @classmethod
    def _unique_channels(cls, v: list[Channel]) -> list[Channel]:
        return list(dict.fromkeys(v))


class Finding(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    severity: Severity
    rationale: str = Field(min_length=3, max_length=800)
    recommendedAction: str = Field(min_length=3, max_length=400)
    estimatedImpact: str = Field(min_length=1, max_length=120)


class PillarInsight(BaseModel):
    pillar: Pillar
    score: int = Field(ge=0, le=100)
    headline: str = Field(min_length=3, max_length=200)
    findings: list[Finding] = Field(max_length=6)


class QuickWin(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    action: str = Field(min_length=3, max_length=400)
    pillar: Pillar


class UpliftRange(BaseModel):
    lowMinor: int = Field(ge=0)
    highMinor: int = Field(ge=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")


class GrowthReport(BaseModel):
    summary: str = Field(min_length=10, max_length=2000)
    overallScore: int = Field(ge=0, le=100)
    estimatedMonthlyUplift: UpliftRange
    pillars: list[PillarInsight] = Field(min_length=4, max_length=4)
    quickWins: list[QuickWin] = Field(min_length=1, max_length=5)
    confidence: float = Field(ge=0, le=1)
    model: str
    engine: Literal["claude", "heuristic"]
    generatedAt: str

    @staticmethod
    def now_iso() -> str:
        return datetime.now(UTC).isoformat()
