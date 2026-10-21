import React from 'react';
import { AppUser } from '../types';

interface ProfileViewProps {
  currentUser: AppUser | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onOpenAuth, onSignOut }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-md flex items-center justify-center text-white text-3xl font-bold">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex gap-2">
              {currentUser ? (
                <button 
                  onClick={onSignOut}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => onOpenAuth('signin')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Sign In / Sign Up
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {currentUser ? currentUser.name : 'Guest User'}
              </h1>
              {currentUser && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  currentUser.role === 'Admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                }`}>
                  {currentUser.role}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {currentUser ? currentUser.email : 'Not signed in. Sign in or create an account to persist your profile.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Account Information</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentUser 
                ? `Logged in as ${currentUser.role} synced with Supabase users table.`
                : 'Connect your Supabase account to access team tasks and project management.'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {currentUser?.email || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Role: {currentUser?.role || 'Guest'}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Database & Auth Status</h3>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Target Table: `users`</div>
                <div className="text-xs text-slate-500 font-mono">
                  Columns: id (UUID), name (TEXT), email (TEXT), password (TEXT), role (Admin | User), created_at
                </div>
              </div>

              {!currentUser && (
                <div className="text-center py-4">
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                  >
                    Create Your Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
