
import React from 'react';
import { Task, ColumnType, Priority, AppUser } from '../types';

interface DashboardViewProps {
  tasks: Task[];
  onNavigate: (view: string) => void;
  currentUser?: AppUser | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks, onNavigate, currentUser }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.column === ColumnType.Done).length,
    inProgress: tasks.filter(t => t.column === ColumnType.InProgress).length,
    critical: tasks.filter(t => t.priority === Priority.Critical).length,
  };

  const recentTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Welcome back, {currentUser ? currentUser.name : 'Guest'}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.inProgress}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical Issues</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.critical}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Recent Tasks</h3>
            <button 
              onClick={() => onNavigate('board')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Board
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No tasks in your project yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Start by adding tasks to your Kanban board.</p>
                <button
                  onClick={() => onNavigate('board')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Go to Board & Create Task
                </button>
              </div>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${
                    task.priority === Priority.High || task.priority === Priority.Critical ? 'bg-red-500' : 
                    task.priority === Priority.Medium ? 'bg-blue-500' : 'bg-slate-300'
                  }`}></div>
                  {task.imageUrl && (
                    <img 
                      src={task.imageUrl} 
                      alt="" 
                      className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">{task.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      task.column === ColumnType.Done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      task.column === ColumnType.InProgress ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {task.column === ColumnType.InProgress ? 'In Progress' : task.column}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <h3 className="font-bold text-xl mb-2">Boost Productivity</h3>
          <p className="text-indigo-100 mb-6 text-sm">
            Use our AI tools to organize your backlog and generate detailed user stories instantly.
          </p>
          <button 
             onClick={() => onNavigate('board')}
             className="w-full py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-md"
          >
            Go to Board
          </button>
        </div>
      </div>
    </div>
  );
};
