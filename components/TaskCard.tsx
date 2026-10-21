import React from 'react';
import { Task, Priority } from '../types';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onClick: (task: Task) => void;
}

const priorityColors: Record<Priority, string> = {
  [Priority.Low]: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  [Priority.Medium]: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50',
  [Priority.High]: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/50',
  [Priority.Critical]: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/50',
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onClick }) => {
  const getDaysLeft = (timestamp: number) => {
    const now = new Date();
    // Reset time to midnight for accurate day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const due = new Date(timestamp);
    const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600 dark:text-red-400 font-semibold' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600 dark:text-orange-400 font-semibold' };
    if (diffDays === 1) return { text: '1 day left', color: 'text-slate-500 dark:text-slate-400' };
    return { text: `${diffDays} days left`, color: 'text-slate-500 dark:text-slate-400' };
  };

  const dueInfo = task.dueDate ? getDaysLeft(task.dueDate) : null;
  const commentCount = task.comments ? task.comments.length : 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="group relative bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 overflow-hidden"
    >
      {task.imageUrl && (
        <div className="-mx-4 -mt-4 mb-3 overflow-hidden h-36 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60">
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.storyPoints && (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full">
            {task.storyPoints} pts
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
        {task.title}
      </h3>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
        {task.description}
      </p>

      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-1 flex-wrap items-center">
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
              #{tag}
            </span>
          ))}
          {dueInfo && (
             <div className={`flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-900/40 px-1.5 py-0.5 rounded ml-1 ${dueInfo.color}`} title={new Date(task.dueDate!).toLocaleDateString()}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{dueInfo.text}</span>
             </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 px-1.5 py-0.5 ml-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>{commentCount}</span>
            </div>
          )}
        </div>
        <div 
          className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner shrink-0 ml-2"
          title={task.assignee || 'Unassigned'}
        >
          {getInitials(task.assignee)}
        </div>
      </div>
    </div>
  );
};