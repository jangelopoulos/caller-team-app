import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass } from '../components/Glass';
import { IconArrowLeft, IconBellOff, IconBell, IconPointFilled, IconCheck } from '@tabler/icons-react';

interface Notif {
  id: string;
  title: string;
  description: string;
  created_at: number;
  seen: boolean;
  type: string;
  recource_type: string;
  recource_id: string;
}

export default function Notifications() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!employee) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id,title,description,created_at,seen,type,recource_type,recource_id')
      .eq('employees_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setList((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [employee?.id]);

  const markAll = async () => {
    if (!employee) return;
    await supabase.from('notifications').update({ seen: true, seen_at: Date.now() }).eq('employees_id', employee.id).eq('seen', false);
    load();
  };

  const open = async (n: Notif) => {
    if (!n.seen) await supabase.from('notifications').update({ seen: true, seen_at: Date.now() }).eq('id', n.id);
    // Route to related resource if we recognise it
    if (n.recource_type === 'chat' && n.recource_id) navigate(`/chat/${n.recource_id}`);
    else if (n.recource_type === 'shift') navigate('/shifts');
    else if (n.recource_type === 'pay_run') navigate('/pay');
    else if (n.recource_type === 'leave_request') navigate('/leave');
    else load();
  };

  const fmtWhen = (ms: number) => {
    const d = new Date(ms);
    const diff = (Date.now() - ms) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groups: { label: string; items: Notif[] }[] = [];
  const today: Notif[] = [], yesterday: Notif[] = [], earlier: Notif[] = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();
  const yMs = todayMs - 86400_000;
  list.forEach((n) => {
    if (n.created_at >= todayMs) today.push(n);
    else if (n.created_at >= yMs) yesterday.push(n);
    else earlier.push(n);
  });
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier });

  const unreadCount = list.filter((n) => !n.seen).length;

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-zinc-500 text-xs">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="btn btn-ghost !py-1.5 !px-2.5 text-xs">
            <IconCheck size={14} /> Mark all
          </button>
        )}
      </header>

      {loading && <div className="text-sm text-zinc-500 text-center py-10">Loading…</div>}

      {!loading && list.length === 0 && (
        <Glass className="p-10 text-center">
          <IconBellOff size={32} className="mx-auto text-zinc-600 mb-3" />
          <div className="text-sm text-zinc-300 font-medium">No notifications yet</div>
          <div className="text-xs text-zinc-500 mt-1">You'll see updates about shifts, pay, leave, and team activity here.</div>
        </Glass>
      )}

      {groups.map((g) => (
        <div key={g.label} className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium px-1">{g.label}</div>
          {g.items.map((n) => (
            <button key={n.id} onClick={() => open(n)} className="w-full text-left">
              <Glass className={`p-4 flex gap-3 items-start hover:bg-white/5 transition ${!n.seen ? 'ring-1 ring-indigo-500/20' : ''}`}>
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${!n.seen ? 'bg-indigo-500/15 text-indigo-300' : 'bg-white/5 text-zinc-500'}`}>
                  <IconBell size={18} stroke={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!n.seen && <IconPointFilled size={10} className="text-indigo-400 shrink-0" />}
                    <div className="text-sm font-medium truncate">{n.title || 'Notification'}</div>
                  </div>
                  {n.description && <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{n.description}</div>}
                  <div className="num text-[10px] text-zinc-500 mt-1.5">{fmtWhen(n.created_at)}</div>
                </div>
              </Glass>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
