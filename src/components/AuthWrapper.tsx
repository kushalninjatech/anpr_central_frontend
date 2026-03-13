import { useState, useEffect } from 'react';
import { Key, Shield, User, Lock } from 'lucide-react';
import { setApiToken } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Get credentials from environment variables
const ADMIN_USERNAME = (import.meta as any).env?.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin@123';
const SUPER_ADMIN_TOKEN = (import.meta as any).env?.VITE_SUPER_ADMIN_TOKEN || '';

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const isLoggedIn = localStorage.getItem('adminAuthenticated');
    if (isLoggedIn === 'true') {
      // Set the API token for authenticated session
      setApiToken(SUPER_ADMIN_TOKEN);
      localStorage.setItem('api_token', SUPER_ADMIN_TOKEN);
      setIsAuthenticated(true);
      setIsInitialized(true);
    } else {
      setShowLoginForm(true);
      setIsInitialized(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set the super admin token for API access
      setApiToken(SUPER_ADMIN_TOKEN);
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('api_token', SUPER_ADMIN_TOKEN);
      setIsAuthenticated(true);
      setShowLoginForm(false);
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  // Don't render anything until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing..." />
      </div>
    );
  }

  if (!isAuthenticated || showLoginForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/50 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-slate-400">Central Object Detection System</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-50 p-2 rounded-lg">
                <Key className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Admin Login</h2>
                <p className="text-sm text-gray-500">Enter your credentials</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Username</span>
                  </div>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Password</span>
                  </div>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-500/25"
              >
                Login
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-800">
                    <strong>Restricted Access:</strong> This portal is for administrators only.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Logout button - can be added to Layout if needed */}
    </>
  );
}
