import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import { fmtTime, fmtNumber } from '../lib/format';
import type { Shift } from '../lib/types';
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export default function Calendar() {
  const { employee, region } = useAuth();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selected, setSelected] = useState<string | null>(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!employee) return;
    const start = new Date(cursor); start.setDate(1);
    const end = new Date(cursor); end.setMonth(end.getMonth() + 1); end.setDate(0); end.setHours(23, 59, 59, 999);
    supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('start_time', start.getTime())
      .lte('start_time', end.getTime())
      .order('start_time', { ascending: true })
      .then(({ data }) => setShifts((data ?? []) as Shift[]));
  }, [employee, cursor]);

  const days = useMemo(() => {
    const first = new Date(cursor); first.setDate(1);
    const startWeekday = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `e${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date: dt, key: dt.toISOString() });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `t${cells.length}` });
    return cells;
  }, [cursor]);

  const shiftsByDay = useMemo(() => {
    const m = new Map<string, Shift[]>();
    shifts.forEach((s) => {
      if (!s.start_time) return;
      const key = new Date(s.start_time).toISOString().slice(0, 10);
      const arr = m.get(key) ?? []; arr.push(s); m.set(key, arr);
    });
    return m;
  }, [shifts]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const selectedShifts = selected ? shiftsByDay.get(selected) ?? [] : [];

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <h1 className="text-xl font-semibold">Calendar</h1>
      </header>

      <Glass className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
            <IconChevronLeft size={18} />
          </button>
          <div className="font-medium">{cursor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
            <IconChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] uppercase tracking-wider text-zinc-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell) => {
            if (!cell.date) return <div key={cell.key} />;
            const key = cell.date.toISOString().slice(0, 10);
            const ds = shiftsByDay.get(key);
            const isSelected = selected === key;
            const isToday = todayKey === key;
            return (
              <button
                key={cell.key}
                onClick={() => setSelected(key)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition ${
                  isSelected ? 'bg-indigo-500/20 ring-1 ring-indigo-400/50' : 'hover:bg-white/5'
                } ${isToday && !isSelected ? 'ring-1 ring-white/15' : ''}`}
              >
                <span className={`num ${isToday ? 'text-indigo-300 font-semibold' : 'text-zinc-200'}`}>{cell.date.getDate()}</span>
                {ds && ds.length > 0 && (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {ds.slice(0, 3).map((_, i) => (
                      <span key={i} className="size-1 rounded-full bg-indigo-400" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Glass>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium px-1 mb-2">
          {selected ? new Date(selected).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
        </div>
        {selectedShifts.length === 0 ? (
          <Glass className="p-6 text-center text-sm text-zinc-500">No shifts on this day.</Glass>
        ) : (
          <div className="space-y-2">
            {selectedShifts.map((s) => (
              <Glass key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="num text-base font-medium">{fmtTime(s.start_time, region)} → {fmtTime(s.end_time, region)}</div>
                  <div className="num text-xs text-zinc-500 mt-0.5">{fmtNumber(s.duration ?? 0, 1)}h</div>
                </div>
                {s.temporary && <Pill tone="warn">Temp</Pill>}
              </Glass>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
