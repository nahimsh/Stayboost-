import pytest

from app.schemas import PropertyProfileInput


@pytest.fixture
def villa_profile() -> PropertyProfileInput:
    return PropertyProfileInput(
        propertyName="Sea Breeze Villa",
        propertyType="villa",
        country="Portugal",
        city="Lagos",
        unitsCount=2,
        currency="EUR",
        avgNightlyRateMinor=18_000,
        occupancyPctLast30=52.0,
        channels=["airbnb", "booking_com"],
        reviewScore=4.2,
        reviewResponseRatePct=40.0,
        avgResponseTimeHours=8.0,
        biggestChallenge="more_bookings",
    )
