/**
 * Authentication API Service
 * Phone-based auth. All ids are public_id UUID strings.
 * Endpoints live under /api/ (the apiClient baseURL already includes /api).
 */

import apiClient, {handleApiError} from './client';
import {ApiUser} from '../../store/authStore';

export interface RegisterRequest {
  phone: string;
  full_name: string;
  gender: 'male' | 'female';
  password: string;
  password_confirm: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface ConfirmPasswordResetRequest {
  phone: string;
  code: string;
  new_password: string;
}

/** JWT token pair returned by register/login. */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/** Shape of a successful register/login response. */
export interface AuthResponse {
  message: string;
  user: ApiUser;
  tokens: AuthTokens;
}

class AuthService {
  /**
   * Register a new user.
   * POST /auth/register/ -> 201 {message, user, tokens:{access, refresh}}
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Login with phone and password.
   * POST /auth/login/ -> 200 {message, user, tokens:{access, refresh}}
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Send an OTP code to a phone number.
   * POST /auth/otp/send/ -> {message}
   */
  async sendOTP(phone: string): Promise<{message: string}> {
    try {
      const response = await apiClient.post('/auth/otp/send/', {phone});
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify an OTP code.
   * POST /auth/otp/verify/ -> {...}
   */
  async verifyOTP(data: VerifyOTPRequest): Promise<{message?: string}> {
    try {
      const response = await apiClient.post('/auth/otp/verify/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Request a password reset code.
   * POST /auth/password/reset/ -> {message}
   */
  async requestPasswordReset(phone: string): Promise<{message: string}> {
    try {
      const response = await apiClient.post('/auth/password/reset/', {phone});
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Confirm a password reset with the OTP code and a new password.
   * POST /auth/password/reset/confirm/ -> {message}
   */
  async confirmPasswordReset(
    data: ConfirmPasswordResetRequest,
  ): Promise<{message: string}> {
    try {
      const response = await apiClient.post(
        '/auth/password/reset/confirm/',
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout. Best-effort: invalidates the refresh token on the backend.
   * POST /auth/logout/ body {refresh?}
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/');
    } catch (error) {
      // Logout should never block the user; surface to dev logs only.
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('Logout error:', error);
      }
    }
  }

  /**
   * Get the current authenticated user.
   * GET /users/me/ -> ApiUser
   */
  async getProfile(): Promise<ApiUser> {
    try {
      const response = await apiClient.get<ApiUser>('/users/me/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AuthService();
