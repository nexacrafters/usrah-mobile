import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, Family, FamilyMember } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  family: Family | null;
  familyMembers: FamilyMember[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setFamily: (family: Family | null) => void;
  setSelectedFamily: (family: Family | null) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  setLoading: (loading: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  logout: () => void;
  reset: () => void;
}

// Custom storage adapter for Expo SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  family: null,
  familyMembers: [],
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (token, refreshToken) =>
        set({
          token,
          refreshToken,
          isAuthenticated: !!token,
        }),

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      setFamily: (family) => set({ family }),

      setSelectedFamily: (family) => set({ family }),

      setFamilyMembers: (familyMembers) => set({ familyMembers }),

      setLoading: (isLoading) => set({ isLoading }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          family: null,
          familyMembers: [],
          isAuthenticated: false,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isOnboarded: state.isOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        // Set isLoading to false after hydration completes
        if (state) {
          state.setIsLoading(false);
        }
      },
    }
  )
);
