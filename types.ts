export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum ColumnType {
  Todo = 'todo',
  InProgress = 'in-progress',
  Review = 'review',
  Done = 'done'
}

export type UserRole = 'Admin' | 'User';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  created_at?: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  column: ColumnType;
  priority: Priority;
  tags: string[];
  assignee?: string;
  storyPoints?: number;
  createdAt: number;
  dueDate?: number;
  comments?: Comment[];
  imageUrl?: string;
}

export interface DragItem {
  id: string;
  column: ColumnType;
}