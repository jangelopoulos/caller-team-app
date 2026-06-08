import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Glass } from '../components/Glass';
import type { HrDoc } from '../lib/types';
import { IconArrowLeft, IconSearch, IconFileText, IconExternalLink } from '@tabler/icons-react';

export default function Documents() {
  const [docs, setDocs] = useState<HrDoc[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase
      .from('hr_documents')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setDocs((data ?? []) as HrDoc[]));
  }, []);

  const filtered = useMemo(
    () => docs.filter((d) => d.name?.toLowerCase().includes(q.toLowerCase()) || d.description?.toLowerCase().includes(q.toLowerCase())),
    [docs, q],
  );

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <h1 className="text-xl font-semibold">HR Documents</h1>
      </header>

      <div className="relative">
        <IconSearch size={16} className="absolute left-3 top-3 text-zinc-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <Glass className="p-6 text-center text-sm text-zinc-500">No documents.</Glass>}
        {filtered.map((d) => {
          const href = d.attachment?.url || d.link;
          return (
            <a key={d.id} href={href || '#'} target="_blank" rel="noreferrer">
              <Glass className="p-4 flex items-center gap-3 hover:bg-white/5 transition">
                <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center">
                  <IconFileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  {d.description && <div className="text-xs text-zinc-500 truncate">{d.description}</div>}
                </div>
                <IconExternalLink size={14} className="text-zinc-500" />
              </Glass>
            </a>
          );
        })}
      </div>
    </div>
  );
}
