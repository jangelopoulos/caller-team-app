import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import type { LeaveRequest } from '../lib/types';
import { IconCalendarPlus, IconArrowLeft, IconClock, IconCircleCheck, IconCircleX, IconHourglass } from '@tabler/icons-react';

type LeaveType = 'Paid' | 'Unpaid';
type StatusGroup = 'requested' | 'approved' | 'rejected';

interface LeaveRow extends LeaveRequest {
  reason?: string;
  type?: string;
}

const STATUS_META: Record<StatusGroup, { label: string; tone: 'warn' | 'ok' | 'bad'; icon: any }> = {
  requested: { label: 'Requested', tone: 'warn', icon: IconHourglass },
  approved:  { label: 'Approved',  tone: 'ok',   icon: IconCircleCheck },
  rejected:  { label: 'Rejected',  tone: 'bad',  icon: IconCircleX },
};

async function sendLeaveEmail(p: {
  fullName: string; employeeEmail: string; role: string; region: string;
  from: string; to: string; hours: number; type: LeaveType; reason: string; createdAt: number;
}) {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const sameDay = p.from === p.to;
  const dateLabel = sameDay ? fmtDate(p.from) : `${fmtDate(p.from)} → ${fmtDate(p.to)}`;
  const typeColor = p.type === 'Paid' ? '#10b981' : '#f59e0b';
  const submittedAt = new Date(p.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px -8px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;color:#fff">
          <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;margin-bottom:6px">Meson Agency · Leave request</div>
          <h1 style="margin:0;font-size:22px;font-weight:600;line-height:1.3">${p.fullName} has requested leave</h1>
          <div style="margin-top:8px;display:inline-block;background:rgba(255,255,255,0.18);padding:6px 12px;border-radius:999px;font-size:12px;letter-spacing:.04em">${p.type.toUpperCase()} · ${p.hours}h</div>
        </td></tr>
        <tr><td style="padding:28px 32px 8px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3f3f46">A new leave request was just submitted in the caller team app. Status is currently <strong style="color:#a16207">Requested</strong> — please review and approve or reject in the team management tool.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;margin:8px 0 8px">
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Caller</div><div style="font-size:14px;font-weight:500">${p.fullName}</div><div style="font-size:13px;color:#71717a">${p.employeeEmail}${p.role ? ' · ' + p.role : ''}${p.region ? ' · ' + p.region : ''}</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Dates</div><div style="font-size:14px;font-weight:500">${dateLabel}</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Total hours</div><div style="font-size:14px;font-weight:500">${p.hours} hours</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Type</div><div style="font-size:14px;font-weight:600;color:${typeColor}">${p.type}</div></td></tr>
            <tr><td style="padding:14px 16px"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:6px">Reason</div><div style="font-size:14px;line-height:1.55;color:#27272a;white-space:pre-wrap">${escapeHtml(p.reason)}</div></td></tr>
          </table>
          <p style="margin:16px 0 4px;font-size:12px;color:#71717a">Submitted ${submittedAt}</p>
        </td></tr>
        <tr><td style="padding:8px 32px 24px">
          <div style="font-size:12px;color:#a1a1aa">A copy has been sent to ${escapeHtml(p.employeeEmail)} for their records. Sent automatically by the Meson Caller Team app.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await supabase.functions.invoke('send-email', {
    body: {
      to: 'hr@mesonagency.com',
      cc: ['john@mesonagency.com', 'savvina@mesonagency.com', p.employeeEmail],
      subject: `Leave request — ${p.fullName} · ${p.hours}h ${p.type}`,
      html,
    },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

async function notifyKieran(p: { leaveId?: string; fullName: string; from: string; to: string; hours: number; type: LeaveType }) {
  const { data: kieran } = await supabase
    .from('employees')
    .select('id')
    .ilike('first_name', 'kieran')
    .ilike('last_name', 'McComb')
    .maybeSingle();
  if (!kieran?.id) return;
  const sameDay = p.from === p.to;
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const dates = sameDay ? fmt(p.from) : `${fmt(p.from)}–${fmt(p.to)}`;
  await supabase.from('notifications').insert({
    employees_id: kieran.id,
    title: `Leave request from ${p.fullName}`,
    description: `${p.type} · ${p.hours}h · ${dates}`,
    type: 'leave_request',
    recource_type: 'leave_request',
    recource_id: p.leaveId ?? '',
    seen: false,
  });
}

const normalize = (s: string): StatusGroup => {
  const x = s?.toLowerCase() ?? '';
  if (x === 'approved') return 'approved';
  if (x === 'rejected' || x === 'declined') return 'rejected';
  return 'requested';
};

export default function Leave() {
  const { employee, region } = useAuth();
  const [list, setList] = useState<LeaveRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hours, setHours] = useState('8');
  const [type, setType] = useState<LeaveType>('Paid');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<StatusGroup>('requested');

  const load = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });
    setList((data ?? []) as LeaveRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [employee?.id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!from || !to || !hours || !reason.trim() || !type) {
      setErr('Please complete all fields.');
      return;
    }
    if (new Date(to) < new Date(from)) {
      setErr('End date must be on or after the start date.');
      return;
    }
    setSubmitting(true);
    const payload = {
      employee_id: employee?.id,
      date_from: from,
      date_to: to,
      total_hours: Number(hours),
      status: 'requested',
      type,
      reason: reason.trim(),
    };
    const { data: inserted, error } = await supabase
      .from('leave_requests')
      .insert(payload)
      .select()
      .single();
    if (error) { setSubmitting(false); setErr(error.message); return; }

    // Fire-and-forget side effects — don't block the user on transport errors
    sendLeaveEmail({
      fullName: `${employee!.first_name} ${employee!.last_name}`.trim(),
      employeeEmail: employee!.email,
      role: employee!.role,
      region,
      from, to, hours: Number(hours), type, reason: reason.trim(),
      createdAt: Date.now(),
    }).catch((e) => console.error('send-email failed', e));

    notifyKieran({
      leaveId: inserted?.id,
      fullName: `${employee!.first_name} ${employee!.last_name}`.trim(),
      from, to, hours: Number(hours), type,
    }).catch((e) => console.error('notify failed', e));

    setSubmitting(false);
    setShowForm(false);
    setFrom(''); setTo(''); setHours('8'); setReason(''); setType('Paid');
    setTab('requested');
    await load();
  };

  const grouped = useMemo(() => {
    const g: Record<StatusGroup, LeaveRow[]> = { requested: [], approved: [], rejected: [] };
    list.forEach((l) => g[normalize(l.status)].push(l));
    return g;
  }, [list]);

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Leave</h1>
          <p className="text-zinc-500 text-xs">{region === 'AU' ? "Annual & personal/carer's" : 'PTO'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !py-2 !px-3 text-xs">
          <IconCalendarPlus size={14} /> New
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="glass-solid rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">New request</div>
              <div className="text-lg font-semibold">Request leave</div>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">From <span className="text-indigo-300">*</span></label>
                  <input className="input" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">To <span className="text-indigo-300">*</span></label>
                  <input className="input" type="date" required value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Total hours <span className="text-indigo-300">*</span></label>
                <input className="input num" type="number" step="0.5" min="0.5" required value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Type <span className="text-indigo-300">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Paid', 'Unpaid'] as const).map((t) => {
                    const active = type === t;
                    const tone = t === 'Paid'
                      ? (active ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10')
                      : (active ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10');
                    return (
                      <button key={t} type="button" onClick={() => setType(t)} className={`py-2.5 rounded-xl text-sm border transition ${tone}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Reason <span className="text-indigo-300">*</span></label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell your team leader why you need this time off"
                />
              </div>
              {err && <div className="text-xs text-red-400">{err}</div>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">Cancel</button>
                <button disabled={submitting} className="btn btn-primary flex-1 disabled:opacity-50">{submitting ? 'Sending…' : 'Submit request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(['requested', 'approved', 'rejected'] as const).map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const active = tab === s;
          const tint = s === 'approved' ? 'emerald' : s === 'rejected' ? 'rose' : 'amber';
          const ringCls =
            tint === 'emerald' ? 'ring-emerald-400/40 bg-emerald-500/15' :
            tint === 'rose'    ? 'ring-rose-400/40 bg-rose-500/15' :
                                 'ring-amber-400/40 bg-amber-500/15';
          const iconCls =
            tint === 'emerald' ? 'text-emerald-300' :
            tint === 'rose'    ? 'text-rose-300' :
                                 'text-amber-300';
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-2xl p-3 ring-1 transition relative ${active ? ringCls : 'ring-white/5 bg-white/[0.03] hover:bg-white/5'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon size={14} className={active ? iconCls : 'text-zinc-500'} />
                <span className={`text-[11px] uppercase tracking-wider font-medium ${active ? iconCls : 'text-zinc-500'}`}>{meta.label}</span>
              </div>
              <div className={`num text-xl font-semibold mt-1 ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>{grouped[s].length}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {grouped[tab].length === 0 && (
          <Glass className="p-8 text-center">
            <div className="text-sm text-zinc-400">No {STATUS_META[tab].label.toLowerCase()} requests.</div>
            {tab === 'requested' && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3 !py-2 !px-4 text-xs"><IconCalendarPlus size={14} /> New request</button>
            )}
          </Glass>
        )}
        {grouped[tab].map((l) => {
          const status = normalize(l.status);
          const isPaid = (l.type ?? 'Paid') === 'Paid';
          return (
            <Glass key={l.id} className={`p-4 ${status === 'requested' ? 'ring-1 ring-amber-400/20' : status === 'approved' ? 'ring-1 ring-emerald-400/20' : 'ring-1 ring-rose-400/20'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{fmt(l.date_from)} → {fmt(l.date_to)}</div>
                  <div className="num text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <IconClock size={11} /> {l.total_hours}h
                  </div>
                  {l.reason && (
                    <div className="text-xs text-zinc-400 mt-2 line-clamp-3 whitespace-pre-wrap">{l.reason}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Pill tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Pill>
                  <Pill tone={isPaid ? 'ok' : 'warn'}>{l.type ?? 'Paid'}</Pill>
                </div>
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}
