import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Glass } from '../components/Glass';
import { IconBolt } from '@tabler/icons-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
  };

  return (
    <div className="min-h-full flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <div className="size-14 rounded-2xl glass-strong flex items-center justify-center shadow-glow">
            <IconBolt className="text-indigo-300" stroke={1.5} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center mb-1">Welcome back</h1>
        <p className="text-zinc-500 text-sm text-center mb-8">Sign in to your Meson caller account</p>
        <Glass className="p-5">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {err}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2 disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </Glass>
        <p className="text-center text-xs text-zinc-600 mt-8">Meson Agency · Caller Team</p>
      </div>
    </div>
  );
}
