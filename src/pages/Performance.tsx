import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Stat } from '../components/Glass';
import { fmtNumber, fmtPct, BENCHMARKS } from '../lib/format';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { IconTrendingUp } from '@tabler/icons-react';

interface Row {
  id: string;
  start_time: number;
  oph: number | null;
  connection_rate: number | null;
  outbounds: number | null;
  connects: number | null;
  working_duration: number | null;
}

export default function Performance() {
  const { employee } = useAuth();
  const [range, setRange] = useState<7 | 30>(7);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!employee) return;
    const since = Date.now() - range * 86400_000;
    supabase
      .from('shifts')
      .select('id,start_time,oph,connection_rate,outbounds,connects,working_duration')
      .eq('employee_id', employee.id)
      .gte('start_time', since)
      .order('start_time', { ascending: true })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [employee, range]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (a, r) => {
        a.connects += Number(r.connects ?? 0);
        a.calls += Number(r.outbounds ?? 0);
        a.hours += Number(r.working_duration ?? 0);
        return a;
      },
      { connects: 0, calls: 0, hours: 0 },
    );
    return {
      ...t,
      oph: t.hours > 0 ? t.connects / t.hours : 0,
      cr: t.calls > 0 ? t.connects / t.calls : 0,
    };
  }, [rows]);

  const chartData = rows.map((r) => ({
    label: new Date(r.start_time).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
    oph: r.oph != null ? Number(r.oph) : 0,
    calls: r.outbounds ? Number(r.outbounds) : 0,
    bench: BENCHMARKS.Manual,
  }));

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-zinc-500 text-sm">Trends vs Meson benchmarks</p>
        </div>
        <div className="glass rounded-xl p-0.5 flex text-xs">
          {([7, 30] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg ${range === r ? 'bg-white/10' : 'text-zinc-500'}`}>
              {r}d
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Avg OPH"
          value={fmtNumber(totals.oph, 1)}
          sub={`Bench ${BENCHMARKS.Manual}`}
          accent={totals.oph >= BENCHMARKS.Manual ? 'ok' : totals.oph >= BENCHMARKS.Manual * 0.85 ? 'warn' : 'bad'}
        />
        <Stat label="Connect rate" value={fmtPct(totals.cr)} />
        <Stat label="Total calls" value={totals.calls} />
        <Stat label="Hours worked" value={fmtNumber(totals.hours, 1)} />
      </div>

      <Glass className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium flex items-center gap-1.5"><IconTrendingUp size={16} className="text-indigo-300" /> OPH trend</div>
          <div className="text-xs text-zinc-500">vs benchmark</div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#16161c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <ReferenceLine y={BENCHMARKS.Manual} stroke="rgba(99,102,241,0.5)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="oph" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Glass>

      <Glass className="p-4">
        <div className="text-sm font-medium mb-3">Calls per shift</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#16161c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Bar dataKey="calls" fill="url(#bg)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Glass>

      <Glass className="p-4">
        <div className="text-sm font-medium mb-2">Meson benchmarks</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(BENCHMARKS).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</div>
              <div className="num text-xl font-semibold mt-1">{v}</div>
              <div className="text-[10px] text-zinc-500">OPH target</div>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
}
