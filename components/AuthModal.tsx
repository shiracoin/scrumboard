import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { 
  signInUser, 
  signUpUser, 
  isSupabaseConfigured, 
  getStoredSupabaseConfig, 
  saveSupabaseConfig,
  setForceLocalMode,
  isForceLocalMode,
  SUPABASE_SQL_SCHEMA,
  isMissingUsersTableError 
} from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('User');

  // Supabase config accordion
  const [showConfig, setShowConfig] = useState(false);
  const [configUrl, setConfigUrl] = useState(getStoredSupabaseConfig().url);
  const [configKey, setConfigKey] = useState(getStoredSupabaseConfig().key);
  const [configSaved, setConfigSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingTableWarning, setMissingTableWarning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMissingTableWarning(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email address.');
        if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.');

        const user = await signUpUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
        onAuthSuccess(user);
        onClose();
      } else {
        if (!email.trim() || !password) throw new Error('Please enter both email and password.');
        const user = await signInUser({
          email: email.trim(),
          password,
        });
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      if (isMissingUsersTableError(err)) {
        setMissingTableWarning(true);
        setError("Could not find the table 'public.users' in the schema cache of your Supabase project.");
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(configUrl, configKey);
    setForceLocalMode(false);
    setConfigSaved(true);
    setMissingTableWarning(false);
    setError(null);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  const handleUseLocalMode = () => {
    setForceLocalMode(true);
    setMissingTableWarning(false);
    setError(null);
  };

  const handleSwitchToSupabase = () => {
    setForceLocalMode(false);
    setError(null);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isConfigured = isSupabaseConfigured();
  const isLocal = isForceLocalMode();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${
              mode === 'signin'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={onClose}
            className="px-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[82vh]">
          {/* Supabase status indicator */}
          <div className="mb-4 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {isLocal 
                  ? 'Local Mode Active' 
                  : isConfigured 
                    ? 'Supabase Configured' 
                    : 'Supabase Not Configured (Using Local)'}
              </span>
            </div>
            <div className="flex gap-2">
              {isLocal && (
                <button
                  type="button"
                  onClick={handleSwitchToSupabase}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Reconnect Supabase
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {showConfig ? 'Hide Config' : 'Supabase Settings'}
              </button>
            </div>
          </div>

          {/* Missing Table Setup Guide if PGRST204 occurred */}
          {missingTableWarning && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Supabase: 'public.users' Table Missing
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                    Your Supabase project is connected, but the <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 rounded">users</code> table has not been created yet in your Supabase SQL editor.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 font-sans">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">How to fix in 30 seconds:</div>
                <div>1. Click <strong className="text-indigo-600 dark:text-indigo-400">Copy Table SQL</strong> below.</div>
                <div>2. Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Supabase Dashboard</a> ➔ <strong>SQL Editor</strong>.</div>
                <div>3. Paste and click <strong className="text-emerald-600 dark:text-emerald-400">Run</strong>.</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={copySql}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copiedSql ? '✓ SQL Copied!' : 'Copy Table SQL'}
                </button>

                <button
                  type="button"
                  onClick={handleUseLocalMode}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-medium transition-colors border border-amber-300 dark:border-amber-700"
                >
                  Use Local Mode For Now
                </button>
              </div>
            </div>
          )}

          {/* Config Panel */}
          {showConfig && (
            <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Supabase Project Credentials
                </h4>
                <button
                  type="button"
                  onClick={copySql}
                  className="text-[11px] px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded font-medium border border-indigo-200 dark:border-indigo-700/50"
                >
                  {copiedSql ? '✓ SQL Copied' : 'Copy Table SQL'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter your Supabase project URL and anon public key from your Supabase Dashboard:
              </p>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {configSaved ? 'Saved! Reconnecting...' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          )}

          {error && !missingTableWarning && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Role in Workspace
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('User')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      role === 'User'
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Member (User)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      role === 'Admin'
                        ? 'bg-purple-50 dark:bg-purple-900/40 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Workspace Admin</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Sign In to ScrumBoard'
              )}
            </button>
          </form>

          {/* Quick Demo Logins for test */}
          {mode === 'signin' && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">Quick test accounts:</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@scrumboard.io');
                    setPassword('admin');
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                >
                  Admin (admin@scrumboard.io)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('member@scrumboard.io');
                    setPassword('user');
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                >
                  User (member@scrumboard.io)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
