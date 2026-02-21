export const RAMADAN_DATES = [
  { year: 2025, start: '2025-03-01', end: '2025-03-30' },
  { year: 2026, start: '2026-02-18', end: '2026-03-19' },
  { year: 2027, start: '2027-02-07', end: '2027-03-08' },
];

export const LEBARAN_DATES = [
  '2025-03-31',
  '2025-04-01',
  '2026-03-20',
  '2026-03-21',
  '2027-03-09',
  '2027-03-10',
];

export const IDUL_ADHA_DATES = ['2025-06-07', '2026-05-27', '2027-05-17'];
export const CHRISTMAS_DATES = ['2024-12-25', '2025-12-25', '2026-12-25'];
export const NEW_YEAR_DATES = ['2025-01-01', '2026-01-01', '2027-01-01'];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const isRamadan = (date: Date): boolean => {
  const ds = toDateString(date);
  return RAMADAN_DATES.some((r) => ds >= r.start && ds <= r.end);
};

export const isLebaran = (date: Date): boolean => {
  const ds = toDateString(date);
  return LEBARAN_DATES.includes(ds);
};

export const isHoliday = (date: Date): boolean => {
  const ds = toDateString(date);
  return (
    LEBARAN_DATES.includes(ds) ||
    IDUL_ADHA_DATES.includes(ds) ||
    CHRISTMAS_DATES.includes(ds) ||
    NEW_YEAR_DATES.includes(ds)
  );
};
