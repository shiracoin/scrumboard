import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppUser, UserRole, Task, ColumnType, Priority, Comment } from '../types';

const STORAGE_KEY_URL = 'sb_project_url';
const STORAGE_KEY_KEY = 'sb_anon_key';
const STORAGE_KEY_USER = 'sb_active_user';
const STORAGE_KEY_LOCAL_USERS = 'sb_local_users_backup';
const STORAGE_KEY_LOCAL_TASKS = 'sb_local_tasks_backup';
const STORAGE_KEY_FORCE_LOCAL = 'sb_force_local_mode';

export const SUPABASE_USERS_SQL = `-- Run this in your Supabase SQL Editor to create the USERS table:
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
`;

export const SUPABASE_TASKS_SQL = `-- Run this in your Supabase SQL Editor to create the TASKS table:
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "column" TEXT NOT NULL DEFAULT 'todo' CHECK ("column" IN ('todo', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  tags TEXT[] DEFAULT '{}',
  assignee TEXT,
  story_points INTEGER DEFAULT 0,
  due_date BIGINT,
  image_url TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);

-- Enable Realtime updates for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
`;

export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- FULL SUPABASE DATABASE SCHEMA (Users + Tasks)
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "column" TEXT NOT NULL DEFAULT 'todo' CHECK ("column" IN ('todo', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  tags TEXT[] DEFAULT '{}',
  assignee TEXT,
  story_points INTEGER DEFAULT 0,
  due_date BIGINT,
  image_url TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);

-- Enable Realtime updates for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
`;

export function isMissingUsersTableError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || '';
  return (
    msg.includes("Could not find the table 'public.users'") ||
    msg.includes("Could not find the table 'users'") ||
    msg.includes('relation "public.users" does not exist') ||
    msg.includes('relation "users" does not exist') ||
    error.code === 'PGRST204' ||
    error.code === '42P01'
  );
}

export function isMissingTasksTableError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || '';
  return (
    msg.includes("Could not find the table 'public.tasks'") ||
    msg.includes("Could not find the table 'tasks'") ||
    msg.includes('relation "public.tasks" does not exist') ||
    msg.includes('relation "tasks" does not exist') ||
    error.code === 'PGRST204' ||
    error.code === '42P01'
  );
}

export function getStoredSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    localStorage.removeItem(STORAGE_KEY_FORCE_LOCAL);
    _cachedClient = null;
  }
}

export function setForceLocalMode(force: boolean) {
  if (typeof window !== 'undefined') {
    if (force) {
      localStorage.setItem(STORAGE_KEY_FORCE_LOCAL, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_FORCE_LOCAL);
    }
  }
}

export function isForceLocalMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_FORCE_LOCAL) === 'true';
}

let _cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (isForceLocalMode()) return null;
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key) return null;

  if (!_cachedClient) {
    try {
      _cachedClient = createClient(url, key);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return _cachedClient;
}

export function isSupabaseConfigured(): boolean {
  if (isForceLocalMode()) return false;
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key);
}

// Local storage for users (no mock users)
function getLocalUsers(): AppUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveLocalUsers(users: AppUser[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
  }
}

// Local storage for tasks (no mock tasks)
export function getLocalTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_LOCAL_TASKS);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export function saveLocalTasks(tasks: Task[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOCAL_TASKS, JSON.stringify(tasks));
  }
}

export function getActiveUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveUser(user: AppUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}

// --- USER AUTHENTICATION ---

export async function signUpUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<AppUser> {
  const emailClean = params.email.trim().toLowerCase();
  const nameClean = params.name.trim();
  const role = params.role || 'User';

  const supabase = getSupabase();

  if (supabase) {
    // 1. Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', emailClean)
      .maybeSingle();

    if (checkError) {
      if (isMissingUsersTableError(checkError)) {
        throw new Error("Could not find the table 'public.users' in your Supabase project. Please run the SQL schema in your Supabase SQL Editor.");
      }
      throw new Error(checkError.message || 'Error checking existing user in Supabase');
    }

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    // 2. Insert into Supabase `users` table
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: nameClean,
          email: emailClean,
          password: params.password,
          role: role,
        },
      ])
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      if (isMissingUsersTableError(error)) {
        throw new Error("Could not find the table 'public.users' in your Supabase project. Please run the SQL schema in your Supabase SQL Editor.");
      }
      console.error('Supabase signup error:', error);
      throw new Error(error.message || 'Failed to sign up user in Supabase');
    }

    const createdUser: AppUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      created_at: data.created_at,
    };

    setActiveUser(createdUser);
    return createdUser;
  } else {
    // Local fallback store
    const localUsers = getLocalUsers();
    if (localUsers.some(u => u.email.toLowerCase() === emailClean)) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: AppUser = {
      id: `usr_${Date.now()}`,
      name: nameClean,
      email: emailClean,
      password: params.password,
      role: role,
      created_at: new Date().toISOString(),
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);
    setActiveUser(newUser);
    return newUser;
  }
}

export async function signInUser(params: {
  email: string;
  password: string;
}): Promise<AppUser> {
  const emailClean = params.email.trim().toLowerCase();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, password, role, created_at')
      .eq('email', emailClean)
      .maybeSingle();

    if (error) {
      if (isMissingUsersTableError(error)) {
        throw new Error("Could not find the table 'public.users' in your Supabase project. Please run the SQL schema in your Supabase SQL Editor.");
      }
      console.error('Supabase signin error:', error);
      throw new Error(error.message || 'Error checking user credentials');
    }

    if (!data) {
      throw new Error('No user found with this email address.');
    }

    if (data.password !== params.password) {
      throw new Error('Incorrect password. Please try again.');
    }

    const user: AppUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      created_at: data.created_at,
    };

    setActiveUser(user);
    return user;
  } else {
    // Local fallback store
    const localUsers = getLocalUsers();
    const user = localUsers.find(
      u => u.email.toLowerCase() === emailClean && u.password === params.password
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    setActiveUser(user);
    return user;
  }
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as AppUser[];
      }
    } catch {}
  }
  return getLocalUsers();
}

// --- TASK MAPPING & CRUD (SUPABASE MIGRATION) ---

export function rowToTask(row: any): Task {
  let comments: Comment[] = [];
  if (Array.isArray(row.comments)) {
    comments = row.comments;
  } else if (typeof row.comments === 'string') {
    try {
      comments = JSON.parse(row.comments);
    } catch {}
  }

  let tags: string[] = [];
  if (Array.isArray(row.tags)) {
    tags = row.tags;
  } else if (typeof row.tags === 'string') {
    tags = row.tags
      .replace(/[{}]/g, '')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  let createdAt = Date.now();
  if (row.created_at) {
    if (typeof row.created_at === 'number') {
      createdAt = row.created_at;
    } else {
      const parsed = new Date(row.created_at).getTime();
      if (!isNaN(parsed)) createdAt = parsed;
    }
  } else if (row.createdAt) {
    createdAt = Number(row.createdAt);
  }

  return {
    id: String(row.id),
    title: row.title || 'Untitled',
    description: row.description || '',
    column: (row.column || row.column_type || ColumnType.Todo) as ColumnType,
    priority: (row.priority || Priority.Medium) as Priority,
    tags: tags,
    assignee: row.assignee || undefined,
    storyPoints: Number(row.story_points ?? row.storyPoints ?? 0),
    dueDate: row.due_date ? Number(row.due_date) : (row.dueDate ? Number(row.dueDate) : undefined),
    imageUrl: row.image_url || row.imageUrl || undefined,
    comments: comments,
    createdAt: createdAt,
  };
}

export function taskToRow(task: Partial<Task>): Record<string, any> {
  const row: Record<string, any> = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.column !== undefined) row.column = task.column;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.tags !== undefined) row.tags = task.tags;
  if (task.assignee !== undefined) row.assignee = task.assignee || null;
  if (task.storyPoints !== undefined) row.story_points = task.storyPoints;
  if (task.dueDate !== undefined) row.due_date = task.dueDate || null;
  if (task.imageUrl !== undefined) row.image_url = task.imageUrl || null;
  if (task.comments !== undefined) row.comments = task.comments;
  if (task.createdAt !== undefined) row.created_at = task.createdAt;
  return row;
}

export async function fetchTasksFromSupabase(): Promise<{
  tasks: Task[];
  error?: string;
  isMissingTable?: boolean;
}> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTasksTableError(error)) {
          console.warn("Table 'public.tasks' does not exist in Supabase.");
          return {
            tasks: getLocalTasks(),
            error: "Could not find the table 'public.tasks' in Supabase.",
            isMissingTable: true,
          };
        }
        console.error('Supabase fetch tasks error:', error);
        return { tasks: getLocalTasks(), error: error.message };
      }

      if (data) {
        const loadedTasks = data.map(rowToTask);
        saveLocalTasks(loadedTasks);
        return { tasks: loadedTasks };
      }
    } catch (err: any) {
      console.error('Error fetching tasks from Supabase:', err);
      return { tasks: getLocalTasks(), error: err.message };
    }
  }
  return { tasks: getLocalTasks() };
}

export async function createTaskInSupabase(task: Task): Promise<Task> {
  const supabase = getSupabase();
  if (supabase) {
    const row = taskToRow(task);
    const { data, error } = await supabase
      .from('tasks')
      .insert([row])
      .select('*')
      .single();

    if (error) {
      if (isMissingTasksTableError(error)) {
        const local = getLocalTasks();
        local.unshift(task);
        saveLocalTasks(local);
        throw new Error("Could not find the table 'public.tasks' in your Supabase project. Please run the SQL schema in your Supabase SQL Editor.");
      }
      throw new Error(error.message || 'Failed to create task in Supabase');
    }

    const created = rowToTask(data);
    const local = getLocalTasks();
    const existingIndex = local.findIndex(t => t.id === created.id);
    if (existingIndex >= 0) {
      local[existingIndex] = created;
    } else {
      local.unshift(created);
    }
    saveLocalTasks(local);
    return created;
  } else {
    const local = getLocalTasks();
    local.unshift(task);
    saveLocalTasks(local);
    return task;
  }
}

export async function updateTaskInSupabase(id: string, updates: Partial<Task>): Promise<Task | null> {
  const supabase = getSupabase();
  if (supabase) {
    const row = taskToRow(updates);
    delete row.id;

    const { data, error } = await supabase
      .from('tasks')
      .update(row)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isMissingTasksTableError(error)) {
        const local = getLocalTasks();
        const idx = local.findIndex(t => t.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...updates };
          saveLocalTasks(local);
          return local[idx];
        }
        throw new Error("Could not find the table 'public.tasks' in Supabase.");
      }
      throw new Error(error.message || 'Failed to update task in Supabase');
    }

    if (data) {
      const updated = rowToTask(data);
      const local = getLocalTasks();
      const idx = local.findIndex(t => t.id === id);
      if (idx >= 0) local[idx] = updated;
      saveLocalTasks(local);
      return updated;
    }
  }

  // Local fallback
  const local = getLocalTasks();
  const idx = local.findIndex(t => t.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...updates };
    saveLocalTasks(local);
    return local[idx];
  }
  return null;
}

export async function deleteTaskInSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error && !isMissingTasksTableError(error)) {
      throw new Error(error.message || 'Failed to delete task in Supabase');
    }
  }

  const local = getLocalTasks().filter(t => t.id !== id);
  saveLocalTasks(local);
  return true;
}

export function subscribeToTasks(callback: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.error('Error subscribing to Supabase tasks channel:', err);
    return () => {};
  }
}
