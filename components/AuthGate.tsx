import React from 'react';

interface AuthGateProps {
  onSignIn: () => void;
  onSignUp: () => void;
  viewName?: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSignIn, onSignUp, viewName = 'this section' }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[500px]">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6 transition-all">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Authentication Required
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Only connected users can access the <span className="font-semibold text-indigo-600 dark:text-indigo-400">Board</span>, <span className="font-semibold text-indigo-600 dark:text-indigo-400">Dashboard</span>, <span className="font-semibold text-indigo-600 dark:text-indigo-400">Team Members</span>, and <span className="font-semibold text-indigo-600 dark:text-indigo-400">Settings</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-2.5 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Supabase-managed user profiles & database</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Role-based access (Admin & User roles)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Private Kanban board & task activity</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onSignIn}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/25 text-sm transition-all"
          >
            Sign In with Account
          </button>
          <button
            onClick={onSignUp}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-sm transition-all"
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
};
