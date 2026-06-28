/**
 * Authentication Store
 * Holds the authenticated user, JWT access/refresh tokens and the
 * currently-active family (every family-scoped API call needs its public_id).
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Shape returned by the API UserSerializer. */
export interface ApiUser {
  public_id: string;
  phone: string;
  email?: string;
  full_name: string;
  gender?: 'male' | 'female';
  avatar?: string | null;
  bio?: string;
  prayer_method?: string;
  timezone?: string;
  is_verified?: boolean;
}

interface AuthState {
  // State
  user: ApiUser | null;
  token: string | null; // JWT access token
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;

  // Active family context (needed by expenses, tasks, calendar, etc.)
  currentFamilyId: string | null;
  currentFamilyName: string | null;

  // Actions
  setUser: (user: ApiUser) => void;
  setToken: (token: string) => void;
  /** Persist a full successful auth result. */
  login: (user: ApiUser, access: string, refresh: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<ApiUser>) => void;
  setCurrentFamily: (id: string | null, name?: string | null) => void;
  setHasSeenOnboarding: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasSeenOnboarding: false,
      currentFamilyId: null,
      currentFamilyName: null,

      // Actions
      setUser: (user) => set({user}),

      setToken: (token) => set({token}),

      login: (user, access, refresh) =>
        set({
          user,
          token: access,
          refreshToken: refresh,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          currentFamilyId: null,
          currentFamilyName: null,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? {...state.user, ...updates} : null,
        })),

      setCurrentFamily: (id, name = null) =>
        set({currentFamilyId: id, currentFamilyName: name}),

      setHasSeenOnboarding: (value) => set({hasSeenOnboarding: value}),

      setLoading: (value) => set({isLoading: value}),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        hasSeenOnboarding: state.hasSeenOnboarding,
        currentFamilyId: state.currentFamilyId,
        currentFamilyName: state.currentFamilyName,
      }),
    },
  ),
);

/** Convenience accessor used by services outside React components. */
export const getCurrentFamilyId = (): string | null =>
  useAuthStore.getState().currentFamilyId;
