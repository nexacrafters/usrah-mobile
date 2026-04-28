/**
 * Families Query Hooks
 * React Query hooks for family management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familiesApi } from '../../services/api/families';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { useAuthStore } from '../../store/authStore';
import { DEMO_MODE, DEMO_FAMILY, DEMO_USER } from '../../services/demoMode';
import type { Family, FamilyMember, FamilyRole } from '../../types/models';

/**
 * Get user's families
 */
export function useFamilies() {
  return useQuery({
    queryKey: queryKeys.families.lists(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [DEMO_FAMILY];
      }
      return familiesApi.getFamilies();
    },
  });
}

/**
 * Get single family details
 */
export function useFamily(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.detail(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_FAMILY;
      }
      return familiesApi.getFamily(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get family members
 */
export function useFamilyMembers(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.members(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_FAMILY.members;
      }
      return familiesApi.getMembers(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Create family mutation
 */
export function useCreateFamily() {
  const queryClient = useQueryClient();
  const setFamily = useAuthStore((state) => state.setFamily);

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      allow_join_requests?: boolean;
      sisters_circle_enabled?: boolean;
    }) => {
      if (DEMO_MODE) {
        const newFamily = {
          id: `demo-family-${Date.now()}`,
          name: data.name,
          invite_code: 'DEMO123',
          members: [{ id: '1', user: { full_name: DEMO_USER.full_name, avatar: null }, role: 'admin' }],
        };
        return newFamily;
      }
      return familiesApi.createFamily(data);
    },
    onSuccess: (family: any) => {
      setFamily(family);
      invalidateQueries.families();
    },
  });
}

/**
 * Update family mutation
 */
export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      data,
    }: {
      familyId: string;
      data: Partial<Family>;
    }) => {
      if (DEMO_MODE) {
        return { ...DEMO_FAMILY, ...data };
      }
      return familiesApi.updateFamily(familyId, data);
    },
    onSuccess: (family: any) => {
      queryClient.setQueryData(queryKeys.families.detail(family.id), family);
      invalidateQueries.families();
    },
  });
}

/**
 * Upload family avatar
 */
export function useUploadFamilyAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, imageUri }: { familyId: string; imageUri: string }) => {
      if (DEMO_MODE) {
        return { ...DEMO_FAMILY, avatar: imageUri };
      }
      return familiesApi.uploadAvatar(familyId, imageUri);
    },
    onSuccess: (family: any) => {
      queryClient.setQueryData(queryKeys.families.detail(family.id), family);
      invalidateQueries.families();
    },
  });
}

/**
 * Upload family cover
 */
export function useUploadFamilyCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, imageUri }: { familyId: string; imageUri: string }) => {
      if (DEMO_MODE) {
        return { ...DEMO_FAMILY, cover: imageUri };
      }
      return familiesApi.uploadCover(familyId, imageUri);
    },
    onSuccess: (family: any) => {
      queryClient.setQueryData(queryKeys.families.detail(family.id), family);
    },
  });
}

/**
 * Join family with invite code
 */
export function useJoinFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (DEMO_MODE) {
        return DEMO_FAMILY;
      }
      return familiesApi.joinFamily(inviteCode);
    },
    onSuccess: () => {
      invalidateQueries.families();
    },
  });
}

/**
 * Regenerate invite code
 */
export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (familyId: string) => {
      if (DEMO_MODE) {
        return { invite_code: 'NEW123' };
      }
      return familiesApi.regenerateInviteCode(familyId);
    },
    onSuccess: (_, familyId) => {
      invalidateQueries.family(familyId);
    },
  });
}

/**
 * Update member role
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      data,
    }: {
      familyId: string;
      memberId: string;
      data: { role?: FamilyRole; nickname?: string; is_admin?: boolean };
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.updateMember(familyId, memberId, data);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(familyId),
      });
    },
  });
}

/**
 * Remove member
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.removeMember(familyId, memberId);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(familyId),
      });
    },
  });
}

/**
 * Make member admin
 */
export function useMakeAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.makeAdmin(familyId, memberId);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(familyId),
      });
    },
  });
}

/**
 * Remove admin privileges
 */
export function useRemoveAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.removeAdmin(familyId, memberId);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(familyId),
      });
    },
  });
}

/**
 * Leave family
 */
export function useLeaveFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.leaveFamily(familyId, memberId);
    },
    onSuccess: () => {
      invalidateQueries.families();
    },
  });
}

/**
 * Send invitation
 */
export function useSendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      data,
    }: {
      familyId: string;
      data: {
        phone?: string;
        user_id?: string;
        suggested_role: FamilyRole;
        message?: string;
      };
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-inv-${Date.now()}`, ...data };
      }
      return familiesApi.sendInvitation(familyId, data);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.invitations(familyId),
      });
    },
  });
}

/**
 * Get sent invitations (admin)
 */
export function useSentInvitations(familyId: string) {
  return useQuery({
    queryKey: queryKeys.families.invitations(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return familiesApi.getSentInvitations(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get my invitations
 */
export function useMyInvitations() {
  return useQuery({
    queryKey: queryKeys.families.myInvitations(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return familiesApi.getMyInvitations();
    },
  });
}

/**
 * Accept invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.acceptInvitation(invitationId);
    },
    onSuccess: () => {
      invalidateQueries.families();
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.myInvitations(),
      });
    },
  });
}

/**
 * Decline invitation
 */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.declineInvitation(invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.myInvitations(),
      });
    },
  });
}

/**
 * Request to join family
 */
export function useRequestToJoin() {
  return useMutation({
    mutationFn: async ({ inviteCode, message }: { inviteCode: string; message?: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.requestToJoin(inviteCode, message);
    },
  });
}

/**
 * Get join requests (admin)
 */
export function useJoinRequests(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.families.detail(familyId), 'join-requests'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return familiesApi.getJoinRequests(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Approve join request
 */
export function useApproveJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      requestId,
      role,
    }: {
      familyId: string;
      requestId: string;
      role?: FamilyRole;
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.approveJoinRequest(familyId, requestId, role);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.families.members(familyId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.families.detail(familyId), 'join-requests'],
      });
    },
  });
}

/**
 * Reject join request
 */
export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, requestId }: { familyId: string; requestId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return familiesApi.rejectJoinRequest(familyId, requestId);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.families.detail(familyId), 'join-requests'],
      });
    },
  });
}

/**
 * Get female members (for Sisters Circle)
 */
export function useFemaleMembers(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.families.members(familyId), 'female'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_FAMILY.members.filter(m =>
          m.user.full_name.includes('فاطمة') || m.user.full_name.includes('أم')
        );
      }
      return familiesApi.getFemaleMembers(familyId);
    },
    enabled: !!familyId,
  });
}
