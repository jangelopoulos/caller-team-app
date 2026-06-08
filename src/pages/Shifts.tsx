import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import Header from '../components/Header';
import AvailabilityRow from '../components/AvailabilityRow';
import { fmtDate, fmtTime, fmtNumber, fmtPct } from '../lib/format';
import type { Shift } from '../lib/types';
import { IconCalendarEvent, IconClock, IconPhoneCall } from '@tabler/icons-react';

export default function Shifts() {
  const { employee, region } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setLoading(true);
    const now = Date.now();
    const q = supabase.from('shifts').select('*').eq('employee_id', employee.id).limit(50);
    const promise =
      tab === 'upcoming'
        ? q.gte('start_time', now).order('start_time', { ascending: true })
        : q.lt('start_time', now).order('start_time', { ascending: false });
    promise.then(({ data }) => {
      setShifts((data ?? []) as Shift[]);
      setLoading(false);
    });
  }, [employee, tab]);

  return (
    <div className="space-y-4 pb-6">
      <Header title="Shifts" subtitle="Your schedule and history" />

      <AvailabilityRow />

      <div className="glass rounded-2xl p-1 flex">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${
              tab === t ? 'bg-white/10 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Completed'}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-zinc-500 text-center py-10">Loading…</div>}
      {!loading && shifts.length === 0 && (
        <Glass className="p-8 text-center">
          <IconCalendarEvent size={32} className="mx-auto text-zinc-600 mb-2" />
          <div className="text-sm text-zinc-400">No {tab === 'upcoming' ? 'upcoming' : 'completed'} shifts.</div>
        </Glass>
      )}

      <div className="space-y-2.5">
        {shifts.map((s) => (
          <Glass key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{fmtDate(s.start_time, region)}</div>
                <div className="num text-lg mt-0.5">
                  {fmtTime(s.start_time, region)} <span className="text-zinc-600">→</span> {fmtTime(s.end_time, region)}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                  <span className="num flex items-center gap-1"><IconClock size={12} /> {fmtNumber(s.duration ?? 0, 1)}h</span>
                  {tab === 'past' && s.working_duration != null && (
                    <span className="num text-zinc-400">· worked {fmtNumber(s.working_duration, 2)}h</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {s.temporary && <Pill tone="warn">Temp</Pill>}
                {tab === 'past' && <Pill tone={s.status === 'completed' ? 'ok' : 'neutral'}>{s.status}</Pill>}
              </div>
            </div>
            {tab === 'past' && (s.outbounds || s.oph || s.connection_rate) != null && (
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">OPH</div>
                  <div className="num text-sm">{fmtNumber(s.oph, 1)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">Connect</div>
                  <div className="num text-sm">{fmtPct(s.connection_rate)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500"><IconPhoneCall size={10} className="inline mr-0.5" />Calls</div>
                  <div className="num text-sm">{s.outbounds ?? 0}</div>
                </div>
              </div>
            )}
          </Glass>
        ))}
      </div>
    </div>
  );
}
