
import React, { useState, useMemo, useEffect } from 'react';
import { ColumnType, Task, Priority, AppUser } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { MembersView } from './components/MembersView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { AuthGate } from './components/AuthGate';

import { 
  getActiveUser, 
  setActiveUser,
  fetchTasksFromSupabase,
  createTaskInSupabase,
  updateTaskInSupabase,
  deleteTaskInSupabase,
  subscribeToTasks,
  SUPABASE_TASKS_SQL
} from './services/supabase';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects, 
  DropAnimation
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  { id: ColumnType.Todo, title: 'To Do', color: 'bg-slate-500' },
  { id: ColumnType.InProgress, title: 'In Progress', color: 'bg-indigo-500' },
  { id: ColumnType.Review, title: 'Review', color: 'bg-orange-500' },
  { id: ColumnType.Done, title: 'Done', color: 'bg-emerald-500' }
];

interface SortableTaskProps {
  task: Task;
  onClick: (t: Task) => void;
}

// Sortable Item Wrapper for Tasks
const SortableTask: React.FC<SortableTaskProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard 
        task={task} 
        onClick={onClick} 
        onDragStart={() => {}} // Handled by dnd-kit
      />
    </div>
  );
};

interface DroppableColumnProps {
  id: ColumnType;
  title: string;
  tasks: Task[];
  color: string;
  onAddTask: (id: ColumnType) => void;
  onTaskClick: (task: Task) => void;
}

