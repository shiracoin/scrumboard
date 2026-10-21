import React from 'react';
import { Task, Priority, ColumnType } from '../types';

interface AnalyticsViewProps {
  tasks: Task[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  const priorityCounts = {
    [Priority.Low]: tasks.filter(t => t.priority === Priority.Low).length,
    [Priority.Medium]: tasks.filter(t => t.priority === Priority.Medium).length,
    [Priority.High]: tasks.filter(t => t.priority === Priority.High).length,
    [Priority.Critical]: tasks.filter(t => t.priority === Priority.Critical).length,
  };

  const statusCounts = {
    [ColumnType.Todo]: tasks.filter(t => t.column === ColumnType.Todo).length,
    [ColumnType.InProgress]: tasks.filter(t => t.column === ColumnType.InProgress).length,
    [ColumnType.Review]: tasks.filter(t => t.column === ColumnType.Review).length,
    [ColumnType.Done]: tasks.filter(t => t.column === ColumnType.Done).length,
  };

  const total = tasks.length || 1; // avoid division by zero

  // Real Story Points calculations
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks.filter(t => t.column === ColumnType.Done).reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const inProgressPoints = tasks.filter(t => t.column === ColumnType.InProgress).reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const reviewPoints = tasks.filter(t => t.column === ColumnType.Review).reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const todoPoints = tasks.filter(t => t.column === ColumnType.Todo).reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const completionPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : (tasks.length > 0 && statusCounts[ColumnType.Done] > 0 ? Math.round((statusCounts[ColumnType.Done] / tasks.length) * 100) : 0);

  // Group by Assignees
  const assigneeStats = tasks.reduce((acc, t) => {
    const name = t.assignee || 'Unassigned';
    if (!acc[name]) {
      acc[name] = { total: 0, done: 0, points: 0 };
    }
    acc[name].total += 1;
    acc[name].points += (t.storyPoints || 0);
    if (t.column === ColumnType.Done) {
      acc[name].done += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; done: number; points: number }>);

  const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {value} ({Math.round((value / total) * 100)}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${(value / total) * 100}%`, transition: 'width 0.5s ease-in-out' }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Project Analytics</h2>
          <p className="text-sm text-slate-500">Live board metrics calculated from your real project tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            Total Story Points: <span className="font-bold text-indigo-600 dark:text-indigo-200">{totalPoints} pts</span>
          </div>
          <div className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Progress: <span className="font-bold text-emerald-600 dark:text-emerald-200">{completionPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Priority Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Tasks by Priority</h3>
          <Bar label="Critical" value={priorityCounts[Priority.Critical]} color="bg-red-500" />
          <Bar label="High" value={priorityCounts[Priority.High]} color="bg-orange-500" />
          <Bar label="Medium" value={priorityCounts[Priority.Medium]} color="bg-blue-500" />
          <Bar label="Low" value={priorityCounts[Priority.Low]} color="bg-slate-400" />
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Task Status</h3>
          <Bar label="Done" value={statusCounts[ColumnType.Done]} color="bg-emerald-500" />
          <Bar label="Review" value={statusCounts[ColumnType.Review]} color="bg-amber-500" />
          <Bar label="In Progress" value={statusCounts[ColumnType.InProgress]} color="bg-indigo-500" />
          <Bar label="To Do" value={statusCounts[ColumnType.Todo]} color="bg-slate-500" />
        </div>

        {/* Story Points Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Story Points Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">Distribution of estimated effort across workflow states</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                <span>Completed Effort</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{donePoints} pts ({totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                <span>In Progress Effort</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{inProgressPoints} pts</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${totalPoints > 0 ? (inProgressPoints / totalPoints) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                <span>In Review</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{reviewPoints} pts</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${totalPoints > 0 ? (reviewPoints / totalPoints) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                <span>Remaining Backlog</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">{todoPoints} pts</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${totalPoints > 0 ? (todoPoints / totalPoints) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Team Workload</h3>
          <p className="text-xs text-slate-500 mb-4">Task assignment & completed velocity by team member</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto custom-scrollbar">
            {Object.keys(assigneeStats).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No tasks found on the board.</p>
            ) : (
              Object.entries(assigneeStats).map(([name, data]) => (
                <div key={name} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <span>{data.done}/{data.total} done</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{data.points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
