/**
 * Tasks API Service
 * Handles task management, assignments, and gamification
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskLeaderboard,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreateTaskRequest {
  family_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  category?: string;
  priority?: TaskPriority;
  due_date?: string;
  reminder_at?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  points?: number;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigned_to?: string;
  category?: string;
  priority?: TaskPriority;
  due_date?: string;
  reminder_at?: string;
  status?: TaskStatus;
}

interface TaskFilters {
  family_id: string;
  status?: TaskStatus;
  assigned_to?: string;
  created_by?: string;
  priority?: TaskPriority;
  due_date_start?: string;
  due_date_end?: string;
  page?: number;
}

/**
 * Tasks API Service
 */
export const tasksApi = {
  // ==================== Tasks ====================

  /**
   * Get list of tasks
   */
  async getTasks(filters: TaskFilters): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return apiClient.get<PaginatedResponse<Task>>(
      `${ENDPOINTS.tasks.list}?${params.toString()}`
    );
  },

  /**
   * Get a single task
   */
  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(ENDPOINTS.tasks.detail(id));
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskRequest): Promise<Task> {
    return apiClient.post<Task>(ENDPOINTS.tasks.create, data);
  },

  /**
   * Update a task
   */
  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    return apiClient.patch<Task>(ENDPOINTS.tasks.detail(id), data);
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.tasks.detail(id));
  },

  /**
   * Mark task as complete
   */
  async completeTask(id: string): Promise<Task> {
    return apiClient.post<Task>(ENDPOINTS.tasks.complete(id), {});
  },

  /**
   * Mark task as incomplete
   */
  async uncompleteTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'pending' });
  },

  /**
   * Mark task as in progress
   */
  async startTask(id: string): Promise<Task> {
    return this.updateTask(id, { status: 'in_progress' });
  },

  /**
   * Assign task to a user
   */
  async assignTask(taskId: string, userId: string): Promise<Task> {
    return this.updateTask(taskId, { assigned_to: userId });
  },

  /**
   * Unassign task
   */
  async unassignTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { assigned_to: undefined });
  },

  // ==================== Gamification ====================

  /**
   * Get leaderboard
   */
  async getLeaderboard(familyId: string): Promise<TaskLeaderboard[]> {
    return apiClient.get<TaskLeaderboard[]>(
      `${ENDPOINTS.tasks.leaderboard}?family_id=${familyId}`
    );
  },

  // ==================== Filters ====================

  /**
   * Get tasks assigned to me
   */
  async getMyTasks(familyId: string, userId: string): Promise<Task[]> {
    const response = await this.getTasks({
      family_id: familyId,
      assigned_to: userId,
    });
    return response.results;
  },

  /**
   * Get tasks I created
   */
  async getCreatedByMe(familyId: string, userId: string): Promise<Task[]> {
    const response = await this.getTasks({
      family_id: familyId,
      created_by: userId,
    });
    return response.results;
  },

  /**
   * Get pending tasks
   */
  async getPendingTasks(familyId: string): Promise<Task[]> {
    const response = await this.getTasks({
      family_id: familyId,
      status: 'pending',
    });
    return response.results;
  },

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(familyId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getTasks({
      family_id: familyId,
      status: 'pending',
      due_date_end: today,
    });
    return response.results;
  },

  /**
   * Get tasks due today
   */
  async getTasksDueToday(familyId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getTasks({
      family_id: familyId,
      due_date_start: today,
      due_date_end: today,
    });
    return response.results;
  },

  /**
   * Get high priority tasks
   */
  async getHighPriorityTasks(familyId: string): Promise<Task[]> {
    const [urgent, high] = await Promise.all([
      this.getTasks({ family_id: familyId, priority: 'urgent', status: 'pending' }),
      this.getTasks({ family_id: familyId, priority: 'high', status: 'pending' }),
    ]);
    return [...urgent.results, ...high.results];
  },

  /**
   * Get my tasks (assigned to current user)
   */
  async getMyTasks(familyId: string): Promise<Task[]> {
    const response = await apiClient.get<{ results: Task[] }>(
      `${ENDPOINTS.tasks.list}?family_id=${familyId}&assigned_to=me`
    );
    return response.results;
  },

  /**
   * Get today's tasks
   */
  async getTodaysTasks(familyId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getTasks({
      family_id: familyId,
      due_date_start: today,
      due_date_end: today,
    });
    return response.results;
  },

  /**
   * Get upcoming tasks (next N days)
   */
  async getUpcomingTasks(familyId: string, days: number = 7): Promise<Task[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const response = await this.getTasks({
      family_id: familyId,
      status: 'pending',
      due_date_start: today.toISOString().split('T')[0],
      due_date_end: endDate.toISOString().split('T')[0],
    });
    return response.results;
  },

  /**
   * Get recurring tasks
   */
  async getRecurringTasks(familyId: string): Promise<Task[]> {
    const response = await apiClient.get<{ results: Task[] }>(
      `${ENDPOINTS.tasks.list}?family_id=${familyId}&is_recurring=true`
    );
    return response.results;
  },

  /**
   * Get task statistics
   */
  async getStats(familyId: string, userId?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    this_week: number;
    points_earned: number;
  }> {
    const params = new URLSearchParams({ family_id: familyId });
    if (userId) params.append('user_id', userId);

    return apiClient.get(`${ENDPOINTS.tasks.list}/stats/?${params.toString()}`);
  },

  /**
   * Add comment to task
   */
  async addComment(taskId: string, content: string): Promise<{ id: string; content: string }> {
    return apiClient.post(`${ENDPOINTS.tasks.detail(taskId)}/comments/`, { content });
  },

  /**
   * Get task comments
   */
  async getComments(taskId: string): Promise<{ id: string; content: string; user: any; created: string }[]> {
    const response = await apiClient.get<{ results: any[] }>(
      `${ENDPOINTS.tasks.detail(taskId)}/comments/`
    );
    return response.results;
  },
};
