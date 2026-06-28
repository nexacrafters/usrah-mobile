/**
 * Family Store
 * Manages families, the active family's members and detail.
 * Shapes mirror core/families/serializers.py.
 */

import {create} from 'zustand';

/** Nested user (UserMiniSerializer). */
export interface MiniUser {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** FamilyListSerializer */
export interface Family {
  public_id: string;
  name: string;
  avatar?: string | null;
  members_count: number;
  my_role?: string | null;
}

/** FamilyMemberSerializer */
export interface FamilyMember {
  public_id: string;
  user: MiniUser;
  role: string;
  nickname?: string | null;
  is_admin: boolean;
  status: string;
  joined_at?: string | null;
  created: string;
}

/** FamilySerializer (detail) */
export interface FamilyDetail {
  public_id: string;
  name: string;
  description?: string;
  avatar?: string | null;
  cover_image?: string | null;
  invite_code: string;
  is_active: boolean;
  allow_join_requests: boolean;
  sisters_circle_enabled: boolean;
  members_count: number;
  current_member?: FamilyMember | null;
  created: string;
  updated: string;
}

interface FamilyState {
  // State
  families: Family[];
  members: FamilyMember[];
  detail: FamilyDetail | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFamilies: (families: Family[]) => void;
  setMembers: (members: FamilyMember[]) => void;
  setDetail: (detail: FamilyDetail | null) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  // Initial state
  families: [],
  members: [],
  detail: null,
  isLoading: false,
  error: null,

  // Actions
  setFamilies: (families) => set({families}),
  setMembers: (members) => set({members}),
  setDetail: (detail) => set({detail}),
  setLoading: (value) => set({isLoading: value}),
  setError: (error) => set({error}),
  reset: () =>
    set({families: [], members: [], detail: null, error: null}),
}));
