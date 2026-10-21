import React, { useState } from 'react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured, 
  SUPABASE_SQL_SCHEMA,
  SUPABASE_TASKS_SQL,
  SUPABASE_USERS_SQL,
  getSupabase,
  isMissingUsersTableError,
  isMissingTasksTableError 
} from '../services/supabase';

export const SettingsView = () => {
  const initialConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialConfig.key);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [testingStatus, setTestingStatus] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [schemaTab, setSchemaTab] = useState<'all' | 'tasks' | 'users'>('all');

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setSavedStatus('Supabase settings saved successfully!');
    setTimeout(() => setSavedStatus(null), 3000);
  };

  const testConnection = async () => {
    setTestingStatus('Testing connection to Supabase tables...');
    const sb = getSupabase();
    if (!sb) {
      setTestingStatus('Please save your Project URL and Anon Key first.');
      return;
    }

    try {
      // 1. Check users table
      const { error: usersError } = await sb.from('users').select('id').limit(1);
      // 2. Check tasks table
      const { error: tasksError } = await sb.from('tasks').select('id').limit(1);

      const missingUsers = usersError && isMissingUsersTableError(usersError);
      const missingTasks = tasksError && isMissingTasksTableError(tasksError);

      if (missingUsers && missingTasks) {
        setTestingStatus("Connected to Supabase, but neither 'users' nor 'tasks' table exists. Copy and run the Full Schema SQL below.");
      } else if (missingUsers) {
        setTestingStatus("Connected to Supabase, but 'public.users' table is missing. Run the Users table SQL below.");
      } else if (missingTasks) {
        setTestingStatus("Connected to Supabase, but 'public.tasks' table is missing. Copy and run the Tasks table SQL below.");
      } else if (usersError) {
        setTestingStatus(`Users table error: ${usersError.message}`);
      } else if (tasksError) {
        setTestingStatus(`Tasks table error: ${tasksError.message}`);
      } else {
        setTestingStatus("✓ Successfully connected to Supabase 'users' and 'tasks' tables!");
      }
    } catch (e: any) {
      setTestingStatus(`Connection error: ${e.message}`);
    }
  };

  const handleCopy = (sql: string, type: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const currentSql = 
    schemaTab === 'all' ? SUPABASE_SQL_SCHEMA :
    schemaTab === 'tasks' ? SUPABASE_TASKS_SQL :
    SUPABASE_USERS_SQL;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Supabase Database Configuration */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Supabase Database (GitHub Pages Compatible)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your free Supabase database for persistent users, authentication, and board tasks.
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isSupabaseConfigured() 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            }`}>
              {isSupabaseConfigured() ? 'Active Config' : 'Demo / Standby'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input 
                type="text" 
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* SQL Table schema block */}
            <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    SQL Schema:
                  </span>
                  <div className="inline-flex rounded-md shadow-xs bg-slate-200 dark:bg-slate-700 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSchemaTab('all')}
                      className={`px-2 py-0.5 rounded ${schemaTab === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      All (Users + Tasks)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchemaTab('tasks')}
                      className={`px-2 py-0.5 rounded ${schemaTab === 'tasks' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      Tasks Table Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchemaTab('users')}
                      className={`px-2 py-0.5 rounded ${schemaTab === 'users' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      Users Table Only
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentSql, schemaTab)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copiedType === schemaTab ? '✓ Copied to Clipboard' : `Copy ${schemaTab === 'all' ? 'All' : schemaTab} SQL`}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto p-2.5 max-h-48 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 custom-scrollbar">
                {currentSql}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs">
                {savedStatus && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{savedStatus}</span>}
                {testingStatus && <span className="text-indigo-600 dark:text-indigo-400 font-medium">{testingStatus}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={testConnection}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700"
                >
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupabase}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
                >
                  Save Supabase Config
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            General
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Project Name</p>
                <p className="text-sm text-slate-500">The name of your project visible to the team.</p>
              </div>
              <input 
                type="text" 
                defaultValue="ScrumBoard" 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 w-64"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Language</p>
                <p className="text-sm text-slate-500">System language preference.</p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 w-64">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive emails about task updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Desktop Push Notifications</p>
                <p className="text-sm text-slate-500">Get notified immediately on your screen.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
