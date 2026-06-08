import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Stat, Pill } from '../components/Glass';
import Header from '../components/Header';
import AvailabilityRow from '../components/AvailabilityRow';
import { fmtDate, fmtTime, fmtNumber, fmtPct, BENCHMARKS } from '../lib/format';
import type { Shift } from '../lib/types';
import { IconCalendarTime, IconArrowRight, IconChartLine, IconPhoneCall, IconActivityHeartbeat } from '@tabler/icons-react';

export default function Home() {
  const { employee, region } = useAuth();
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [today, setToday] = useState<{ calls: number; oph: number | null; cr: number | null }>({ calls: 0, oph: null, cr: null });
  const [week, setWeek] = useState<{ calls: number; oph: number | null }>({ calls: 0, oph: null });

  useEffect(() => {
    if (!employee) return;
    const now = Date.now();
    const weekAgo = now - 7 * 86400_000;

    (async () => {
      const { data: upcoming } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1);
      setNextShift((upcoming?.[0] as Shift) ?? null);

      const { data: todayShift } = await supabase
        .from('shifts')
        .select('connects,outbounds,oph,connection_rate,working_duration,start_time')
        .eq('employee_id', employee.id)
        .gte('start_time', now - 86400_000)
        .lte('start_time', now)
        .order('start_time', { ascending: false })
        .limit(1);
      const t = todayShift?.[0];
      setToday({
        calls: Number(t?.outbounds ?? 0),
        oph: t?.oph != null ? Number(t.oph) : null,
        cr: t?.connection_rate != null ? Number(t.connection_rate) : null,
      });

      const { data: weekShifts } = await supabase
        .from('shifts')
        .select('outbounds, working_duration, connects, oph')
        .eq('employee_id', employee.id)
        .gte('start_time', weekAgo)
        .lte('start_time', now);
      const tot = (weekShifts ?? []).reduce(
        (a, s: any) => {
          a.calls += Number(s.outbounds ?? 0);
          a.connects += Number(s.connects ?? 0);
          a.hours += Number(s.working_duration ?? 0);
          return a;
        },
        { calls: 0, connects: 0, hours: 0 },
      );
      setWeek({ calls: tot.calls, oph: tot.hours > 0 ? tot.connects / tot.hours : null });
    })();
  }, [employee]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const bench = BENCHMARKS.Manual;
  const ophAccent = today.oph == null ? undefined : today.oph >= bench ? 'ok' : today.oph >= bench * 0.85 ? 'warn' : 'bad';

  return (
    <div className="space-y-5 pb-6">
      <Header title={employee?.first_name ?? '—'} subtitle={`${greet()},`} />

      <AvailabilityRow />

      <Glass className="p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 size-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="flex items-center justify-between mb-3 relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <IconCalendarTime size={14} /> Next Shift
          </div>
          <Pill tone="accent">{region}</Pill>
        </div>
        {nextShift ? (
          <div className="relative">
            <div className="text-lg font-medium">{fmtDate(nextShift.start_time, region)}</div>
            <div className="num text-3xl font-semibold mt-1">
              {fmtTime(nextShift.start_time, region)} <span className="text-zinc-500">→</span> {fmtTime(nextShift.end_time, region)}
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-zinc-400">
              <span className="num">{fmtNumber(nextShift.duration ?? nextShift.rostered_hours ?? 0, 1)}h rostered</span>
              {nextShift.temporary && <Pill tone="warn">Temporary</Pill>}
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">No upcoming shifts scheduled.</div>
        )}
      </Glass>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          tint="indigo"
          label="OPH today"
          value={today.oph != null ? fmtNumber(today.oph, 1) : '—'}
          sub={`Bench ${bench}`}
          accent={ophAccent as any}
        />
        <Stat tint="emerald" label="Connect rate" value={today.cr != null ? fmtPct(today.cr) : '—'} sub="Today" />
        <Stat tint="amber" label="Calls today" value={<><IconPhoneCall size={14} className="inline mr-1 -mt-0.5 text-amber-300/70" />{today.calls}</>} />
        <Stat tint="cyan" label="Calls (7d)" value={week.calls} sub={week.oph != null ? `Avg OPH ${fmtNumber(week.oph, 1)}` : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/performance" className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center"><IconChartLine size={18} /></div>
            <div>
              <div className="text-sm font-medium">Performance</div>
              <div className="text-xs text-zinc-500">Trends & benchmarks</div>
            </div>
          </div>
          <IconArrowRight size={16} className="text-zinc-500" />
        </Link>
        <Link to="/shifts" className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center"><IconActivityHeartbeat size={18} /></div>
            <div>
              <div className="text-sm font-medium">My Shifts</div>
              <div className="text-xs text-zinc-500">Upcoming & history</div>
            </div>
          </div>
          <IconArrowRight size={16} className="text-zinc-500" />
        </Link>
      </div>
    </div>
  );
}
