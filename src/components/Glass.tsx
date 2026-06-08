import type { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Glass({
  className,
  strong,
  children,
  ...rest
}: { strong?: boolean; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-2xl', strong ? 'glass-strong' : 'glass', className)} {...rest}>
      {children}
    </div>
  );
}

type TintKey = 'indigo' | 'emerald' | 'amber' | 'cyan' | 'fuchsia' | 'rose' | 'violet';

const TINTS: Record<TintKey, { bg: string; ring: string; glow: string; label: string }> = {
  indigo:   { bg: 'from-indigo-500/15 to-indigo-500/0',   ring: 'ring-indigo-400/15',   glow: 'bg-indigo-500/20',   label: 'text-indigo-300' },
  emerald:  { bg: 'from-emerald-500/15 to-emerald-500/0', ring: 'ring-emerald-400/15',  glow: 'bg-emerald-500/20',  label: 'text-emerald-300' },
  amber:    { bg: 'from-amber-500/15 to-amber-500/0',     ring: 'ring-amber-400/15',    glow: 'bg-amber-500/20',    label: 'text-amber-300' },
  cyan:     { bg: 'from-cyan-500/15 to-cyan-500/0',       ring: 'ring-cyan-400/15',     glow: 'bg-cyan-500/20',     label: 'text-cyan-300' },
  fuchsia:  { bg: 'from-fuchsia-500/15 to-fuchsia-500/0', ring: 'ring-fuchsia-400/15',  glow: 'bg-fuchsia-500/20',  label: 'text-fuchsia-300' },
  rose:     { bg: 'from-rose-500/15 to-rose-500/0',       ring: 'ring-rose-400/15',     glow: 'bg-rose-500/20',     label: 'text-rose-300' },
  violet:   { bg: 'from-violet-500/15 to-violet-500/0',   ring: 'ring-violet-400/15',   glow: 'bg-violet-500/20',   label: 'text-violet-300' },
};

export function Stat({
  label,
  value,
  sub,
  accent,
  tint = 'indigo',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'ok' | 'warn' | 'bad';
  tint?: TintKey;
}) {
  const accentCls = accent === 'ok' ? 'text-ok' : accent === 'warn' ? 'text-warn' : accent === 'bad' ? 'text-bad' : 'text-zinc-100';
  const t = TINTS[tint];
  return (
    <div className={clsx('rounded-2xl glass relative overflow-hidden ring-1', t.ring)}>
      <div className={clsx('absolute -top-8 -right-8 size-24 rounded-full blur-3xl', t.glow)} />
      <div className={clsx('absolute inset-0 bg-gradient-to-br', t.bg)} />
      <div className="relative p-4">
        <div className={clsx('text-[11px] uppercase tracking-wider font-medium', t.label)}>{label}</div>
        <div className={clsx('num text-2xl mt-1.5 font-semibold', accentCls)}>{value}</div>
        {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';
  children: ReactNode;
}) {
  const cls = {
    neutral: 'bg-white/5 text-zinc-300 border border-white/10',
    ok: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    bad: 'bg-red-500/10 text-red-400 border border-red-500/20',
    accent: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  }[tone];
  return <span className={`pill ${cls}`}>{children}</span>;
}
