const INDONESIAN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const INDONESIAN_MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = INDONESIAN_MONTHS_FULL[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getTrend(
  current: number,
  previous: number
): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  if (previous === 0) return { direction: 'stable', percentage: 0 };

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;

  if (Math.abs(rounded) < 1) return { direction: 'stable', percentage: 0 };
  return {
    direction: rounded > 0 ? 'up' : 'down',
    percentage: Math.abs(rounded),
  };
}

export function getMonthName(month: number, full = false): string {
  const arr = full ? INDONESIAN_MONTHS_FULL : INDONESIAN_MONTHS;
  return arr[(month - 1) % 12];
}
