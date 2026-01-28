import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ScanLine,
  FileBarChart,
  Upload,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { config } from '../config';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & Stats' },
  { name: 'Organizations', href: '/organizations', icon: Building2, description: 'Manage Clients' },
  { name: 'Detections', href: '/detections', icon: ScanLine, description: 'Detection Logs' },
  { name: 'Reports', href: '/reports', icon: FileBarChart, description: 'Generate Reports' },
  { name: 'Test Upload', href: '/upload', icon: Upload, description: 'Test Detection' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/50 border-r border-white/50 z-40">
        {/* Logo Section */}
        <div className="relative h-20 flex items-center justify-center bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 overflow-hidden">
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full"></div>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{config.projectName}</h1>
              <p className="text-xs text-white/70 font-medium">Central Server</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 hover:text-primary-700'
                )}
              >
                <div className={clsx(
                  'p-2 rounded-lg transition-all duration-300',
                  isActive
                    ? 'bg-white/20'
                    : 'bg-gray-100 group-hover:bg-primary-100'
                )}>
                  <Icon className={clsx(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'
                  )} />
                </div>
                <div className="flex-1">
                  <span className="block">{item.name}</span>
                  <span className={clsx(
                    'text-xs',
                    isActive ? 'text-white/70' : 'text-gray-400'
                  )}>
                    {item.description}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600">System Online</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ANPR Central v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-72">
        {/* Top gradient line */}
        <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>
        <main className="p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
