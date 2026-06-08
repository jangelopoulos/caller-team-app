import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import type { LeaveRequest } from '../lib/types';
import { IconCalendarPlus, IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function Leave() {
  const { employee, region } = useAuth();
  const [list, setList] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hours, setHours] = useState('8');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });
    setList((data ?? []) as LeaveRequest[]);
  };

  useEffect(() => { load(); }, [employee]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employee?.id,
      date_from: from,
      date_to: to,
      total_hours: Number(hours),
      status: 'pending',
    });
    setSubmitting(false);
    if (error) { setErr(error.message); return; }
    setShowForm(false);
    setFrom(''); setTo(''); setHours('8');
    await load();
  };

  const toneOf = (s: string) =>
    s === 'approved' ? 'ok' : s === 'declined' || s === 'rejected' ? 'bad' : 'warn';

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Leave</h1>
          <p className="text-zinc-500 text-xs">{region === 'AU' ? 'Annual & personal/carer\'s' : 'PTO'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !py-2 !px-3 text-xs">
          <IconCalendarPlus size={14} /> New
        </button>
      </header>

      {showForm && (
        <Glass strong className="p-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">From</label>
                <input className="input" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">To</label>
                <input className="input" type="date" required value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Total hours</label>
              <input className="input num" type="number" step="0.5" min="0" required value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button disabled={submitting} className="btn btn-primary flex-1">{submitting ? 'Sending…' : 'Submit'}</button>
            </div>
          </form>
        </Glass>
      )}

      <div className="space-y-2">
        {list.length === 0 && <Glass className="p-6 text-center text-sm text-zinc-500">No leave requests yet.</Glass>}
        {list.map((l) => (
          <Glass key={l.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{l.date_from} → {l.date_to}</div>
              <div className="num text-xs text-zinc-500 mt-0.5">{l.total_hours}h</div>
            </div>
            <Pill tone={toneOf(l.status) as any}>{l.status}</Pill>
          </Glass>
        ))}
      </div>
    </div>
  );
}
