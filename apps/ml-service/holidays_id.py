import pandas as pd
from datetime import date, timedelta


def get_indonesian_holidays() -> pd.DataFrame:
    """Returns Indonesian public holidays for 2024-2027 as Prophet-compatible DataFrame"""

    holidays = []

    # Fixed national holidays
    fixed_holidays = [
        # New Year
        ("Tahun Baru", ["2024-01-01", "2025-01-01", "2026-01-01", "2027-01-01"]),
        # Labor Day
        ("Hari Buruh", ["2024-05-01", "2025-05-01", "2026-05-01", "2027-05-01"]),
        # Pancasila Day
        ("Hari Pancasila", ["2024-06-01", "2025-06-01", "2026-06-01", "2027-06-01"]),
        # Independence Day
        ("Kemerdekaan RI", ["2024-08-17", "2025-08-17", "2026-08-17", "2027-08-17"]),
        # Christmas
        ("Natal", ["2024-12-25", "2025-12-25", "2026-12-25"]),
    ]

    # Ramadan (partial data — high fruit demand period)
    ramadan_ranges = [
        ("Ramadan 2025", "2025-03-01", "2025-03-30"),
        ("Ramadan 2026", "2026-02-18", "2026-03-19"),
        ("Ramadan 2027", "2027-02-07", "2027-03-08"),
    ]

    # Lebaran (Eid) — massive price spike
    lebaran = [
        ("Lebaran", ["2025-03-31", "2025-04-01", "2026-03-20", "2026-03-21"]),
    ]

    # Idul Adha
    idul_adha = [
        ("Idul Adha", ["2025-06-07", "2026-05-27", "2027-05-17"]),
    ]

    # Build holidays list
    for name, dates in fixed_holidays + lebaran + idul_adha:
        for d in dates:
            holidays.append({"ds": pd.Timestamp(d), "holiday": name})

    # Add Ramadan as individual days
    for name, start, end in ramadan_ranges:
        current = pd.Timestamp(start)
        end_ts = pd.Timestamp(end)
        while current <= end_ts:
            holidays.append({"ds": current, "holiday": name})
            current += timedelta(days=1)

    if not holidays:
        return pd.DataFrame(columns=["ds", "holiday"])

    return pd.DataFrame(holidays).drop_duplicates(subset=["ds", "holiday"])
