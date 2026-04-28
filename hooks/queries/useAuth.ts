/**
 * Auth Query Hooks
 * React Query hooks for authentication
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth/authService';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { useAuthStore } from '../../store/authStore';
import { DEMO_MODE, DEMO_USER, DEMO_TOKENS, DEMO_FAMILY } from '../../services/demoMode';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { User } from '../../types/models';

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: { phone: string; password: string }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await tokenStorage.saveTokens(DEMO_TOKENS.access, DEMO_TOKENS.refresh);
        return { user: DEMO_USER, ...DEMO_TOKENS };
      }
      return authService.login(credentials.phone, credentials.password);
    },
    onSuccess: (data: any) => {
      if (DEMO_MODE) {
        setAuth(data.user, data.access, data.refresh);
      } else {
        useAuthStore.getState().setUser(data.user);
      }
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      invalidateQueries.families();
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: {
      phone: string;
      password: string;
      name: string;
      email?: string;
    }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          user: {
            ...DEMO_USER,
            full_name: data.name,
            phone: data.phone,
            email: data.email || DEMO_USER.email,
          },
        };
      }
      return authService.register(
        data.phone,
        data.password,
        data.name,
        data.email
      );
    },
  });
}

/**
 * Send OTP mutation
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (data: { phone: string; purpose?: 'register' | 'login' | 'reset_password' }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true, message: 'OTP sent (demo mode)' };
      }
      return authService.sendOtp(data.phone, data.purpose);
    },
  });
}

/**
 * Verify OTP mutation
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: { phone: string; code: string }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await tokenStorage.saveTokens(DEMO_TOKENS.access, DEMO_TOKENS.refresh);
        return { user: DEMO_USER, ...DEMO_TOKENS };
      }
      return authService.verifyOtp(data.phone, data.code);
    },
    onSuccess: (data: any) => {
      if (DEMO_MODE) {
        setAuth(data.user, data.access, data.refresh);
      } else {
        useAuthStore.getState().setUser(data.user);
      }
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      if (DEMO_MODE) {
        await tokenStorage.clearTokens();
        return { success: true };
      }
      return authService.logout();
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      // Even if API logout fails, clear local state
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (phone: string) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
      }
      return authService.requestPasswordReset(phone);
    },
  });
}

/**
 * Reset password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { phone: string; code: string; newPassword: string }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      return authService.resetPassword(data.phone, data.code, data.newPassword);
    },
  });
}

/**
 * Update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const currentUser = useAuthStore.getState().user;
        return { ...currentUser, ...data };
      }
      return authService.updateProfile(data);
    },
    onSuccess: (user: any) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.user(), user);
    },
  });
}

/**
 * Upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const currentUser = useAuthStore.getState().user;
        return { ...currentUser, avatar: imageUri };
      }
      return authService.uploadAvatar(imageUri);
    },
    onSuccess: (user: any) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.user(), user);
    },
  });
}

/**
 * Get current user query
 */
export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return { ...user, families: [DEMO_FAMILY] };
      }
      const families = await authService.getMyFamilies();
      return { ...user, families };
    },
    enabled: !!user,
    initialData: user ?? undefined,
  });
}

/**
 * Check if authenticated
 */
export function useIsAuthenticated() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated;
}

/**
 * Auth check on app start
 */
export function useAuthCheck() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuth = useAuthStore((state) => state.setAuth);

  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      setLoading(true);
      try {
        if (DEMO_MODE) {
          const tokens = await tokenStorage.getTokens();
          if (tokens?.accessToken) {
            setAuth(DEMO_USER as any, tokens.accessToken, tokens.refreshToken || '');
            return { isAuthenticated: true, user: DEMO_USER };
          }
          return { isAuthenticated: false, user: null };
        }
        const result = await authService.checkAuth();
        if (result.isAuthenticated && result.user) {
          setUser(result.user);
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    staleTime: Infinity, // Only run once per session
    retry: false,
  });
}

/**
 * Create family mutation
 */
export function useCreateFamily() {
  const queryClient = useQueryClient();
  const setFamily = useAuthStore((state) => state.setSelectedFamily);

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      sistersCircleEnabled?: boolean;
    }) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          id: `demo-family-${Date.now()}`,
          name: data.name,
          invite_code: 'DEMO123',
          members: [{ id: '1', user: DEMO_USER, role: 'admin' }],
        };
      }
      return authService.createFamily(
        data.name,
        data.description,
        data.sistersCircleEnabled
      );
    },
    onSuccess: (family: any) => {
      setFamily(family);
      invalidateQueries.families();
    },
  });
}

/**
 * Join family mutation
 */
export function useJoinFamily() {
  const queryClient = useQueryClient();
  const setFamily = useAuthStore((state) => state.setSelectedFamily);

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { family: DEMO_FAMILY, role: 'member' };
      }
      return authService.joinFamily(inviteCode);
    },
    onSuccess: (member: any) => {
      // Fetch the family details after joining
      invalidateQueries.families();
    },
  });
}
