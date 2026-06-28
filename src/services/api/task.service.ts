/**
 * Task API Service
 * Maps to core/tasks endpoints. Task ids are `id` (public_id hex UUID).
 *
 * Routes (confirmed from core/tasks/urls.py + views.py):
 *   GET    /tasks/?family_id=<id>[&status=&assigned_to=&priority=]  -> TaskListSerializer[]
 *   POST   /tasks/create/   {family_id, title, ...}                 -> TaskDetailSerializer
 *   GET    /tasks/<id>/                                             -> TaskDetailSerializer
 *   PATCH  /tasks/<id>/      (partial update)
 *   DELETE /tasks/<id>/
 *   POST   /tasks/<id>/complete/                                    -> TaskDetailSerializer
 *   POST   /tasks/<id>/assign/   {assigned_to_id}
 *   GET    /tasks/stats/?family_id=<id>                             -> TaskStats
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskStats,
} from '../../store/taskStore';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to_id?: string | null;
  category_id?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  is_private?: boolean;
  points?: number;
}

class TaskService {
  /** List tasks for the active family. Returns [] when no family is selected. */
  async getTasks(params?: {
    status?: TaskStatus;
    assigned_to?: string;
    priority?: TaskPriority;
  }): Promise<Task[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/tasks/', {
        params: {family_id: familyId, ...params},
      });
      return unwrapList<Task>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a task in the active family. */
  async createTask(data: CreateTaskRequest): Promise<Task> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<Task>('/tasks/create/', {
        family_id: familyId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Get a single task with subtasks/comments. */
  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await apiClient.get<Task>(`/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Partially update a task. */
  async updateTask(
    taskId: string,
    data: Partial<CreateTaskRequest> & {status?: TaskStatus},
  ): Promise<Task> {
    try {
      const response = await apiClient.patch<Task>(`/tasks/${taskId}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete a task. */
  async deleteTask(taskId: string): Promise<{message: string}> {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Mark a task completed (awards points server-side). */
  async completeTask(taskId: string): Promise<Task> {
    try {
      const response = await apiClient.post<Task>(`/tasks/${taskId}/complete/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Reassign a task to a family member (pass null to unassign). */
  async assignTask(taskId: string, assignedToId: string | null): Promise<Task> {
    try {
      const response = await apiClient.post<Task>(`/tasks/${taskId}/assign/`, {
        assigned_to_id: assignedToId,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Task statistics for the active family. */
  async getStats(): Promise<TaskStats | null> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return null;
    }
    try {
      const response = await apiClient.get<TaskStats>('/tasks/stats/', {
        params: {family_id: familyId},
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new TaskService();
