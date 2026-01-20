import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ScanLine,
  FileBarChart,
  Upload,
  Server,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', to: '/organizations', icon: Building2 },
  { name: 'Detections', to: '/detections', icon: ScanLine },
  { name: 'Reports', to: '/reports', icon: FileBarChart },
  { name: 'Test Upload', to: '/upload', icon: Upload },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 shadow-2xl">
        {/* Logo Section */}
        <div className="flex h-20 items-center gap-3 px-5 border-b border-slate-700/50">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
              <Shield className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">Central Server</span>
            <span className="text-xs text-slate-400 font-medium">Object Detection</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </p>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white/80" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">System Active</p>
                <p className="text-xs text-slate-400">Central Server Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
