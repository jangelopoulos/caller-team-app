import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import Header from '../components/Header';
import { fmtMoney, fmtNumber } from '../lib/format';
import type { PayRun } from '../lib/types';
import { IconReceipt2 } from '@tabler/icons-react';

export default function Pay() {
  const { employee, region } = useAuth();
  const [runs, setRuns] = useState<PayRun[]>([]);
  const [selected, setSelected] = useState<PayRun | null>(null);

  useEffect(() => {
    if (!employee) return;
    supabase
      .from('pay_run')
      .select('*')
      .eq('employee_id', employee.id)
      .order('paid_date', { ascending: false })
      .limit(20)
      .then(({ data }) => setRuns((data ?? []) as PayRun[]));
  }, [employee]);

  return (
    <div className="space-y-4 pb-6">
      <Header title="Pay runs" subtitle="Your payslip history" />

      {runs.length === 0 && (
        <Glass className="p-8 text-center">
          <IconReceipt2 size={32} className="mx-auto text-zinc-600 mb-2" />
          <div className="text-sm text-zinc-400">No pay runs yet.</div>
        </Glass>
      )}

      <div className="space-y-2.5">
        {runs.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left">
            <Glass className="p-4 hover:bg-white/5 transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{r.date_from} → {r.date_to}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Paid {r.paid_date ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="num text-xl font-semibold">{fmtMoney(r.total_pay, region)}</div>
                  <div className="num text-xs text-zinc-500">{fmtNumber(r.paid_time, 2)}h</div>
                </div>
              </div>
            </Glass>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <Glass strong className="w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">Payslip</div>
              <Pill tone="ok">Paid</Pill>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Pay period</div>
              <div className="font-medium">{selected.date_from} → {selected.date_to}</div>
            </div>
            <div className="num text-4xl font-semibold">{fmtMoney(selected.total_pay, region)}</div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Hours</div>
                <div className="num text-lg">{fmtNumber(selected.paid_time, 2)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Rate</div>
                <div className="num text-lg">{fmtMoney(employee?.active_pay_rate_per_hour ?? 0, region)}/h</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Extra</div>
                <div className="num text-lg">{fmtNumber(selected.extra_time, 2)}h</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Paid on</div>
                <div className="text-sm pt-1">{selected.paid_date ?? '—'}</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="btn btn-ghost w-full mt-2">Close</button>
          </Glass>
        </div>
      )}
    </div>
  );
}
