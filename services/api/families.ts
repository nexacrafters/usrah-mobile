/**
 * Families API Service
 * Handles family management, members, and invitations
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Family,
  FamilyMember,
  FamilyInvitation,
  JoinRequest,
  FamilyRole,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreateFamilyRequest {
  name: string;
  description?: string;
  allow_join_requests?: boolean;
  sisters_circle_enabled?: boolean;
}

interface UpdateFamilyRequest {
  name?: string;
  description?: string;
  allow_join_requests?: boolean;
  sisters_circle_enabled?: boolean;
}

interface JoinFamilyRequest {
  invite_code: string;
}

interface InviteMemberRequest {
  phone?: string;
  user_id?: string;
  suggested_role: FamilyRole;
  message?: string;
}

interface UpdateMemberRequest {
  role?: FamilyRole;
  nickname?: string;
  is_admin?: boolean;
}

/**
 * Families API Service
 */
export const familiesApi = {
  // ==================== Families ====================

  /**
   * Get list of user's families
   */
  async getFamilies(): Promise<Family[]> {
    const response = await apiClient.get<PaginatedResponse<Family> | Family[]>(
      ENDPOINTS.families.list
    );

    if (Array.isArray(response)) {
      return response;
    }
    return response.results;
  },

  /**
   * Get a single family
   */
  async getFamily(id: string): Promise<Family> {
    return apiClient.get<Family>(ENDPOINTS.families.detail(id));
  },

  /**
   * Create a new family
   */
  async createFamily(data: CreateFamilyRequest): Promise<Family> {
    return apiClient.post<Family>(ENDPOINTS.families.create, data);
  },

  /**
   * Update family settings
   */
  async updateFamily(id: string, data: UpdateFamilyRequest): Promise<Family> {
    return apiClient.patch<Family>(ENDPOINTS.families.detail(id), data);
  },

  /**
   * Upload family avatar
   */
  async uploadAvatar(familyId: string, imageUri: string): Promise<Family> {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    return apiClient.uploadFile<Family>(ENDPOINTS.families.detail(familyId), formData);
  },

  /**
   * Upload family cover image
   */
  async uploadCover(familyId: string, imageUri: string): Promise<Family> {
    const formData = new FormData();
    formData.append('cover_image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    } as any);

    return apiClient.uploadFile<Family>(ENDPOINTS.families.detail(familyId), formData);
  },

  /**
   * Join a family with invite code
   */
  async joinFamily(inviteCode: string): Promise<FamilyMember> {
    return apiClient.post<FamilyMember>(ENDPOINTS.families.join, {
      invite_code: inviteCode,
    });
  },

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(familyId: string): Promise<{ invite_code: string }> {
    return apiClient.post<{ invite_code: string }>(
      `${ENDPOINTS.families.detail(familyId)}regenerate-code/`,
      {}
    );
  },

  // ==================== Members ====================

  /**
   * Get family members
   */
  async getMembers(familyId: string): Promise<FamilyMember[]> {
    const response = await apiClient.get<PaginatedResponse<FamilyMember> | FamilyMember[]>(
      ENDPOINTS.families.members(familyId)
    );

    if (Array.isArray(response)) {
      return response;
    }
    return response.results;
  },

  /**
   * Update a member's role or settings
   */
  async updateMember(
    familyId: string,
    memberId: string,
    data: UpdateMemberRequest
  ): Promise<FamilyMember> {
    return apiClient.patch<FamilyMember>(
      `${ENDPOINTS.families.members(familyId)}${memberId}/`,
      data
    );
  },

  /**
   * Remove a member from family
   */
  async removeMember(familyId: string, memberId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.families.members(familyId)}${memberId}/`);
  },

  /**
   * Make a member admin
   */
  async makeAdmin(familyId: string, memberId: string): Promise<FamilyMember> {
    return this.updateMember(familyId, memberId, { is_admin: true });
  },

  /**
   * Remove admin privileges
   */
  async removeAdmin(familyId: string, memberId: string): Promise<FamilyMember> {
    return this.updateMember(familyId, memberId, { is_admin: false });
  },

  /**
   * Leave a family
   */
  async leaveFamily(familyId: string, memberId: string): Promise<void> {
    return this.removeMember(familyId, memberId);
  },

  // ==================== Invitations ====================

  /**
   * Send an invitation
   */
  async sendInvitation(familyId: string, data: InviteMemberRequest): Promise<FamilyInvitation> {
    return apiClient.post<FamilyInvitation>(ENDPOINTS.families.invite(familyId), data);
  },

  /**
   * Get pending invitations for family (admin)
   */
  async getSentInvitations(familyId: string): Promise<FamilyInvitation[]> {
    const response = await apiClient.get<{ results: FamilyInvitation[] }>(
      `${ENDPOINTS.families.invite(familyId)}sent/`
    );
    return response.results;
  },

  /**
   * Get my received invitations
   */
  async getMyInvitations(): Promise<FamilyInvitation[]> {
    const response = await apiClient.get<{ results: FamilyInvitation[] }>(
      ENDPOINTS.families.invitations
    );
    return response.results;
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string): Promise<FamilyMember> {
    return apiClient.post<FamilyMember>(
      `${ENDPOINTS.families.invitations}${invitationId}/accept/`,
      {}
    );
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    return apiClient.post(`${ENDPOINTS.families.invitations}${invitationId}/decline/`, {});
  },

  /**
   * Cancel a sent invitation
   */
  async cancelInvitation(familyId: string, invitationId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.families.invite(familyId)}${invitationId}/`);
  },

  // ==================== Join Requests ====================

  /**
   * Request to join a family
   */
  async requestToJoin(inviteCode: string, message?: string): Promise<JoinRequest> {
    return apiClient.post<JoinRequest>(`${ENDPOINTS.families.join}request/`, {
      invite_code: inviteCode,
      message,
    });
  },

  /**
   * Get join requests (admin)
   */
  async getJoinRequests(familyId: string): Promise<JoinRequest[]> {
    const response = await apiClient.get<{ results: JoinRequest[] }>(
      `${ENDPOINTS.families.detail(familyId)}join-requests/`
    );
    return response.results;
  },

  /**
   * Approve a join request
   */
  async approveJoinRequest(
    familyId: string,
    requestId: string,
    role?: FamilyRole
  ): Promise<FamilyMember> {
    return apiClient.post<FamilyMember>(
      `${ENDPOINTS.families.detail(familyId)}join-requests/${requestId}/approve/`,
      { role }
    );
  },

  /**
   * Reject a join request
   */
  async rejectJoinRequest(familyId: string, requestId: string): Promise<void> {
    return apiClient.post(
      `${ENDPOINTS.families.detail(familyId)}join-requests/${requestId}/reject/`,
      {}
    );
  },

  // ==================== Helpers ====================

  /**
   * Check if user is admin of a family
   */
  async isAdmin(familyId: string, userId: string): Promise<boolean> {
    const members = await this.getMembers(familyId);
    const member = members.find(
      (m) => m.user.id === userId || m.user.public_id === userId
    );
    return member?.is_admin || false;
  },

  /**
   * Get female members (for Sisters Circle)
   */
  async getFemaleMembers(familyId: string): Promise<FamilyMember[]> {
    const members = await this.getMembers(familyId);
    return members.filter((m) => m.user.gender === 'female');
  },
};