// Droppable Column
const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, tasks, color, onAddTask, onTaskClick }) => {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: 'Column',
      columnId: id
    }
  });

  return (
    <div className="flex flex-col h-full min-w-[300px] w-[300px] bg-gray-100 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 backdrop-blur-sm transition-colors">
      {/* Column Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
          <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono border border-gray-200 dark:border-transparent">
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={() => onAddTask(id)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Task List */}
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        <SortableContext items={tasks.map((t: Task) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: Task) => (
            <SortableTask key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm italic">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};


export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [tasksTableMissing, setTasksTableMissing] = useState(false);
  const [copiedTasksSql, setCopiedTasksSql] = useState(false);
  const [initialDragColumn, setInitialDragColumn] = useState<ColumnType | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnForNewTask, setTargetColumnForNewTask] = useState<ColumnType>(ColumnType.Todo);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('board');

  // Filter State
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');



  // User Auth State (Supabase)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getActiveUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = () => {
    setActiveUser(null);
    setCurrentUser(null);
  };

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await fetchTasksFromSupabase();
      setTasks(res.tasks);
      setTasksTableMissing(Boolean(res.isMissingTable));
    } catch (e) {
      console.error('Error loading tasks from Supabase:', e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const unsubscribe = subscribeToTasks(() => {
      fetchTasksFromSupabase().then(res => {
        if (res.tasks) setTasks(res.tasks);
      }).catch(() => {});
    });
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px movement to start drag
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derived Filters
  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.assignee).filter((a): a is string => !!a))).sort();
  }, [tasks]);

  const uniqueTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap(t => t.tags))).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchAssignee = filterAssignee ? task.assignee === filterAssignee : true;
      const matchPriority = filterPriority ? task.priority === filterPriority : true;
      const matchTag = filterTag ? task.tags.includes(filterTag) : true;
      return matchAssignee && matchPriority && matchTag;
    });
  }, [tasks, filterAssignee, filterPriority, filterTag]);

  const handleAddTask = (columnId: ColumnType) => {
    setEditingTask(null);
    setTargetColumnForNewTask(columnId);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const saveTask = async (taskUpdate: Partial<Task>) => {
    if (editingTask) {
      const updatedList = tasks.map(t => t.id === taskUpdate.id ? { ...t, ...taskUpdate } as Task : t);
      setTasks(updatedList);
      setIsModalOpen(false);
      try {
        await updateTaskInSupabase(taskUpdate.id!, taskUpdate);
      } catch (err: any) {
        console.error('Failed to update task in Supabase:', err);
      }
    } else {
      const newTask: Task = {
        id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: taskUpdate.title || 'Untitled',
        description: taskUpdate.description || '',
        column: taskUpdate.column || targetColumnForNewTask,
        priority: taskUpdate.priority || Priority.Medium,
        tags: taskUpdate.tags || [],
        storyPoints: taskUpdate.storyPoints || 0,
        assignee: taskUpdate.assignee,
        dueDate: taskUpdate.dueDate,
        imageUrl: taskUpdate.imageUrl,
        comments: taskUpdate.comments || [],
        createdAt: Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
      setIsModalOpen(false);
      try {
        await createTaskInSupabase(newTask);
      } catch (err: any) {
        console.error('Failed to create task in Supabase:', err);
      }
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setIsModalOpen(false);
    try {
      await deleteTaskInSupabase(id);
    } catch (err: any) {
      console.error('Failed to delete task in Supabase:', err);
    }
  };



  const clearFilters = () => {
    setFilterAssignee('');
    setFilterPriority('');
    setFilterTag('');
  };

  // DnD Handlers
  const onDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const item = tasks.find(t => t.id === id);
    if (item) {
      setInitialDragColumn(item.column);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task object or column object
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Scenario 1: Dragging a task over another task
    if (isActiveTask && isOverTask) {
      setTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t.id === activeId);
        const overIndex = prevTasks.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prevTasks;

        if (prevTasks[activeIndex].column !== prevTasks[overIndex].column) {
          // Clone and change column immediately for visual feedback
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            column: prevTasks[overIndex].column
          };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(prevTasks, activeIndex, overIndex);
      });
    }

    // Scenario 2: Dragging a task over an empty column
    if (isActiveTask && isOverColumn) {
      const overColumnId = over.data.current?.columnId;
      setTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prevTasks;
        if (prevTasks[activeIndex].column !== overColumnId) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            column: overColumnId
          };
          return arrayMove(newTasks, activeIndex, activeIndex);
        }
        return prevTasks;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const taskId = activeId;
    setActiveId(null);
    if (!taskId) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask && initialDragColumn && currentTask.column !== initialDragColumn) {
      try {
        await updateTaskInSupabase(currentTask.id, { column: currentTask.column });
      } catch (err) {
        console.error('Failed to sync dragged task to Supabase:', err);
      }
    }
    setInitialDragColumn(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const activeTask = tasks.find(t => t.id === activeId);

  const NavItem = ({ 
    icon, 
    label, 
    viewId 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    viewId: string 
  }) => {
    const isLocked = !currentUser;

    return (
      <div 
        onClick={() => {
          setCurrentView(viewId);
          if (isLocked) {
            openAuth('signin');
          }
        }}
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        currentView === viewId 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-sm">{label}</span>
        </div>
        {isLocked && (
          <span title="Login required" className="text-slate-400 dark:text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen w-screen flex flex-col transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100' 
          : 'bg-gray-50 text-slate-900'
      }`}>
      {/* Navbar */}
      <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
             </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">ScrumBoard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-indigo-400 dark:border-indigo-600 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser.name}
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    currentUser.role === 'Admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth('signin')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`${isSidebarOpen ? 'w-64 border-r' : 'w-0'} flex-shrink-0 transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col`}
        >
          <div className="w-64 p-4 space-y-1">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">Main</div>
            <NavItem 
              viewId="dashboard"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              label="Dashboard"
            />
            <NavItem 
              viewId="board"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>}
              label="Board"
            />
            <NavItem 
              viewId="analytics"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              label="Analytics"
            />
            
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-3 px-3">Team</div>
            <NavItem 
              viewId="members"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              label="Members"
            />
            <NavItem 
              viewId="settings"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Settings"
            />
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-slate-800">
             {currentUser ? (
               <div 
                 onClick={() => setCurrentView('profile')}
                 className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
               >
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                   {currentUser.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{currentUser.name}</p>
                   <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">{currentUser.role}</p>
                 </div>
               </div>
             ) : (
               <div 
                 onClick={() => openAuth('signin')}
                 className="flex items-center gap-3 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 cursor-pointer hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-colors"
               >
                 <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                   </svg>
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">Sign In / Sign Up</p>
                   <p className="text-[10px] text-slate-500 truncate">Connect Supabase user</p>
                 </div>
               </div>
             )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-950 transition-colors overflow-y-auto">
          {!currentUser ? (
            <AuthGate 
              onSignIn={() => openAuth('signin')} 
              onSignUp={() => openAuth('signup')} 
              viewName={currentView}
            />
          ) : (
            <>
              {currentView === 'dashboard' && <DashboardView tasks={tasks} onNavigate={setCurrentView} currentUser={currentUser} />}
              {currentView === 'analytics' && <AnalyticsView tasks={tasks} />}
              {currentView === 'members' && <MembersView onOpenAuth={openAuth} />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'profile' && <ProfileView currentUser={currentUser} onOpenAuth={openAuth} onSignOut={handleSignOut} />}
              
              {currentView === 'board' && (
            <div className="flex flex-col h-full overflow-hidden">
               {/* Filters */}
              <div className="h-14 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 px-6 flex items-center gap-4 overflow-x-auto shrink-0 scrollbar-hide transition-colors">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium mr-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter by:
                </div>

                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                >
                  <option value="">All Priorities</option>
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                >
                  <option value="">All Assignees</option>
                  {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                >
                  <option value="">All Tags</option>
                  {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {(filterAssignee || filterPriority || filterTag) && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Main Board */}
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              >
                <main className="flex-1 overflow-x-auto overflow-y-hidden">
                  <div className="h-full min-w-max p-6 flex gap-6">
                    {COLUMNS.map(col => (
                      <DroppableColumn 
                        key={col.id} 
                        id={col.id} 
                        title={col.title} 
                        color={col.color}
                        tasks={filteredTasks.filter(t => t.column === col.id)}
                        onAddTask={handleAddTask}
                        onTaskClick={handleEditTask}
                      />
                    ))}
                  </div>
                </main>
                
                {/* Drag Overlay for smooth visuals */}
                <DragOverlay dropAnimation={dropAnimation}>
                  {activeTask ? (
                    <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                      <TaskCard 
                        task={activeTask} 
                        onClick={() => {}} 
                        onDragStart={() => {}} 
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </>
      )}
    </div>
  </div>

      {/* Modals & Overlays */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveTask}
        onDelete={deleteTask}
        initialTask={editingTask}
        initialColumn={targetColumnForNewTask}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        initialMode={authModalMode}
      />


    </div>
  );
}
