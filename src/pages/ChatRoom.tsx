import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import type { Chat, Message } from '../lib/types';
import { IconArrowLeft, IconSend } from '@tabler/icons-react';

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: c }, { data: ms }] = await Promise.all([
        supabase.from('chat').select('*').eq('id', id).maybeSingle(),
        supabase.from('messages').select('*').eq('chat_id', id).order('created_at', { ascending: true }).limit(200),
      ]);
      setChat(c as Chat);
      setMessages((ms ?? []) as Message[]);
    })();

    const ch = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${id}` }, (p) => {
        setMessages((cur) => [...cur, p.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Mark as read
    if (!employee || messages.length === 0) return;
    const unseen = messages.filter((m) => m.sent_id !== employee.id).slice(-30);
    if (unseen.length === 0) return;
    supabase
      .from('message_reads')
      .insert(unseen.map((m) => ({ message_id: m.id, user_id: employee.id, seen_at: Date.now() })))
      .then(() => {});
  }, [messages, employee]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !id || !employee) return;
    setText('');
    await supabase.from('messages').insert({
      chat_id: id,
      sent_id: employee.id,
      message: t,
      Unseen: true,
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-base-0">
      <header className="glass-strong border-b border-white/5 px-3 py-3 flex items-center gap-3 safe-top">
        <Link to="/chat" className="size-9 rounded-xl bg-white/5 flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="font-medium text-sm">{chat?.name ?? 'Chat'}</div>
          <div className="text-[11px] text-zinc-500">{chat?.type ?? ''}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin">
        {messages.map((m) => {
          const mine = m.sent_id === employee?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${mine ? 'bg-indigo-500 text-white rounded-br-md' : 'glass rounded-bl-md'}`}>
                <div className="whitespace-pre-wrap break-words">{m.message}</div>
                <div className={`num text-[10px] mt-0.5 ${mine ? 'text-indigo-200' : 'text-zinc-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-white/5 px-3 py-3 flex items-center gap-2 safe-bottom bg-base-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary !p-2.5 !rounded-xl"><IconSend size={18} /></button>
      </form>
    </div>
  );
}
