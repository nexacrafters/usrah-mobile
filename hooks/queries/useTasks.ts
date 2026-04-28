/**
 * Tasks Query Hooks
 * React Query hooks for task management
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { tasksApi } from '../../services/api/tasks';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { DEMO_MODE, DEMO_TASKS } from '../../services/demoMode';
import type { Task, TaskStatus, TaskPriority } from '../../types/models';

interface TaskFilters {
  family_id: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  created_by?: string;
  due_before?: string;
  due_after?: string;
  is_recurring?: boolean;
}

// Mutable demo tasks array
let demoTasksData = [...DEMO_TASKS];

/**
 * Get tasks with pagination
 */
export function useTasks(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        let filtered = [...demoTasksData];
        if (filters.status) {
          filtered = filtered.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
          filtered = filtered.filter(t => t.priority === filters.priority);
        }
        return {
          results: filtered,
          next: null,
          page: 1,
          count: filtered.length,
        };
      }
      return tasksApi.getTasks({ ...filters, page: pageParam });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!filters.family_id,
  });
}

/**
 * Get single task
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoTasksData.find(t => t.id === id) || null;
      }
      return tasksApi.getTask(id);
    },
    enabled: !!id,
  });
}

/**
 * Create task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
      due_date?: string;
      assigned_to?: string;
      points?: number;
      is_recurring?: boolean;
      recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
    }) => {
      if (DEMO_MODE) {
        const newTask = {
          id: `demo-task-${Date.now()}`,
          title: data.title,
          description: data.description || '',
          status: 'pending' as const,
          priority: data.priority || 'medium' as const,
          assigned_to: data.assigned_to ? { full_name: 'أحمد' } : null,
          due_date: data.due_date || null,
          points: data.points || 10,
        };
        demoTasksData.unshift(newTask as any);
        return newTask;
      }
      return tasksApi.createTask(data);
    },
    onSuccess: () => {
      invalidateQueries.tasks();
    },
  });
}

/**
 * Update task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === id);
        if (index !== -1) {
          demoTasksData[index] = { ...demoTasksData[index], ...data } as any;
          return demoTasksData[index];
        }
        return null;
      }
      return tasksApi.updateTask(id, data);
    },
    onSuccess: (task: any) => {
      if (task) {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
        invalidateQueries.tasks();
      }
    },
  });
}

/**
 * Delete task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === id);
        if (index !== -1) {
          demoTasksData.splice(index, 1);
        }
        return { success: true };
      }
      return tasksApi.deleteTask(id);
    },
    onSuccess: () => {
      invalidateQueries.tasks();
    },
  });
}

/**
 * Assign task
 */
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === taskId);
        if (index !== -1) {
          demoTasksData[index] = { ...demoTasksData[index], assigned_to: { full_name: 'أحمد' } } as any;
          return demoTasksData[index];
        }
        return null;
      }
      return tasksApi.assignTask(taskId, userId);
    },
    onSuccess: (task: any) => {
      if (task) {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
        invalidateQueries.tasks();
      }
    },
  });
}

/**
 * Unassign task
 */
export function useUnassignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === taskId);
        if (index !== -1) {
          demoTasksData[index] = { ...demoTasksData[index], assigned_to: null } as any;
          return demoTasksData[index];
        }
        return null;
      }
      return tasksApi.unassignTask(taskId);
    },
    onSuccess: (task: any) => {
      if (task) {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
        invalidateQueries.tasks();
      }
    },
  });
}

/**
 * Mark task complete
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === taskId);
        if (index !== -1) {
          demoTasksData[index] = { ...demoTasksData[index], status: 'completed' } as any;
          return demoTasksData[index];
        }
        return null;
      }
      return tasksApi.completeTask(taskId);
    },
    onSuccess: (task: any) => {
      if (task) {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
        invalidateQueries.tasks();
      }
    },
  });
}

/**
 * Mark task incomplete
 */
