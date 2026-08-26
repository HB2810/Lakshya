"""Unit tests for LAKSHYA FinancialPeriod domain policy."""

from datetime import date, datetime, timezone
import pytest

from app.modules.strategy.financial_period import FinancialPeriodPolicy, FinancialQuarterInfo


def test_get_fy_start_year_and_labels():
    # April 1, 2026 starts FY 2026–27
    dt1 = date(2026, 4, 1)
    assert FinancialPeriodPolicy.get_fy_start_year(dt1) == 2026
    assert FinancialPeriodPolicy.get_fy_label(dt1) == "FY 2026–27"

    # August 26, 2026 is in FY 2026–27
    dt2 = date(2026, 8, 26)
    assert FinancialPeriodPolicy.get_fy_start_year(dt2) == 2026
    assert FinancialPeriodPolicy.get_fy_label(dt2) == "FY 2026–27"

    # December 31, 2026 is in FY 2026–27
    dt3 = date(2026, 12, 31)
    assert FinancialPeriodPolicy.get_fy_start_year(dt3) == 2026

    # January 1, 2027 is still in FY 2026–27 (Q4)
    dt4 = date(2027, 1, 1)
    assert FinancialPeriodPolicy.get_fy_start_year(dt4) == 2026
    assert FinancialPeriodPolicy.get_fy_label(dt4) == "FY 2026–27"

    # March 31, 2027 is the last day of FY 2026–27
    dt5 = date(2027, 3, 31)
    assert FinancialPeriodPolicy.get_fy_start_year(dt5) == 2026
    assert FinancialPeriodPolicy.get_fy_label(dt5) == "FY 2026–27"

    # April 1, 2027 starts FY 2027–28
    dt6 = date(2027, 4, 1)
    assert FinancialPeriodPolicy.get_fy_start_year(dt6) == 2027
    assert FinancialPeriodPolicy.get_fy_label(dt6) == "FY 2027–28"


def test_get_quarters():
    # Q1: Apr, May, Jun
    assert FinancialPeriodPolicy.get_quarter(date(2026, 4, 1)) == "Q1"
    assert FinancialPeriodPolicy.get_quarter(date(2026, 6, 30)) == "Q1"

    # Q2: Jul, Aug, Sep
    assert FinancialPeriodPolicy.get_quarter(date(2026, 7, 1)) == "Q2"
    assert FinancialPeriodPolicy.get_quarter(date(2026, 9, 30)) == "Q2"

    # Q3: Oct, Nov, Dec
    assert FinancialPeriodPolicy.get_quarter(date(2026, 10, 1)) == "Q3"
    assert FinancialPeriodPolicy.get_quarter(date(2026, 12, 31)) == "Q3"

    # Q4: Jan, Feb, Mar
    assert FinancialPeriodPolicy.get_quarter(date(2027, 1, 1)) == "Q4"
    assert FinancialPeriodPolicy.get_quarter(date(2027, 2, 28)) == "Q4"
    assert FinancialPeriodPolicy.get_quarter(date(2027, 3, 31)) == "Q4"


def test_quarter_labels():
    dt_aug = date(2026, 8, 26)
    assert FinancialPeriodPolicy.get_quarter_label(dt_aug) == "FY 2026–27 Q2"

    dt_feb = date(2027, 2, 15)
    assert FinancialPeriodPolicy.get_quarter_label(dt_feb) == "FY 2026–27 Q4"


def test_get_quarter_bounds():
    start_q1, end_q1 = FinancialPeriodPolicy.get_quarter_bounds(2026, "Q1")
    assert start_q1 == datetime(2026, 4, 1, 0, 0, 0, tzinfo=timezone.utc)
    assert end_q1 == datetime(2026, 6, 30, 23, 59, 59, 999999, tzinfo=timezone.utc)

    start_q4, end_q4 = FinancialPeriodPolicy.get_quarter_bounds(2026, "Q4")
    assert start_q4 == datetime(2027, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    assert end_q4 == datetime(2027, 3, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)


def test_get_quarter_info_dataclass():
    dt = date(2026, 8, 26)
    info = FinancialPeriodPolicy.get_quarter_info(dt)
    assert isinstance(info, FinancialQuarterInfo)
    assert info.fy_label == "FY 2026–27"
    assert info.fy_start_year == 2026
    assert info.quarter == "Q2"
    assert info.quarter_label == "FY 2026–27 Q2"
    assert info.start_date == datetime(2026, 7, 1, 0, 0, 0, tzinfo=timezone.utc)
    assert info.end_date == datetime(2026, 9, 30, 23, 59, 59, 999999, tzinfo=timezone.utc)


def test_leap_year_handling():
    assert FinancialPeriodPolicy.is_leap_year(2024) is True
    assert FinancialPeriodPolicy.is_leap_year(2026) is False
    assert FinancialPeriodPolicy.is_leap_year(2028) is True

    # Leap day Feb 29, 2028 is Q4 of FY 2027–28
    leap_day = date(2028, 2, 29)
    assert FinancialPeriodPolicy.get_fy_start_year(leap_day) == 2027
    assert FinancialPeriodPolicy.get_quarter(leap_day) == "Q4"
    assert FinancialPeriodPolicy.get_quarter_label(leap_day) == "FY 2027–28 Q4"


def test_validate_priority_dates():
    # Valid priority dates inside Q2
    start = date(2026, 7, 15)
    end = date(2026, 8, 30)
    is_valid, err = FinancialPeriodPolicy.validate_priority_dates(start, end, "Q2", 2026)
    assert is_valid is True
    assert err is None

    # Invalid: start > end
    is_valid, err = FinancialPeriodPolicy.validate_priority_dates(end, start, "Q2", 2026)
    assert is_valid is False
    assert "start_date cannot be after end_date" in err

    # Invalid: start date before Q2
    early_start = date(2026, 6, 30)
    is_valid, err = FinancialPeriodPolicy.validate_priority_dates(early_start, end, "Q2", 2026)
    assert is_valid is False
    assert "is before quarter start" in err

    # Invalid: end date after Q2
    late_end = date(2026, 10, 1)
    is_valid, err = FinancialPeriodPolicy.validate_priority_dates(start, late_end, "Q2", 2026)
    assert is_valid is False
    assert "is after quarter end" in err


def test_invalid_quarter_raises_value_error():
    with pytest.raises(ValueError, match="Invalid quarter 'Q5'"):
        FinancialPeriodPolicy.get_quarter_bounds(2026, "Q5")
