"""FinancialPeriod domain policy for LAKSHYA.

Implements the Indian Financial Year policy (1 April through 31 March)
and financial quarter boundary calculations (Q1-Q4).
"""

from __future__ import annotations

from calendar import isleap
from datetime import date, datetime, timezone
from typing import NamedTuple
from dataclasses import dataclass


@dataclass(frozen=True)
class FinancialQuarterInfo:
    """Dataclass holding resolved financial period metadata."""

    fy_label: str  # e.g., "FY 2026–27"
    fy_start_year: int  # e.g., 2026
    quarter: str  # e.g., "Q1", "Q2", "Q3", "Q4"
    quarter_label: str  # e.g., "FY 2026–27 Q1"
    start_date: datetime  # UTC start of quarter (00:00:00)
    end_date: datetime  # UTC end of quarter (23:59:59.999999)


class FinancialPeriodPolicy:
    """Backend policy for Indian Financial Year (1 April - 31 March) calculations."""

    VALID_QUARTERS = ("Q1", "Q2", "Q3", "Q4")

    @classmethod
    def get_fy_start_year(cls, dt: date | datetime) -> int:
        """Determines the start year of the financial year for a given date.
        
        If month >= 4 (April-December), FY start year is current year.
        If month < 4 (January-March), FY start year is previous year.
        """
        if dt.month >= 4:
            return dt.year
        return dt.year - 1

    @classmethod
    def get_fy_label(cls, val: date | datetime | int) -> str:
        """Returns financial year string representation e.g. 'FY 2026–27'."""
        if isinstance(val, int):
            start_year = val
        else:
            start_year = cls.get_fy_start_year(val)
        
        next_year_short = str((start_year + 1) % 100).zfill(2)
        return f"FY {start_year}–{next_year_short}"

    @classmethod
    def get_quarter(cls, dt: date | datetime) -> str:
        """Determines the quarter ('Q1', 'Q2', 'Q3', 'Q4') for a given date."""
        month = dt.month
        if 4 <= month <= 6:
            return "Q1"
        elif 7 <= month <= 9:
            return "Q2"
        elif 10 <= month <= 12:
            return "Q3"
        else:
            return "Q4"

    @classmethod
    def get_quarter_label(cls, dt: date | datetime) -> str:
        """Returns full quarter string e.g. 'FY 2026–27 Q2'."""
        fy_label = cls.get_fy_label(dt)
        quarter = cls.get_quarter(dt)
        return f"{fy_label} {quarter}"

    @classmethod
    def get_quarter_bounds(cls, fy_start_year: int, quarter: str) -> tuple[datetime, datetime]:
        """Returns UTC start and end datetimes for a specified FY start year and quarter.
        
        Q1: 1 April - 30 June
        Q2: 1 July - 30 September
        Q3: 1 October - 31 December
        Q4: 1 January - 31 March (following calendar year)
        """
        quarter_upper = quarter.upper().strip()
        if quarter_upper not in cls.VALID_QUARTERS:
            raise ValueError(f"Invalid quarter '{quarter}'. Must be one of {cls.VALID_QUARTERS}")

        if quarter_upper == "Q1":
            start = datetime(fy_start_year, 4, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(fy_start_year, 6, 30, 23, 59, 59, 999999, tzinfo=timezone.utc)
        elif quarter_upper == "Q2":
            start = datetime(fy_start_year, 7, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(fy_start_year, 9, 30, 23, 59, 59, 999999, tzinfo=timezone.utc)
        elif quarter_upper == "Q3":
            start = datetime(fy_start_year, 10, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(fy_start_year, 12, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)
        else:  # Q4
            next_year = fy_start_year + 1
            start = datetime(next_year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(next_year, 3, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)

        return start, end

    @classmethod
    def get_quarter_info(cls, dt: date | datetime) -> FinancialQuarterInfo:
        """Returns full FinancialQuarterInfo object for a given date."""
        fy_start_year = cls.get_fy_start_year(dt)
        quarter = cls.get_quarter(dt)
        fy_label = cls.get_fy_label(fy_start_year)
        quarter_label = f"{fy_label} {quarter}"
        start_date, end_date = cls.get_quarter_bounds(fy_start_year, quarter)

        return FinancialQuarterInfo(
            fy_label=fy_label,
            fy_start_year=fy_start_year,
            quarter=quarter,
            quarter_label=quarter_label,
            start_date=start_date,
            end_date=end_date,
        )

    @classmethod
    def is_leap_year(cls, year: int) -> bool:
        """Helper to check if a calendar year is a leap year."""
        return isleap(year)

    @classmethod
    def validate_priority_dates(
        cls,
        start_date: date | datetime,
        end_date: date | datetime,
        quarter: str,
        fy_start_year: int,
    ) -> tuple[bool, str | None]:
        """Validates that priority dates are logical and fall within the target financial quarter.
        
        Returns tuple (is_valid, error_detail).
        """
        if isinstance(start_date, datetime):
            start_dt = start_date
        else:
            start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0, tzinfo=timezone.utc)

        if isinstance(end_date, datetime):
            end_dt = end_date
        else:
            end_dt = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)

        if start_dt > end_dt:
            return False, "Priority start_date cannot be after end_date"

        q_start, q_end = cls.get_quarter_bounds(fy_start_year, quarter)

        if start_dt < q_start:
            return False, f"Start date ({start_dt.date()}) is before quarter start ({q_start.date()})"

        if end_dt > q_end:
            return False, f"End date ({end_dt.date()}) is after quarter end ({q_end.date()})"

        return True, None
