/**
 * Family API Service
 * Maps to core/families endpoints. All ids are public_id UUID strings.
 *
 * Routes (confirmed from core/families/urls.py):
 *   GET    /families/                       -> FamilyListSerializer[]
 *   POST   /families/create/   {name, description}
 *   GET    /families/<id>/                  -> FamilySerializer
 *   GET    /families/<id>/members/          -> FamilyMemberSerializer[]
 *   POST   /families/join/     {invite_code, role?}
 */

import apiClient, {handleApiError, unwrapList} from './client';
import type {
  Family,
  FamilyDetail,
  FamilyMember,
} from '../../store/familyStore';

export interface CreateFamilyRequest {
  name: string;
  description?: string;
}

class FamilyService {
  /** List families the current user belongs to. */
  async getFamilies(): Promise<Family[]> {
    try {
      const response = await apiClient.get('/families/');
      return unwrapList<Family>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Lightweight list of the user's families as {public_id, name}, suitable for
   * the family switcher. Backed by GET /families/.
   */
  async listFamilies(): Promise<Array<{public_id: string; name: string}>> {
    const families = await this.getFamilies();
    return families.map((f) => ({public_id: f.public_id, name: f.name}));
  }

  /** Create a new family (creator becomes admin). */
  async createFamily(data: CreateFamilyRequest): Promise<FamilyDetail> {
    try {
      const response = await apiClient.post<FamilyDetail>(
        '/families/create/',
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Full detail for a single family. */
  async getFamily(familyId: string): Promise<FamilyDetail> {
    try {
      const response = await apiClient.get<FamilyDetail>(
        `/families/${familyId}/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Members of a family. */
  async getMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const response = await apiClient.get(
        `/families/${familyId}/members/`,
      );
      return unwrapList<FamilyMember>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Join a family using its invite code. */
  async joinFamily(inviteCode: string, role = 'other'): Promise<FamilyMember> {
    try {
      const response = await apiClient.post<FamilyMember>('/families/join/', {
        invite_code: inviteCode,
        role,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new FamilyService();
