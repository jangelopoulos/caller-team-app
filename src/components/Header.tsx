import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconBell, IconCalendarMonth, IconMessageCircle2, IconPointFilled } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass } from './Glass';

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

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('notifications')
      .select('id,title,description,created_at,seen,type,recource_type,recource_id')
      .eq('employees_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(8);
    const list = (data ?? []) as Notif[];
    setNotifs(list);
    setUnread(list.filter((n) => !n.seen).length);
  };

  const loadChatUnread = async () => {
    if (!employee) return;
    // Unread = messages not authored by me with no message_reads row for me
    const { data: chats } = await supabase.from('chat').select('id').contains('employees_id', [employee.id]);
    if (!chats?.length) { setUnreadChats(0); return; }
    const chatIds = chats.map((c) => c.id);
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sent_id')
      .in('chat_id', chatIds)
      .neq('sent_id', employee.id)
      .gt('created_at', Date.now() - 14 * 86400_000)
      .limit(500);
    if (!msgs?.length) { setUnreadChats(0); return; }
    const { data: reads } = await supabase
      .from('message_reads')
      .select('message_id')
      .eq('user_id', employee.id)
      .in('message_id', msgs.map((m) => m.id));
    const readSet = new Set((reads ?? []).map((r) => r.message_id));
    setUnreadChats(msgs.filter((m) => !readSet.has(m.id)).length);
  };

  useEffect(() => {
    loadNotifs();
    loadChatUnread();
    if (!employee) return;
    const ch = supabase
      .channel(`hdr:${employee.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `employees_id=eq.${employee.id}` }, loadNotifs)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadChatUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onNotifClick = async (n: Notif) => {
    setOpen(false);
    if (!n.seen) {
      await supabase.from('notifications').update({ seen: true, seen_at: Date.now() }).eq('id', n.id);
    }
    navigate('/notifications');
  };

  const since = (ms: number) => {
    const d = (Date.now() - ms) / 1000;
    if (d < 60) return 'now';
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    if (d < 86400) return `${Math.floor(d / 3600)}h`;
    if (d < 86400 * 7) return `${Math.floor(d / 86400)}d`;
    return new Date(ms).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  return (
    <header className="flex items-center justify-between mb-4 pt-2">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-zinc-500 text-sm truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Link to="/calendar" className="size-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition" aria-label="Calendar">
          <IconCalendarMonth size={18} stroke={1.6} />
        </Link>

        <div className="relative" ref={popRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="size-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition relative"
            aria-label="Notifications"
          >
            <IconBell size={18} stroke={1.6} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 num text-[9px] font-semibold bg-indigo-500 text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 ring-2 ring-base-0">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-[320px] z-50">
              <Glass strong className="overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="text-sm font-semibold">Notifications</div>
                  {unread > 0 && <div className="num text-[10px] text-indigo-300">{unread} new</div>}
                </div>
                <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
                  {notifs.length === 0 && <div className="px-4 py-8 text-center text-xs text-zinc-500">All caught up.</div>}
                  {notifs.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onNotifClick(n)}
                      className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-white/5 transition border-b border-white/[0.03] last:border-0"
                    >
                      <div className="mt-1">
                        {!n.seen ? (
                          <IconPointFilled size={10} className="text-indigo-400" />
                        ) : (
                          <div className="size-[10px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{n.title || 'Notification'}</div>
                        {n.description && <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{n.description}</div>}
                        <div className="num text-[10px] text-zinc-600 mt-1">{since(n.created_at)}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-medium text-indigo-300 hover:bg-white/5 border-t border-white/5"
                >
                  See all
                </Link>
              </Glass>
            </div>
          )}
        </div>

        <Link to="/chat" className="size-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition relative" aria-label="Chat">
          <IconMessageCircle2 size={18} stroke={1.6} />
          {unreadChats > 0 && (
            <span className="absolute -top-0.5 -right-0.5 num text-[9px] font-semibold bg-indigo-500 text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 ring-2 ring-base-0">
              {unreadChats > 9 ? '9+' : unreadChats}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
