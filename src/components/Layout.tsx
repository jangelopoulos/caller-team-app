import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconCalendarEvent,
  IconChartLine,
  IconCoin,
  IconDotsCircleHorizontal,
} from '@tabler/icons-react';

const tabs = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/shifts', label: 'Shifts', icon: IconCalendarEvent },
  { to: '/performance', label: 'Stats', icon: IconChartLine },
  { to: '/pay', label: 'Pay', icon: IconCoin },
  { to: '/more', label: 'More', icon: IconDotsCircleHorizontal },
];

export default function Layout() {
  const loc = useLocation();
  const hideNav = loc.pathname.startsWith('/chat/');
  return (
    <div className="min-h-full pb-24 safe-top">
      <main className="max-w-2xl mx-auto px-4 pt-4">
        <Outlet />
      </main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
          <div className="max-w-2xl mx-auto px-3 pb-3">
            <div className="glass-strong rounded-2xl px-2 py-1.5 flex items-center justify-around backdrop-blur">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition ${
                      isActive ? 'text-indigo-300 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-200'
                    }`
                  }
                >
                  <t.icon size={22} stroke={1.6} />
                  <span>{t.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
