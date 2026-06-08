export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Day = typeof DAYS[number];

export const DAY_SHORT: Record<Day, string> = {
  Monday: 'Mo', Tuesday: 'Tu', Wednesday: 'We', Thursday: 'Th', Friday: 'Fr', Saturday: 'Sa',
};

export type SlotType = 'Morning' | 'Afternoon' | 'Full Day';
export const SLOT_TYPES: SlotType[] = ['Morning', 'Afternoon', 'Full Day'];

const SHORT_MORNING_DAYS: Day[] = ['Monday', 'Friday', 'Saturday'];

export function allowedTypesFor(day: Day): SlotType[] {
  return SHORT_MORNING_DAYS.includes(day) ? ['Morning'] : ['Morning', 'Afternoon', 'Full Day'];
}

export interface SlotTimes { start_time: string; end_time: string; break: boolean; total_hours: number }

export function timesFor(day: Day, type: SlotType): SlotTimes {
  const isShort = SHORT_MORNING_DAYS.includes(day);
  if (type === 'Morning') {
    return { start_time: isShort ? '10.00' : '9.00', end_time: isShort ? '14.00' : '13.00', break: false, total_hours: 4 };
  }
  if (type === 'Afternoon') {
    return { start_time: '13.50', end_time: '17.50', break: false, total_hours: 4 };
  }
  // Full Day
  return { start_time: '9.00', end_time: '17.50', break: true, total_hours: 7.5 };
}

export function formatTimeNumber(t: string | number | null | undefined): string {
  if (t == null || t === '') return '—';
  const n = Number(t);
  if (!Number.isFinite(n)) return String(t);
  const hours = Math.floor(n);
  const mins = Math.round((n - hours) * 100);
  const h12 = ((hours + 11) % 12) + 1;
  const ampm = hours < 12 ? 'am' : 'pm';
  return mins ? `${h12}:${String(mins).padStart(2, '0')}${ampm}` : `${h12}${ampm}`;
}

export interface AvailabilityRow {
  id: string;
  employee_id: string | null;
  day: string;
  type: string;
  start_time: string;
  end_time: string;
  break: boolean;
  total_hours: number;
}
