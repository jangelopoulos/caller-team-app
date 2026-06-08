import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import { IconArrowLeft, IconCheck, IconEye, IconEyeOff, IconLock, IconShieldCheck } from '@tabler/icons-react';

function strengthOf(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const meta = [
    { label: 'Very weak', color: 'bg-rose-500' },
    { label: 'Weak',      color: 'bg-rose-500' },
    { label: 'Fair',      color: 'bg-amber-500' },
    { label: 'Good',      color: 'bg-emerald-500' },
    { label: 'Strong',    color: 'bg-emerald-500' },
    { label: 'Very strong', color: 'bg-emerald-400' },
  ];
  return { score: s, ...meta[s] };
}

export default function ChangePassword() {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const strength = strengthOf(next);
  const valid =
    current.length > 0 &&
    next.length >= 8 &&
    next === confirm &&
    next !== current;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!valid || !employee) return;

    setSaving(true);
    // Verify current password by re-signing in (Supabase has no native verify-password API)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: employee.email,
      password: current,
    });
    if (signInErr) {
      setSaving(false);
      setErr('Current password is incorrect.');
      return;
    }
    const { error: updErr } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (updErr) { setErr(updErr.message); return; }
    setOk(true);
    setCurrent(''); setNext(''); setConfirm('');
    setTimeout(() => navigate('/more'), 1200);
  };

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Change password</h1>
          <p className="text-zinc-500 text-xs">Update the password you use to sign in</p>
        </div>
        {ok && <Pill tone="ok"><IconCheck size={12} /> Updated</Pill>}
      </header>

      <Glass className="p-4 flex items-start gap-3">
        <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0">
          <IconShieldCheck size={18} stroke={1.6} />
        </div>
        <div className="text-xs text-zinc-400">
          Choose a password with at least <span className="text-zinc-200">8 characters</span>. A mix of upper- and lower-case letters, a number, and a symbol makes your account harder to break into.
        </div>
      </Glass>

      <Glass className="p-4">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5"><IconLock size={12} /> Current password</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">New password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showNext ? 'text' : 'password'}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={8}
                required
              />
              <button type="button" onClick={() => setShowNext((s) => !s)} className="absolute right-2.5 top-2.5 size-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-500">
                {showNext ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
            {next.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition ${i < strength.score ? strength.color : 'bg-white/10'}`} />
                  ))}
                </div>
                <div className={`text-[10px] mt-1.5 ${strength.score >= 3 ? 'text-emerald-300' : strength.score >= 2 ? 'text-amber-300' : 'text-rose-300'}`}>
                  {strength.label}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Confirm new password</label>
            <input
              className="input"
              type={showNext ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {confirm.length > 0 && next !== confirm && (
              <div className="text-[10px] text-rose-300 mt-1.5">Passwords don't match.</div>
            )}
            {next.length > 0 && next === current && (
              <div className="text-[10px] text-amber-300 mt-1.5">New password must be different from current.</div>
            )}
          </div>

          {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => navigate('/more')} className="btn btn-ghost flex-1">Cancel</button>
            <button disabled={!valid || saving} className="btn btn-primary flex-1 disabled:opacity-50">
              <IconCheck size={16} /> {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </Glass>
    </div>
  );
}
