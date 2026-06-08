import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';
import { Glass, Pill } from '../components/Glass';
import { fmtMoney } from '../lib/format';
import {
  IconArrowLeft, IconUser, IconUpload, IconCheck, IconLock,
  IconPhone, IconCake, IconHeart, IconBuildingBank, IconAlertHexagon,
} from '@tabler/icons-react';

async function resizeImage(file: File, maxEdge: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(async () => {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    URL.revokeObjectURL(url);
    return img as unknown as ImageBitmap;
  });
  const w = (bitmap as any).width as number;
  const h = (bitmap as any).height as number;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', quality)
  );
}

export default function Profile() {
  const { employee, refresh, region } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [birthday, setBirthday] = useState(employee?.birthday ?? '');
  const [gender, setGender] = useState(employee?.gender ?? '');
  const [bio, setBio] = useState(employee?.bio ?? '');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(employee?.profile_pic?.url ?? null);
  const [ecName, setEcName] = useState(employee?.emergency_contact_name ?? '');
  const [ecInfo, setEcInfo] = useState(employee?.emergency_contact_info ?? '');
  const [allergies, setAllergies] = useState(employee?.allergies_or_illness ?? '');
  const [accountName, setAccountName] = useState(employee?.account_name ?? '');
  const [bsb, setBsb] = useState(employee?.bsb ?? '');
  const [accountNumber, setAccountNumber] = useState(employee?.account_number ?? '');
  const [superFund, setSuperFund] = useState(employee?.super_fund ?? '');
  const [superNumber, setSuperNumber] = useState(employee?.super_number ?? '');

  if (!employee) return null;

  const upload = async (file: File) => {
    setErr(null); setUploading(true);
    try {
      const processed = await resizeImage(file, 1024, 0.85);
      const path = `profile/${employee.id}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, processed, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setProfilePicUrl(data.publicUrl);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setErr(null); setOk(false); setSaving(true);
    const { error } = await supabase.from('employees').update({
      phone, birthday: birthday || null, gender, bio,
      profile_pic: profilePicUrl ? { url: profilePicUrl } : null,
      emergency_contact_name: ecName, emergency_contact_info: ecInfo, allergies_or_illness: allergies,
      account_name: accountName, bsb, account_number: accountNumber,
      super_fund: superFund, super_number: superNumber,
    }).eq('id', employee.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
    await refresh();
    setTimeout(() => setOk(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28">
      <header className="pt-2 flex items-center gap-3">
        <Link to="/more" className="size-9 rounded-xl glass flex items-center justify-center"><IconArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Edit profile</h1>
          <p className="text-zinc-500 text-xs">Update your personal information</p>
        </div>
        {ok && <Pill tone="ok"><IconCheck size={12} /> Saved</Pill>}
      </header>

      <Glass className="p-4 flex items-center gap-4">
        <div className="relative">
          <div className="size-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
            {profilePicUrl ? <img src={profilePicUrl} alt="" className="size-16 object-cover" /> : <IconUser size={26} className="text-zinc-600" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{employee.first_name} {employee.last_name}</div>
          <div className="text-xs text-zinc-500 truncate">{employee.role} · {region}</div>
        </div>
        <label className="btn btn-ghost cursor-pointer text-xs !py-2 !px-3">
          <IconUpload size={14} /> {uploading ? 'Uploading…' : 'Change'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
      </Glass>

      <Section icon={IconLock} title="Locked details" subtitle="Managed by your team leader">
        <Read label="First name" value={employee.first_name} />
        <Read label="Last name" value={employee.last_name} />
        <Read label="Email" value={employee.email} />
        <Read label="Employment status" value={employee.employment_status || '—'} />
        <Read label="Country" value={employee.Country || '—'} />
        <Read label="Pay rate" value={employee.active_pay_rate_per_hour ? `${fmtMoney(employee.active_pay_rate_per_hour, region)}/hr` : '—'} />
      </Section>

      <Section icon={IconPhone} title="Contact">
        <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
        <Field label="Birthday" value={birthday} onChange={setBirthday} type="date" />
      </Section>

      <Section icon={IconCake} title="About you">
        <div>
          <Label>Gender</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['Male', 'Female'] as const).map((g) => (
              <button
                key={g} onClick={() => setGender(g)}
                className={`py-2.5 rounded-xl text-sm border transition ${
                  gender === g ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >{g}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Short bio</Label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input resize-none" />
        </div>
      </Section>

      <Section icon={IconAlertHexagon} title="Emergency & health">
        <Field label="Emergency contact name" value={ecName} onChange={setEcName} />
        <Field label="Emergency contact info" value={ecInfo} onChange={setEcInfo} />
        <div>
          <Label>Allergies or illness</Label>
          <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} className="input resize-none" />
        </div>
      </Section>

      <Section icon={IconBuildingBank} title="Banking">
        <Field label="Account name" value={accountName} onChange={setAccountName} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="BSB" value={bsb} onChange={setBsb} className="num" />
          <Field label="Account number" value={accountNumber} onChange={setAccountNumber} className="num" />
        </div>
      </Section>

      <Section icon={IconHeart} title="Superannuation">
        <Field label="Super fund name" value={superFund} onChange={setSuperFund} />
        <Field label="Super number" value={superNumber} onChange={setSuperNumber} className="num" />
      </Section>

      {err && <div className="text-xs text-red-400 px-1">{err}</div>}

      <div className="fixed bottom-0 left-0 right-0 z-30 safe-bottom px-4 py-3 bg-gradient-to-t from-base-0 via-base-0 to-transparent">
        <div className="max-w-2xl mx-auto flex gap-2">
          <button onClick={() => navigate('/more')} className="btn btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
            <IconCheck size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: any; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-300 flex items-center justify-center"><Icon size={14} /></div>
        <div>
          <div className="text-sm font-medium leading-tight">{title}</div>
          {subtitle && <div className="text-[10px] text-zinc-500">{subtitle}</div>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </Glass>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-zinc-400 mb-1.5 block">{children}</label>;
}

function Field({ label, value, onChange, type = 'text', className }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} className={`input ${className ?? ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-sm font-medium text-right truncate text-zinc-300">{value}</div>
    </div>
  );
}
