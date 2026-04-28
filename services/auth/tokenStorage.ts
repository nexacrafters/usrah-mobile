/**
 * Secure Token Storage using expo-secure-store
 */
import * as SecureStore from 'expo-secure-store';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'usrah_access_token',
  REFRESH_TOKEN: 'usrah_refresh_token',
  USER_DATA: 'usrah_user_data',
  SESSION_ID: 'usrah_session_id',
  LAST_USED_PHONE: 'usrah_last_phone',
  BIOMETRIC_ENABLED: 'usrah_biometric_enabled',
} as const;

/**
 * Token Storage Service
 * Uses expo-secure-store for encrypted storage on device
 */
class TokenStorage {
  /**
   * Store access token
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Store refresh token
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Store both tokens at once
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
  }

  /**
   * Alias for setTokens (backwards compatibility)
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    return this.setTokens(accessToken, refreshToken);
  }

  /**
   * Get both tokens
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * Store session ID
   */
  async setSessionId(sessionId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.SESSION_ID, sessionId);
    } catch (error) {
      console.error('Failed to store session ID:', error);
    }
  }

  /**
   * Get session ID
   */
  async getSessionId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }

  /**
   * Clear all auth data (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
        SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_ID),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Alias for clearAll (backwards compatibility)
   */
  async clearTokens(): Promise<void> {
    return this.clearAll();
  }

  /**
   * Check if user has stored tokens
   */
  async hasTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }

  /**
   * Parse JWT token to get expiry (without verification)
   */
  parseTokenExpiry(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if access token is expired
   */
  async isAccessTokenExpired(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return true;

    const expiry = this.parseTokenExpiry(token);
    if (!expiry) return true;

    // Consider expired if less than 1 minute remaining
    const now = new Date();
    const buffer = 60 * 1000; // 1 minute
    return expiry.getTime() - buffer < now.getTime();
  }

  /**
   * Get time until token expires (in ms)
   */
  async getTimeUntilExpiry(): Promise<number> {
    const token = await this.getAccessToken();
    if (!token) return 0;

    const expiry = this.parseTokenExpiry(token);
    if (!expiry) return 0;

    return Math.max(0, expiry.getTime() - Date.now());
  }

  /**
   * Store last used phone number for biometric login
   */
  async setLastUsedPhone(phone: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.LAST_USED_PHONE, phone);
    } catch (error) {
      console.error('Failed to store phone:', error);
    }
  }

  /**
   * Get last used phone number
   */
  async getLastUsedPhone(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.LAST_USED_PHONE);
    } catch (error) {
      console.error('Failed to get phone:', error);
      return null;
    }
  }

  /**
   * Enable/disable biometric login
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Failed to store biometric setting:', error);
    }
  }

  /**
   * Check if biometric login is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return value === 'true';
    } catch (error) {
      console.error('Failed to get biometric setting:', error);
      return false;
    }
  }

  /**
   * Store user data for offline access
   */
  async setUserData(userData: Record<string, any>): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<Record<string, any> | null> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();

// Also export the class for testing
export { TokenStorage };
