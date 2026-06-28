/**
 * Task Store
 * Manages family tasks. Shapes mirror core/tasks/serializers.py
 * (TaskListSerializer / TaskDetailSerializer). Task ids are `id` (hex UUID).
 */

import {create} from 'zustand';
import type {MiniUser} from './familyStore';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string | null;
  completed_by?: MiniUser | null;
  order: number;
  created: string;
}

/** TaskListSerializer */
export interface Task {
  id: string;
  family: string;
  created_by: MiniUser | null;
  assigned_to: MiniUser | null;
  title: string;
  description?: string;
  category?: string | null;
  category_name?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  is_private?: boolean;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  points: number;
  subtasks_completed?: number;
  subtasks_total?: number;
  is_overdue?: boolean;
  created: string;
  updated: string;
  // Detail-only
  subtasks?: Subtask[];
}

/** TaskStatsSerializer */
export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  my_assigned: number;
  my_created: number;
  total_points: number;
  this_week_completed: number;
}

interface TaskState {
  // State
  tasks: Task[];
  stats: TaskStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setStats: (stats: TaskStats | null) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  setTasks: (tasks) => set({tasks}),

  addTask: (task) =>
    set((state) => ({tasks: [task, ...state.tasks]})),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? {...task, ...updates} : task,
      ),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  setStats: (stats) => set({stats}),
  setLoading: (value) => set({isLoading: value}),
  setError: (error) => set({error}),

  getTasksByStatus: (status) =>
    get().tasks.filter((task) => task.status === status),
}));
