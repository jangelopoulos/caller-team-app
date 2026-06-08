import { Link } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { Glass } from '../components/Glass';
import Header from '../components/Header';
import { IconUmbrellaFilled, IconFiles, IconMessages, IconLogout, IconChevronRight, IconUser } from '@tabler/icons-react';

export default function More() {
  const { employee, signOut, region } = useAuth();
  const items = [
    { to: '/leave', label: 'Request leave', sub: 'Submit & track', icon: IconUmbrellaFilled },
    { to: '/documents', label: 'HR documents', sub: 'Policies & forms', icon: IconFiles },
    { to: '/chat', label: 'Team chat', sub: 'Channels & DMs', icon: IconMessages },
  ];

  return (
    <div className="space-y-4 pb-6">
      <Header title="More" />

      <Link to="/profile">
        <Glass className="p-4 flex items-center gap-3 hover:bg-white/5 transition">
          <div className="size-12 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center overflow-hidden">
            {employee?.profile_pic?.url ? <img src={employee.profile_pic.url} alt="" className="size-12 rounded-2xl object-cover" /> : <IconUser />}
          </div>
          <div className="flex-1">
            <div className="font-medium">{employee?.first_name} {employee?.last_name}</div>
            <div className="text-xs text-zinc-500">{employee?.role} · {region}</div>
          </div>
          <IconChevronRight size={16} className="text-zinc-600" />
        </Glass>
      </Link>

      <div className="space-y-2">
        {items.map((i) => (
          <Link key={i.to} to={i.to}>
            <Glass className="p-4 flex items-center gap-3 hover:bg-white/5 transition">
              <div className="size-10 rounded-xl bg-white/5 text-indigo-300 flex items-center justify-center">
                <i.icon size={18} stroke={1.6} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{i.label}</div>
                <div className="text-xs text-zinc-500">{i.sub}</div>
              </div>
              <IconChevronRight size={16} className="text-zinc-600" />
            </Glass>
          </Link>
        ))}
      </div>

      <button onClick={signOut} className="btn btn-ghost w-full mt-6 text-red-300">
        <IconLogout size={16} /> Sign out
      </button>
    </div>
  );
}
