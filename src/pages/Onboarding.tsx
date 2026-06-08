import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import type { HrDoc } from '../lib/types';
import { fmtMoney } from '../lib/format';
import {
  IconCircleCheck,
  IconCircleDashed,
  IconArrowRight,
  IconArrowLeft,
  IconUpload,
  IconUser,
  IconCheck,
  IconFileText,
  IconExternalLink,
  IconBolt,
  IconLogout,
  IconEraser,
} from '@tabler/icons-react';

const STEPS = [
  { key: 'confirm', label: 'Confirm details' },
  { key: 'general', label: 'About you' },
  { key: 'emergency', label: 'Emergency info' },
  { key: 'financial', label: 'Banking & super' },
  { key: 'docs', label: 'HR documents' },
  { key: 'sign', label: 'Sign & finish' },
];

export default function Onboarding() {
  const { employee, refresh, signOut, region } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Step 2 — general
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [birthday, setBirthday] = useState(employee?.birthday ?? '');
  const [gender, setGender] = useState(employee?.gender ?? '');
  const [bio, setBio] = useState(employee?.bio ?? '');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(employee?.profile_pic?.url ?? null);
  const [uploading, setUploading] = useState(false);

  // Step 3 — emergency
  const [ecName, setEcName] = useState(employee?.emergency_contact_name ?? '');
  const [ecInfo, setEcInfo] = useState(employee?.emergency_contact_info ?? '');
  const [allergies, setAllergies] = useState(employee?.allergies_or_illness ?? '');

  // Step 4 — financial
  const [accountName, setAccountName] = useState(employee?.account_name ?? '');
  const [bsb, setBsb] = useState(employee?.bsb ?? '');
  const [accountNumber, setAccountNumber] = useState(employee?.account_number ?? '');
  const [superFund, setSuperFund] = useState(employee?.super_fund ?? '');
  const [superNumber, setSuperNumber] = useState(employee?.super_number ?? '');

  // Step 5 — docs
  const [docs, setDocs] = useState<HrDoc[]>([]);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});

  // Step 6 — signature
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (step !== 4) return;
    supabase
      .from('hr_documents')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => setDocs((data ?? []) as HrDoc[]));
  }, [step]);

  if (!employee) return null;

  const uploadAvatar = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
      const path = `onboarding/${employee.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setProfilePicUrl(data.publicUrl);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveStep = async (patch: Record<string, any>) => {
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from('employees').update(patch).eq('id', employee.id);
    setSaving(false);
    if (error) { setErr(error.message); return false; }
    await refresh();
    return true;
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const validGeneral = phone.trim() && birthday && gender && bio.trim() && profilePicUrl;
  const validEmergency = ecName.trim() && ecInfo.trim();
  const validFinancial = accountName.trim() && bsb.trim() && accountNumber.trim();
  const allDocsDone = docs.length > 0 && docs.every((d) => opened[d.id] && agreed[d.id]);

  const sendCompletionEmail = async () => {
    const fullName = `${employee.first_name} ${employee.last_name}`.trim();
    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px -8px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 32px 28px;color:#fff">
          <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;margin-bottom:8px">Meson Agency</div>
          <h1 style="margin:0;font-size:22px;font-weight:600;line-height:1.3">Onboarding complete</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:.9">${fullName} is ready to be rostered</p>
        </td></tr>
        <tr><td style="padding:28px 32px 8px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3f3f46">${fullName} has just completed their in-app onboarding form. All required details, banking information, HR document agreements, and a digital signature have been captured.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;margin:8px 0 16px">
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Name</div><div style="font-size:14px;font-weight:500">${fullName}</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Email</div><div style="font-size:14px">${employee.email}</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Role</div><div style="font-size:14px">${employee.role || '—'}</div></td></tr>
            <tr><td style="padding:14px 16px;border-bottom:1px solid #e4e4e7"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Region</div><div style="font-size:14px">${region} · ${employee.Country || ''}</div></td></tr>
            <tr><td style="padding:14px 16px"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:4px">Pay rate</div><div style="font-size:14px">${employee.active_pay_rate_per_hour ? fmtMoney(employee.active_pay_rate_per_hour, region) + '/hr' : '—'}</div></td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46">Next step: add them to the roster when ready.</p>
        </td></tr>
        <tr><td style="padding:8px 32px 28px">
          <div style="font-size:12px;color:#a1a1aa">Sent automatically by the Meson Caller Team app.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'kieran.m@mesonagency.com',
          cc: ['john@mesonagency.com', 'savvina@mesonagency.com'],
          subject: `${fullName} has completed onboarding`,
          html,
        },
      });
    } catch (e) {
      console.error('send-email failed', e);
    }
  };

  const submitFinish = async () => {
    if (!signed) return;
    setSaving(true);
    setErr(null);
    const { error } = await supabase
      .from('employees')
      .update({ onboarding_completed: true })
      .eq('id', employee.id);
    if (error) { setErr(error.message); setSaving(false); return; }
    await sendCompletionEmail();
    await refresh();
    setSaving(false);
  };

  return (
    <div className="min-h-full pb-10 px-4">
      <div className="max-w-xl mx-auto pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl glass flex items-center justify-center"><IconBolt size={18} className="text-indigo-300" /></div>
            <div>
              <div className="text-sm font-semibold">Welcome to Meson</div>
              <div className="text-[11px] text-zinc-500">Let's get you set up</div>
            </div>
          </div>
          <button onClick={signOut} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"><IconLogout size={14} /> Sign out</button>
        </div>

        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-indigo-500' : 'bg-white/10'}`} />
          ))}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Step {step + 1} of {STEPS.length}</div>
        <h1 className="text-2xl font-semibold mb-5">{STEPS[step].label}</h1>

        {step === 0 && (
          <div className="space-y-3">
            <Glass className="p-4 space-y-3">
              <div className="text-xs text-zinc-400 mb-1">Please confirm these are correct. They're set by your team leader and aren't editable here.</div>
              <ReadField label="First name" value={employee.first_name} />
              <ReadField label="Last name" value={employee.last_name} />
              <ReadField label="Email" value={employee.email} />
              <ReadField label="Employment status" value={employee.employment_status || '—'} />
              <ReadField label="Country" value={employee.Country || '—'} />
              <ReadField label="Pay rate" value={employee.active_pay_rate_per_hour ? `${fmtMoney(employee.active_pay_rate_per_hour, region)}/hr` : '—'} />
            </Glass>
            <Glass className="p-3.5 flex items-start gap-2.5">
              <div className="size-6 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-semibold">!</div>
              <div className="text-xs text-zinc-400">If any of the above is incorrect, <span className="text-zinc-200">please contact our team</span> before continuing — message your team leader or email <a href="mailto:hr@mesonagency.com" className="text-indigo-300">hr@mesonagency.com</a>.</div>
            </Glass>
            <FooterButtons primary={{ label: 'Looks correct', onClick: next, enabled: true }} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <Glass className="p-4 space-y-3">
              <div>
                <Label required>Profile photo</Label>
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    {profilePicUrl ? <img src={profilePicUrl} alt="" className="size-16 object-cover" /> : <IconUser size={24} className="text-zinc-600" />}
                  </div>
                  <label className="btn btn-ghost cursor-pointer">
                    <IconUpload size={14} /> {profilePicUrl ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                  </label>
                  {uploading && <Pill tone="accent">Uploading…</Pill>}
                </div>
              </div>
              <Field label="Phone" required value={phone} onChange={setPhone} type="tel" placeholder="+61 4xx xxx xxx" />
              <Field label="Birthday" required value={birthday} onChange={setBirthday} type="date" />
              <div>
                <Label required>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button key={g} onClick={() => setGender(g)} className={`py-2.5 rounded-xl text-sm border transition ${gender === g ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label required>Short bio</Label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input resize-none" placeholder="Tell the team a little about yourself…" />
              </div>
            </Glass>
            <FooterButtons
              back={back}
              primary={{
                label: saving ? 'Saving…' : 'Save & continue',
                enabled: !!validGeneral && !saving && !uploading,
                onClick: async () => {
                  const ok = await saveStep({
                    phone, birthday, gender, bio,
                    profile_pic: profilePicUrl ? { url: profilePicUrl } : null,
                  });
                  if (ok) next();
                },
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Glass className="p-4 space-y-3">
              <Field label="Emergency contact name" required value={ecName} onChange={setEcName} />
              <Field label="Emergency contact info" required value={ecInfo} onChange={setEcInfo} placeholder="Phone, relationship, etc." />
              <div>
                <Label>Allergies or illness</Label>
                <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={3} className="input resize-none" placeholder="Anything we should know? Leave blank if none." />
              </div>
            </Glass>
            <FooterButtons
              back={back}
              primary={{
                label: saving ? 'Saving…' : 'Save & continue',
                enabled: !!validEmergency && !saving,
                onClick: async () => {
                  const ok = await saveStep({
                    emergency_contact_name: ecName,
                    emergency_contact_info: ecInfo,
                    allergies_or_illness: allergies,
                  });
                  if (ok) next();
                },
              }}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Glass className="p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Banking</div>
              <Field label="Account name" required value={accountName} onChange={setAccountName} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="BSB" required value={bsb} onChange={setBsb} className="num" placeholder="000-000" />
                <Field label="Account number" required value={accountNumber} onChange={setAccountNumber} className="num" />
              </div>
            </Glass>
            <Glass className="p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Superannuation <span className="text-zinc-600 normal-case">(optional — can add later)</span></div>
              <Field label="Super fund name" value={superFund} onChange={setSuperFund} />
              <Field label="Super number" value={superNumber} onChange={setSuperNumber} className="num" />
            </Glass>
            <FooterButtons
              back={back}
              primary={{
                label: saving ? 'Saving…' : 'Save & continue',
                enabled: !!validFinancial && !saving,
                onClick: async () => {
                  const ok = await saveStep({
                    account_name: accountName, bsb, account_number: accountNumber,
                    super_fund: superFund, super_number: superNumber,
                  });
                  if (ok) next();
                },
              }}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-400 mb-1">Please open each document and tick that you've read and agree. All documents are required.</div>
            {docs.length === 0 && <Glass className="p-6 text-center text-sm text-zinc-500">Loading documents…</Glass>}
            {docs.map((d) => {
              const href = d.attachment?.url || d.link;
              const isOpen = opened[d.id];
              const isAgreed = agreed[d.id];
              return (
                <Glass key={d.id} className={`p-4 ${isAgreed ? 'ring-1 ring-indigo-500/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0">
                      <IconFileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{d.name}</div>
                      {d.description && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{d.description}</div>}
                      <a
                        href={href || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpened((o) => ({ ...o, [d.id]: true }))}
                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 mt-2"
                      >
                        Open document <IconExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <label className={`mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                    isOpen ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!isOpen}
                      checked={!!isAgreed}
                      onChange={(e) => setAgreed((a) => ({ ...a, [d.id]: e.target.checked }))}
                      className="accent-indigo-500 size-4"
                    />
                    <span className="text-xs">I have read and agree to this document</span>
                    {isAgreed && <IconCheck size={14} className="text-indigo-300 ml-auto" />}
                  </label>
                  {!isOpen && <div className="text-[10px] text-zinc-500 mt-1.5 ml-1">Open the document to enable agreement.</div>}
                </Glass>
              );
            })}
            <FooterButtons back={back} primary={{ label: 'Continue', onClick: next, enabled: allDocsDone }} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Glass className="p-4">
              <div className="text-xs text-zinc-400 mb-3">By signing below, you confirm that all details are accurate and you accept Meson's employment and HR policies.</div>
              <SignaturePad onChange={setSigned} />
            </Glass>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <FooterButtons
              back={back}
              primary={{
                label: saving ? 'Finishing…' : 'Sign & enter app',
                enabled: signed && !saving,
                onClick: submitFinish,
              }}
            />
          </div>
        )}

        {err && step !== 5 && <div className="text-xs text-red-400 mt-3">{err}</div>}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              {i < step ? <IconCircleCheck size={12} className="text-indigo-400" /> : <IconCircleDashed size={12} className={i === step ? 'text-indigo-300' : 'text-zinc-700'} />}
              <span className={i === step ? 'text-zinc-300' : ''}>{s.label}</span>
              {i < STEPS.length - 1 && <span className="text-zinc-800">·</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-sm font-medium text-right truncate">{value}</div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs text-zinc-400 mb-1.5 block">
      {children}{required && <span className="text-indigo-300"> *</span>}
    </label>
  );
}

function Field({
  label, value, onChange, type = 'text', required, placeholder, className,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; className?: string }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input type={type} className={`input ${className ?? ''}`} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FooterButtons({
  back, primary,
}: { back?: () => void; primary: { label: string; onClick: () => void; enabled: boolean } }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      {back && (
        <button onClick={back} className="btn btn-ghost"><IconArrowLeft size={16} /> Back</button>
      )}
      <button
        onClick={primary.onClick}
        disabled={!primary.enabled}
        className="btn btn-primary flex-1 disabled:opacity-50"
      >
        {primary.label} <IconArrowRight size={16} />
      </button>
    </div>
  );
}

function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const has = useRef(false);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#e4e4e7';
  }, []);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = ref.current!.getContext('2d')!;
    const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext('2d')!;
    const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    has.current = true; onChange(true);
  };
  const up = () => { drawing.current = false; };
  const clear = () => {
    const c = ref.current!; const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height); has.current = false; onChange(false);
  };

  return (
    <div>
      <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden touch-none">
        <canvas
          ref={ref}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="block w-full h-40"
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-[10px] text-zinc-600">Sign with your finger or mouse</div>
        <button onClick={clear} className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"><IconEraser size={12} /> Clear</button>
      </div>
    </div>
  );
}
