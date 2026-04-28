/**
 * Authentication Service for Usrah App
 * Handles login, registration, OTP verification, and session management
 */
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';
import { tokenStorage } from './tokenStorage';
import { useAuthStore } from '../../store/authStore';
import {
  User,
  LoginResponse,
  RegisterResponse,
  OtpResponse,
  VerifyOtpResponse,
  Family,
  FamilyMember,
} from '../../types/models';

// Request interfaces
interface LoginRequest {
  phone: string;
  password: string;
}

interface RegisterRequest {
  phone: string;
  email?: string;
  full_name: string;
  password: string;
  gender: 'male' | 'female';
  prayer_method?: string;
}

interface SendOtpRequest {
  phone: string;
}

interface VerifyOtpRequest {
  phone: string;
  code: string;
}

interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

interface ResetPasswordRequest {
  phone: string;
}

interface ResetPasswordConfirmRequest {
  phone: string;
  code: string;
  new_password: string;
}

/**
 * Auth Service Class
 */
class AuthService {
  /**
   * Login with phone and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.auth.login,
      credentials,
      { skipAuth: true }
    );

    // Store tokens
    await tokenStorage.setTokens(response.tokens.access, response.tokens.refresh);

    if (response.session_id) {
      await tokenStorage.setSessionId(response.session_id);
    }

    // Update auth store
    const { setUser, setTokens, setIsLoading } = useAuthStore.getState();
    setUser(response.user);
    setTokens(response.tokens.access, response.tokens.refresh);
    setIsLoading(false);

    return response;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      ENDPOINTS.auth.register,
      data,
      { skipAuth: true }
    );

    // Store tokens
    await tokenStorage.setTokens(response.tokens.access, response.tokens.refresh);

    // Update auth store
    const { setUser, setTokens, setIsLoading } = useAuthStore.getState();
    setUser(response.user);
    setTokens(response.tokens.access, response.tokens.refresh);
    setIsLoading(false);

    return response;
  }

  /**
   * Send OTP to phone number
   */
  async sendOtp(phone: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>(
      ENDPOINTS.auth.sendOtp,
      { phone },
      { skipAuth: true }
    );
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>(
      ENDPOINTS.auth.verifyOtp,
      { phone, code },
      { skipAuth: true }
    );
  }

  /**
   * Check if phone is already registered
   */
  async checkPhone(phone: string): Promise<{ registered: boolean }> {
    return apiClient.post<{ registered: boolean }>(
      ENDPOINTS.auth.checkPhone,
      { phone },
      { skipAuth: true }
    );
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();

      if (refreshToken) {
        await apiClient.post(ENDPOINTS.auth.logout, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API result
      await tokenStorage.clearAll();
      apiClient.clearCache();

      // Reset auth store
      const { logout } = useAuthStore.getState();
      logout();
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.changePassword, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Request password reset (send OTP)
   */
  async requestPasswordReset(phone: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>(
      ENDPOINTS.auth.resetPasswordRequest,
      { phone },
      { skipAuth: true }
    );
  }

  /**
   * Confirm password reset with OTP
   */
  async confirmPasswordReset(
    phone: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post(
      ENDPOINTS.auth.resetPasswordConfirm,
      {
        phone,
        code,
        new_password: newPassword,
      },
      { skipAuth: true }
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(ENDPOINTS.users.me);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const updatedUser = await apiClient.patch<User>(ENDPOINTS.users.updateProfile, data);

    // Update store
    const { setUser } = useAuthStore.getState();
    setUser(updatedUser);

    return updatedUser;
  }

  /**
   * Get user's families
   */
  async getMyFamilies(): Promise<Family[]> {
    const response = await apiClient.get<{ results: Family[] }>(ENDPOINTS.families.list);

    // Update store with first family
    if (response.results.length > 0) {
      const { setFamily } = useAuthStore.getState();
      setFamily(response.results[0]);
    }

    return response.results;
  }

  /**
   * Get family members
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const response = await apiClient.get<{ results: FamilyMember[] }>(
      ENDPOINTS.families.members(familyId)
    );

    // Update store
    const { setFamilyMembers } = useAuthStore.getState();
    setFamilyMembers(response.results);

    return response.results;
  }

  /**
   * Create a new family
   */
  async createFamily(name: string, description?: string): Promise<Family> {
    const family = await apiClient.post<Family>(ENDPOINTS.families.create, {
      name,
      description,
    });

    // Update store
    const { setFamily } = useAuthStore.getState();
    setFamily(family);

    return family;
  }

  /**
   * Join a family with invite code
   */
  async joinFamily(inviteCode: string): Promise<FamilyMember> {
    const membership = await apiClient.post<FamilyMember>(ENDPOINTS.families.join, {
      invite_code: inviteCode,
    });

    // Fetch the family details
    const families = await this.getMyFamilies();
    if (families.length > 0) {
      const { setFamily } = useAuthStore.getState();
      setFamily(families[0]);
    }

    return membership;
  }

  /**
   * Check if user is authenticated and load profile
   */
  async checkAuth(): Promise<boolean> {
    const hasTokens = await tokenStorage.hasTokens();
    if (!hasTokens) {
      return false;
    }

    // Check if token is expired
    const isExpired = await tokenStorage.isAccessTokenExpired();
    if (isExpired) {
      // Try to refresh
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await this.logout();
        return false;
      }
    }

    try {
      // Load user profile
      const user = await this.getCurrentUser();
      const { setUser, setIsLoading } = useAuthStore.getState();
      setUser(user);
      setIsLoading(false);

      // Load families
      await this.getMyFamilies();

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<any[]> {
    return apiClient.get<any[]>(ENDPOINTS.users.sessions);
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string): Promise<void> {
    await apiClient.delete(`${ENDPOINTS.users.sessions}${sessionId}/`);
  }
}

// Export singleton instance
export const authService = new AuthService();

// Also export class for testing
export { AuthService };
