import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass } from '../components/Glass';
import type { Chat } from '../lib/types';
import { IconArrowLeft, IconMessages, IconHash, IconUsers, IconSearch, IconUser } from '@tabler/icons-react';

interface ChatRow extends Chat {
  last_message?: string;
  last_at?: number;
  unread?: number;
  other_name?: string;
  other_pic?: string | null;
}

function avatarColor(seed: string) {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
  ];
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return colors[Math.abs(h) % colors.length];
}

export default function ChatList() {
  const { employee } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      setLoading(true);
      const { data: chs } = await supabase
        .from('chat')
        .select('*')
        .contains('employees_id', [employee.id]);
      const list = (chs ?? []) as ChatRow[];

      // Collect other employee ids for DMs
      const otherIds = new Set<string>();
      list.forEach((c) => {
        if (c.type === 'dm' || (c.employees_id?.length ?? 0) === 2) {
          c.employees_id?.forEach((id) => { if (id !== employee.id) otherIds.add(id); });
        }
      });
      let nameMap = new Map<string, { name: string; pic: string | null }>();
      if (otherIds.size > 0) {
        const { data: emps } = await supabase
          .from('employees')
          .select('id,first_name,last_name,profile_pic')
          .in('id', Array.from(otherIds));
        (emps ?? []).forEach((e: any) => {
          nameMap.set(e.id, { name: `${e.first_name} ${e.last_name}`.trim(), pic: e.profile_pic?.url ?? null });
        });
      }

      await Promise.all(
        list.map(async (c) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, message, created_at, sent_id')
            .eq('chat_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (msgs?.[0]) { c.last_message = msgs[0].message; c.last_at = msgs[0].created_at; }
          const { data: theirMsgs } = await supabase
            .from('messages')
            .select('id')
            .eq('chat_id', c.id)
            .neq('sent_id', employee.id)
            .gt('created_at', Date.now() - 30 * 86400_000)
            .limit(200);
          if (theirMsgs?.length) {
            const { data: reads } = await supabase
              .from('message_reads')
              .select('message_id')
              .eq('user_id', employee.id)
              .in('message_id', theirMsgs.map((m) => m.id));
            const readSet = new Set((reads ?? []).map((r) => r.message_id));
            c.unread = theirMsgs.filter((m) => !readSet.has(m.id)).length;
          } else c.unread = 0;
          if (nameMap.size && (c.type === 'dm' || (c.employees_id?.length ?? 0) === 2)) {
            const otherId = c.employees_id?.find((id) => id !== employee.id);
            if (otherId && nameMap.has(otherId)) {
              const o = nameMap.get(otherId)!;
              c.other_name = o.name; c.other_pic = o.pic;
            }
          }
        }),
      );
      list.sort((a, b) => (b.last_at ?? 0) - (a.last_at ?? 0));
      setChats(list);
      setLoading(false);
    })();
  }, [employee]);

  const filtered = useMemo(
    () => chats.filter((c) => {
      const name = c.other_name || c.name || '';
      return name.toLowerCase().includes(q.toLowerCase()) || (c.last_message ?? '').toLowerCase().includes(q.toLowerCase());
    }),
    [chats, q],
  );

  const when = (ms?: number) => {
    if (!ms) return '';
    const d = new Date(ms); const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    const diff = (Date.now() - ms) / 86400_000;
    if (diff < 7) return d.toLocaleDateString('en-AU', { weekday: 'short' });
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="text-zinc-500 text-xs">{chats.length} conversation{chats.length === 1 ? '' : 's'}</p>
        </div>
      </header>

      <div className="relative">
        <IconSearch size={16} className="absolute left-3.5 top-3 text-zinc-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="input pl-10" />
      </div>

      {loading && <div className="text-sm text-zinc-500 text-center py-10">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <Glass className="p-10 text-center">
          <IconMessages size={32} className="mx-auto text-zinc-600 mb-2" />
          <div className="text-sm text-zinc-400">{q ? 'No matches' : 'No chats yet'}</div>
        </Glass>
      )}

      <div className="space-y-1.5">
        {filtered.map((c) => {
          const isDM = c.type === 'dm' || (c.employees_id?.length ?? 0) === 2;
          const name = isDM ? c.other_name ?? c.name : c.name;
          const Icon = c.type === 'channel' ? IconHash : isDM ? null : IconUsers;
          const grad = avatarColor(name || c.id);
          return (
            <Link key={c.id} to={`/chat/${c.id}`}>
              <Glass className={`p-3 flex items-center gap-3 hover:bg-white/[0.06] transition ${c.unread ? 'ring-1 ring-indigo-500/15' : ''}`}>
                <div className="relative shrink-0">
                  {c.other_pic ? (
                    <img src={c.other_pic} alt="" className="size-12 rounded-2xl object-cover" />
                  ) : (
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                      {Icon ? <Icon size={20} /> : (name?.[0] ?? <IconUser size={20} />)}
                    </div>
                  )}
                  {c.unread ? <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-indigo-500 ring-2 ring-base-0" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className={`text-sm truncate ${c.unread ? 'font-semibold text-zinc-100' : 'font-medium text-zinc-200'}`}>{name}</div>
                    <div className="num text-[10px] text-zinc-500 shrink-0">{when(c.last_at)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className={`text-xs truncate ${c.unread ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {c.last_message ?? <span className="italic text-zinc-600">No messages yet</span>}
                    </div>
                    {c.unread ? (
                      <span className="num text-[10px] font-semibold bg-indigo-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5">
                        {c.unread > 9 ? '9+' : c.unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Glass>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
