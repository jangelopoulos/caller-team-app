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

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'ok' | 'warn' | 'bad';
}) {
  const accentCls = accent === 'ok' ? 'text-ok' : accent === 'warn' ? 'text-warn' : accent === 'bad' ? 'text-bad' : 'text-zinc-100';
  return (
    <Glass className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{label}</div>
      <div className={clsx('num text-2xl mt-1.5 font-semibold', accentCls)}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </Glass>
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
