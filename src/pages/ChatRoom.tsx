import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import type { Chat, Message } from '../lib/types';
import { IconArrowLeft, IconSend, IconUser, IconHash, IconUsers } from '@tabler/icons-react';

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

interface EmpLite { id: string; first_name: string; last_name: string; profile_pic: { url?: string } | null }

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Map<string, EmpLite>>(new Map());
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: c } = await supabase.from('chat').select('*').eq('id', id).maybeSingle();
      setChat(c as Chat);
      const { data: ms } = await supabase
        .from('messages').select('*').eq('chat_id', id).order('created_at', { ascending: true }).limit(500);
      setMessages((ms ?? []) as Message[]);
      if (c?.employees_id?.length) {
        const { data: emps } = await supabase
          .from('employees').select('id,first_name,last_name,profile_pic')
          .in('id', c.employees_id);
        const m = new Map<string, EmpLite>();
        (emps ?? []).forEach((e: any) => m.set(e.id, e));
        setMembers(m);
      }
    })();

    const ch = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (p) => {
        setMessages((cur) => (cur.some((m) => m.id === (p.new as Message).id) ? cur : [...cur, p.new as Message]));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!employee || messages.length === 0) return;
    const unseen = messages.filter((m) => m.sent_id && m.sent_id !== employee.id).slice(-50);
    if (unseen.length === 0) return;
    supabase
      .from('message_reads')
      .upsert(unseen.map((m) => ({ message_id: m.id, user_id: employee.id, seen_at: Date.now() })), { onConflict: 'message_id,user_id', ignoreDuplicates: true })
      .then(() => {});
  }, [messages, employee]);

  const onTextChange = (v: string) => {
    setText(v);
    const ta = taRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !id || !employee || sending) return;
    setSending(true);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
    const { data } = await supabase.from('messages').insert({
      chat_id: id, sent_id: employee.id, message: t, Unseen: true,
    }).select().single();
    if (data) setMessages((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data as Message]));
    setSending(false);
  };

  const isDM = chat?.type === 'dm' || (chat?.employees_id?.length ?? 0) === 2;
  const otherMember = isDM ? Array.from(members.values()).find((m) => m.id !== employee?.id) : null;
  const headerName = otherMember ? `${otherMember.first_name} ${otherMember.last_name}` : chat?.name ?? 'Chat';
  const subtitle = isDM ? 'Direct message' : `${chat?.employees_id?.length ?? 0} members`;
  const headerGrad = avatarColor(headerName);

  // Group by day for date dividers
  const groups = useMemo(() => {
    const out: { day: string; items: Message[] }[] = [];
    let curDay = '';
    messages.forEach((m) => {
      const day = new Date(m.created_at).toDateString();
      if (day !== curDay) { out.push({ day, items: [m] }); curDay = day; }
      else out[out.length - 1].items.push(m);
    });
    return out;
  }, [messages]);

  const dayLabel = (s: string) => {
    const d = new Date(s); const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0c' }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent" />

      <header className="relative glass-strong border-b border-white/5 px-3 py-2.5 flex items-center gap-3 safe-top z-10">
        <Link to="/chat" className="size-9 rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
          <IconArrowLeft size={18} />
        </Link>
        {otherMember?.profile_pic?.url ? (
          <img src={otherMember.profile_pic.url} className="size-10 rounded-2xl object-cover" alt="" />
        ) : (
          <div className={`size-10 rounded-2xl bg-gradient-to-br ${headerGrad} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
            {chat?.type === 'channel' ? <IconHash size={18} /> : isDM ? (headerName[0] ?? <IconUser size={18} />) : <IconUsers size={18} />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{headerName}</div>
          <div className="text-[11px] text-zinc-500 truncate">{subtitle}</div>
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groups.map((g) => (
          <div key={g.day}>
            <div className="flex items-center justify-center my-3">
              <span className="num text-[10px] uppercase tracking-wider text-zinc-500 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                {dayLabel(g.day)}
              </span>
            </div>
            <div className="space-y-1.5">
              {g.items.map((m, i) => {
                const mine = m.sent_id === employee?.id;
                const prev = g.items[i - 1];
                const next = g.items[i + 1];
                const sameAsPrev = prev && prev.sent_id === m.sent_id && (m.created_at - prev.created_at) < 5 * 60_000;
                const sameAsNext = next && next.sent_id === m.sent_id && (next.created_at - m.created_at) < 5 * 60_000;
                const sender = m.sent_id ? members.get(m.sent_id) : null;
                const showAvatar = !mine && !sameAsNext;
                const grad = avatarColor(m.sent_id ?? 'x');
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (
                      <div className="size-7 shrink-0">
                        {showAvatar ? (
                          sender?.profile_pic?.url ? (
                            <img src={sender.profile_pic.url} className="size-7 rounded-full object-cover" alt="" />
                          ) : (
                            <div className={`size-7 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[10px] font-semibold`}>
                              {sender?.first_name?.[0] ?? '?'}
                            </div>
                          )
                        ) : null}
                      </div>
                    )}
                    <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!mine && !sameAsPrev && sender && !isDM && (
                        <div className="text-[10px] text-zinc-500 mb-0.5 ml-3">{sender.first_name}</div>
                      )}
                      <div
                        className={`px-3.5 py-2 text-sm break-words whitespace-pre-wrap ${
                          mine
                            ? `text-white ${sameAsPrev ? 'rounded-2xl' : 'rounded-2xl'} ${sameAsNext ? 'rounded-br-md' : 'rounded-br-md'}`
                            : `text-zinc-100 ${sameAsPrev ? 'rounded-2xl' : 'rounded-2xl'} ${sameAsNext ? 'rounded-bl-md' : 'rounded-bl-md'}`
                        }`}
                        style={
                          mine
                            ? {
                                background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
                                boxShadow: '0 8px 24px -10px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4)',
                              }
                            : {
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
                                boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06)',
                              }
                        }
                      >
                        {m.message}
                      </div>
                      {!sameAsNext && (
                        <div className={`num text-[10px] mt-0.5 ${mine ? 'text-zinc-500 mr-1' : 'text-zinc-600 ml-3'}`}>
                          {new Date(m.created_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-sm text-zinc-500 mt-20">No messages yet. Say hi 👋</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="relative border-t border-white/5 px-3 py-3 safe-bottom bg-base-0/80 backdrop-blur-glass">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message"
              rows={1}
              className="w-full bg-transparent px-4 py-2.5 text-sm focus:outline-none resize-none placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="size-11 rounded-2xl flex items-center justify-center disabled:opacity-40 transition shrink-0"
            style={{ background: 'linear-gradient(180deg, #6366f1, #4f46e5)', boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 12px 32px -12px rgba(99,102,241,0.6)' }}
            aria-label="Send"
          >
            <IconSend size={18} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