export function useUncompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (DEMO_MODE) {
        const index = demoTasksData.findIndex(t => t.id === taskId);
        if (index !== -1) {
          demoTasksData[index] = { ...demoTasksData[index], status: 'pending' } as any;
          return demoTasksData[index];
        }
        return null;
      }
      return tasksApi.uncompleteTask(taskId);
    },
    onSuccess: (task: any) => {
      if (task) {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
        invalidateQueries.tasks();
      }
    },
  });
}

/**
 * Get my tasks
 */
export function useMyTasks(familyId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.myTasks(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoTasksData.filter(t => t.assigned_to?.full_name === 'أحمد');
      }
      return tasksApi.getMyTasks(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get overdue tasks
 */
export function useOverdueTasks(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'overdue', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const today = new Date().toISOString().split('T')[0];
        return demoTasksData.filter(t => t.due_date && t.due_date < today && t.status !== 'completed');
      }
      return tasksApi.getOverdueTasks(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get today's tasks
 */
export function useTodaysTasks(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'today', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const today = new Date().toISOString().split('T')[0];
        return demoTasksData.filter(t => t.due_date === today);
      }
      return tasksApi.getTodaysTasks(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get upcoming tasks
 */
export function useUpcomingTasks(familyId: string, days: number = 7) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'upcoming', familyId, days],
    queryFn: async () => {
      if (DEMO_MODE) {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return demoTasksData.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate <= futureDate;
        });
      }
      return tasksApi.getUpcomingTasks(familyId, days);
    },
    enabled: !!familyId,
  });
}

/**
 * Get recurring tasks
 */
export function useRecurringTasks(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'recurring', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return tasksApi.getRecurringTasks(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get leaderboard
 */
export function useTaskLeaderboard(familyId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.leaderboard(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { user: { full_name: 'محمد', avatar: null }, points: 85, tasks_completed: 8 },
          { user: { full_name: 'فاطمة', avatar: null }, points: 70, tasks_completed: 6 },
          { user: { full_name: 'أحمد', avatar: null }, points: 45, tasks_completed: 4 },
        ];
      }
      return tasksApi.getLeaderboard(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get task statistics
 */
export function useTaskStats(familyId: string, userId?: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'stats', familyId, userId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          total: demoTasksData.length,
          completed: demoTasksData.filter(t => t.status === 'completed').length,
          pending: demoTasksData.filter(t => t.status === 'pending').length,
          in_progress: demoTasksData.filter(t => t.status === 'in_progress').length,
          points_earned: 200,
        };
      }
      return tasksApi.getStats(familyId, userId);
    },
    enabled: !!familyId,
  });
}

/**
 * Add comment to task
 */
export function useAddTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      if (DEMO_MODE) {
        return {
          id: `demo-comment-${Date.now()}`,
          content,
          created_by: { full_name: 'أحمد' },
          created_at: new Date().toISOString(),
        };
      }
      return tasksApi.addComment(taskId, content);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      });
    },
  });
}

/**
 * Get task comments
 */
export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks.detail(taskId), 'comments'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return tasksApi.getComments(taskId);
    },
    enabled: !!taskId,
  });
}

/**
 * Batch complete tasks
 */
export function useBatchCompleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      if (DEMO_MODE) {
        taskIds.forEach(id => {
          const index = demoTasksData.findIndex(t => t.id === id);
          if (index !== -1) {
            demoTasksData[index] = { ...demoTasksData[index], status: 'completed' } as any;
          }
        });
        return { success: true };
      }
      return Promise.all(taskIds.map((id) => tasksApi.completeTask(id)));
    },
    onSuccess: () => {
      invalidateQueries.tasks();
    },
  });
}

/**
 * Batch delete tasks
 */
export function useBatchDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      if (DEMO_MODE) {
        taskIds.forEach(id => {
          const index = demoTasksData.findIndex(t => t.id === id);
          if (index !== -1) {
            demoTasksData.splice(index, 1);
          }
        });
        return { success: true };
      }
      return Promise.all(taskIds.map((id) => tasksApi.deleteTask(id)));
    },
    onSuccess: () => {
      invalidateQueries.tasks();
    },
  });
}
