import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  PenSquare,
  User,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  BarChart3,
  History,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '../components/Logo';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/dashboard/notes', icon: FileText, label: 'Notes' },
  { path: '/dashboard/posts', icon: PenSquare, label: 'Posts' },
  { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/dashboard/activity', icon: History, label: 'Activity' },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';
  const mainMargin = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-card border-r border-border z-50 transform transition-all duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo + Collapse Toggle */}
          <div className="p-4 border-b border-border flex items-center justify-between h-16">
            {(!collapsed || mobileOpen) ? (
              <Link to="/dashboard">
                <Logo className="w-8 h-8" />
              </Link>
            ) : (
              <div className="w-full flex justify-center lg:mb-4">
                <Link to="/dashboard">
                  <Logo showText={false} className="w-8 h-8" />
                </Link>
              </div>
            )}
            {/* Close button on mobile */}
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              data-testid="close-sidebar-btn"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Collapse toggle on desktop */}

          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  collapsed && !mobileOpen ? 'justify-center' : ''
                } ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={collapsed ? item.label : undefined}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout at Bottom */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-destructive hover:bg-destructive/10 ${
                collapsed && !mobileOpen ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Logout' : undefined}
              aria-label="Logout"
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${mainMargin} transition-all duration-200`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-8">
          {/* Left: Mobile menu button */}
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            data-testid="open-sidebar-btn"
          >
            <Menu className="h-6 w-6" />
          </button>


          {/* Desktop Sidebar Toggle */}
          <button
            className="hidden lg:flex text-muted-foreground hover:text-foreground mr-4"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="collapse-sidebar-btn"
          >
             {collapsed ? <PanelLeft className="h-6 w-6" /> : <PanelLeftClose className="h-6 w-6" />}
          </button>

          {/* Spacer on desktop */}
          <div className="hidden lg:block" />

          {/* Right: Theme toggle + User avatar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle theme"
              data-testid="dashboard-theme-toggle"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              data-testid="nav-profile"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url.startsWith('/uploads') ? `${API_URL}${user.avatar_url}` : user.avatar_url}
                    alt={user?.full_name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
