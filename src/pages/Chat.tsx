import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass } from '../components/Glass';
import type { Chat } from '../lib/types';
import { IconArrowLeft, IconMessages, IconHash, IconUsers } from '@tabler/icons-react';

interface ChatRow extends Chat {
  last_message?: string;
  last_at?: number;
  unread?: number;
}

export default function ChatList() {
  const { employee } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data: chs } = await supabase
        .from('chat')
        .select('*')
        .contains('employees_id', [employee.id]);
      const list = (chs ?? []) as ChatRow[];

      // Get last message & unread per chat
      await Promise.all(
        list.map(async (c) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, message, created_at')
            .eq('chat_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (msgs?.[0]) {
            c.last_message = msgs[0].message;
            c.last_at = msgs[0].created_at;
          }
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', c.id)
            .neq('sent_id', employee.id)
            .gt('created_at', Date.now() - 30 * 86400_000);
          c.unread = count ?? 0;
        }),
      );
      list.sort((a, b) => (b.last_at ?? 0) - (a.last_at ?? 0));
      setChats(list);
    })();
  }, [employee]);

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <h1 className="text-xl font-semibold">Chat</h1>
      </header>

      {chats.length === 0 && (
        <Glass className="p-8 text-center">
          <IconMessages size={32} className="mx-auto text-zinc-600 mb-2" />
          <div className="text-sm text-zinc-400">No chats yet.</div>
        </Glass>
      )}

      <div className="space-y-2">
        {chats.map((c) => {
          const Icon = c.type === 'channel' ? IconHash : IconUsers;
          return (
            <Link key={c.id} to={`/chat/${c.id}`}>
              <Glass className="p-3.5 flex items-center gap-3 hover:bg-white/5 transition">
                <div className="size-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    {c.last_at && <div className="num text-[10px] text-zinc-500">{new Date(c.last_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-xs text-zinc-500 truncate">{c.last_message ?? 'No messages yet'}</div>
                    {c.unread ? <span className="num text-[10px] bg-indigo-500 text-white rounded-full px-1.5 min-w-[18px] text-center">{c.unread}</span> : null}
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
