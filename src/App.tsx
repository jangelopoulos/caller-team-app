import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Shifts from './pages/Shifts';
import Performance from './pages/Performance';
import Pay from './pages/Pay';
import More from './pages/More';
import Leave from './pages/Leave';
import Documents from './pages/Documents';
import ChatList from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';

function Gate() {
  const { session, employee, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
      </div>
    );
  }
  if (!session) return <Login />;
  if (!employee) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-lg font-medium mb-2">Account not linked</div>
        <p className="text-zinc-500 text-sm">Your auth account isn't linked to an employee record. Contact your team leader.</p>
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="performance" element={<Performance />} />
        <Route path="pay" element={<Pay />} />
        <Route path="more" element={<More />} />
        <Route path="leave" element={<Leave />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chat" element={<ChatList />} />
        <Route path="chat/:id" element={<ChatRoom />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
