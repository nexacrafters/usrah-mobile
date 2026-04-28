/**
 * Family Goals Query Hooks
 * React Query hooks for goals features
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsApi, FamilyGoal, GoalCategory, GoalContribution } from '../../services/api/goals';

const goalsKeys = {
  all: ['goals'] as const,
  lists: () => [...goalsKeys.all, 'list'] as const,
  list: (familyId: string, status?: string) => [...goalsKeys.lists(), familyId, status] as const,
  detail: (id: string) => [...goalsKeys.all, 'detail', id] as const,
  contributions: (goalId: string) => [...goalsKeys.all, 'contributions', goalId] as const,
};

/**
 * Get family goals
 */
export function useGoals(familyId: string, status?: 'active' | 'completed' | 'all') {
  return useQuery({
    queryKey: goalsKeys.list(familyId, status),
    queryFn: () => goalsApi.getGoals(familyId, status),
    enabled: !!familyId,
  });
}

/**
 * Get single goal
 */
export function useGoal(id: string) {
  return useQuery({
    queryKey: goalsKeys.detail(id),
    queryFn: () => goalsApi.getGoal(id),
    enabled: !!id,
  });
}

/**
 * Create goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      family_id: string;
      title: string;
      description?: string;
      target_amount: number;
      currency?: string;
      category: GoalCategory;
      deadline?: string;
    }) => goalsApi.createGoal(data),
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Update goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        title: string;
        description?: string;
        target_amount: number;
        category: GoalCategory;
        deadline?: string;
      }>;
    }) => goalsApi.updateGoal(id, data),
    onSuccess: (goal) => {
      queryClient.setQueryData(goalsKeys.detail(goal.id), goal);
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Delete goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Pause goal
 */
export function usePauseGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsApi.pauseGoal(id),
    onSuccess: (goal) => {
      queryClient.setQueryData(goalsKeys.detail(goal.id), goal);
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Resume goal
 */
export function useResumeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsApi.resumeGoal(id),
    onSuccess: (goal) => {
      queryClient.setQueryData(goalsKeys.detail(goal.id), goal);
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Get goal contributions
 */
export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey: goalsKeys.contributions(goalId),
    queryFn: () => goalsApi.getContributions(goalId),
    enabled: !!goalId,
  });
}

/**
 * Add contribution
 */
export function useContribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      note,
    }: {
      goalId: string;
      amount: number;
      note?: string;
    }) => goalsApi.contribute(goalId, { amount, note }),
    onSuccess: (contribution, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.contributions(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
    },
  });
}

/**
 * Add milestone
 */
export function useAddMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      title,
      amount,
    }: {
      goalId: string;
      title: string;
      amount: number;
    }) => goalsApi.addMilestone(goalId, title, amount),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
    },
  });
}

/**
 * Export helper functions
 */
export { goalsApi };
