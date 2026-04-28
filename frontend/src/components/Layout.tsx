import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/NotificationBell';
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Scale,
} from 'lucide-react';
import { useState } from 'react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'My Logs', path: '/logs' },
      { icon: ClipboardCheck, label: 'My Placement', path: '/placement' },
    ],
    workplace_supervisor: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Pending Reviews', path: '/reviews' },
      { icon: Users, label: 'My Interns', path: '/interns' },
    ],
    academic_supervisor: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Pending Reviews', path: '/reviews' },
      { icon: ClipboardCheck, label: 'Evaluations', path: '/evaluations' },
      { icon: Users, label: 'Assigned Students', path: '/interns' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Users', path: '/users' },
      { icon: ClipboardCheck, label: 'Placements', path: '/placements' },
      { icon: Scale, label: 'Eval Criteria', path: '/criteria' },
      { icon: FileText, label: 'Reports', path: '/reports' },
    ],
  };

  const currentNavItems = user ? navItems[user.role] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b">
            <Link to="/dashboard" className="text-xl font-bold text-primary">
              ILES
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {currentNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="mb-4">
              <p className="font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-sm text-gray-500 capitalize">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top header with notification bell */}
        <div className="flex items-center justify-end h-14 px-6 border-b bg-white">
          <NotificationBell />
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
