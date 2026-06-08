import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass } from './Glass';
import {
  DAYS, DAY_SHORT, SLOT_TYPES, allowedTypesFor, timesFor, formatTimeNumber,
  type AvailabilityRow as AvailRow, type Day, type SlotType,
} from '../lib/availability';
import { IconSun, IconSunset2, IconClock24, IconX, IconTrash, IconCheck } from '@tabler/icons-react';

function typeIcon(t?: string) {
  if (t === 'Morning') return IconSun;
  if (t === 'Afternoon') return IconSunset2;
  if (t === 'Full Day') return IconClock24;
  return null;
}

export default function AvailabilityRow() {
  const { employee } = useAuth();
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [editing, setEditing] = useState<Day | null>(null);

  const load = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('employee_id', employee.id);
    setRows((data ?? []) as AvailRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [employee?.id]);

  const byDay = (d: Day) => rows.find((r) => r.day === d);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Weekly availability</div>
          <div className="text-[10px] text-zinc-600">Tap a day to update</div>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {DAYS.map((d) => {
            const r = byDay(d);
            const Icon = typeIcon(r?.type);
            return (
              <button
                key={d}
                onClick={() => setEditing(d)}
                className={`aspect-[3/4] rounded-2xl p-2 flex flex-col items-center justify-between transition relative overflow-hidden ${
                  r
                    ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-400/30 hover:from-emerald-500/25'
                    : 'glass hover:bg-white/[0.07]'
                }`}
              >
                <div className={`text-[11px] font-semibold tracking-wider ${r ? 'text-emerald-200' : 'text-zinc-400'}`}>
                  {DAY_SHORT[d].toUpperCase()}
                </div>
                {Icon ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <Icon size={18} className="text-emerald-300" stroke={1.6} />
                    <span className="text-[9px] text-emerald-200/80 leading-none">
                      {r?.type === 'Full Day' ? 'Full' : r?.type}
                    </span>
                  </div>
                ) : (
                  <div className="size-1.5 rounded-full bg-zinc-700" />
                )}
                <div className={`text-[9px] num ${r ? 'text-emerald-200/70' : 'text-zinc-600'}`}>
                  {r ? `${Number(r.total_hours).toFixed(r.total_hours % 1 ? 1 : 0)}h` : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {editing && (
        <EditSheet
          day={editing}
          current={byDay(editing)}
          onClose={() => setEditing(null)}
          onChanged={async () => { await load(); setEditing(null); }}
        />
      )}
    </>
  );
}

function EditSheet({
  day, current, onClose, onChanged,
}: { day: Day; current: AvailRow | undefined; onClose: () => void; onChanged: () => void }) {
  const { employee } = useAuth();
  const allowed = allowedTypesFor(day);
  const [type, setType] = useState<SlotType>((current?.type as SlotType) || allowed[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const times = timesFor(day, type);
  const Icon = typeIcon(type) ?? IconSun;

  const save = async () => {
    if (!employee) return;
    setErr(null); setSaving(true);
    const payload = {
      day, type, employee_id: employee.id,
      start_time: times.start_time, end_time: times.end_time,
      break: times.break, total_hours: times.total_hours,
    };
    const { error } = current
      ? await supabase.from('availability').update(payload).eq('id', current.id)
      : await supabase.from('availability').insert(payload);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onChanged();
  };

  const remove = async () => {
    if (!current) return;
    setErr(null); setSaving(true);
    const { error } = await supabase.from('availability').delete().eq('id', current.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <Glass strong className="w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">Availability</div>
            <div className="text-lg font-semibold">{day}</div>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center"><IconX size={18} /></button>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-2">Slot type</div>
          <div className="flex flex-wrap gap-2">
            {SLOT_TYPES.map((t) => {
              const isAllowed = allowed.includes(t);
              const active = type === t;
              const TIcon = typeIcon(t) ?? IconSun;
              return (
                <button
                  key={t}
                  disabled={!isAllowed}
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-xl text-sm border transition flex items-center gap-1.5 ${
                    !isAllowed
                      ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-zinc-500'
                      : active
                        ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-100'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <TIcon size={14} /> {t}
                </button>
              );
            })}
          </div>
          {allowed.length === 1 && (
            <div className="text-[10px] text-zinc-500 mt-2">Only Morning shifts are available on {day}.</div>
          )}
        </div>

        <Glass className="p-3.5 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
            <Icon size={18} stroke={1.6} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{type}</div>
            <div className="num text-xs text-zinc-400">
              {formatTimeNumber(times.start_time)} → {formatTimeNumber(times.end_time)} · {times.total_hours}h
              {times.break ? ' · with break' : ''}
            </div>
          </div>
        </Glass>

        <label className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox" required defaultChecked className="accent-indigo-500 mt-0.5" />
          I confirm I'm available during these hours.
        </label>

        {err && <div className="text-xs text-red-400">{err}</div>}

        <div className="flex gap-2 pt-1">
          {current && (
            <button onClick={remove} disabled={saving} className="btn btn-ghost text-red-300 hover:!text-red-200">
              <IconTrash size={14} /> Remove
            </button>
          )}
          <button onClick={save} disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
            <IconCheck size={14} /> {saving ? 'Saving…' : current ? 'Update' : 'Add availability'}
          </button>
        </div>
      </Glass>
    </div>
  );
}
