/**
 * Biometric Authentication Service
 * Wrapper for react-native-biometrics
 */

// import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

export type BiometricType = 'TouchID' | 'FaceID' | 'Biometrics';

class BiometricService {
  // private rnBiometrics = new ReactNativeBiometrics();

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<{available: boolean; biometryType: BiometricType | null}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      // const {available, biometryType} = await this.rnBiometrics.isSensorAvailable();
      // return {
      //   available,
      //   biometryType: biometryType as BiometricType,
      // };

      // Mock response for now
      return {
        available: true,
        biometryType: 'TouchID',
      };
    } catch (error) {
      console.error('Biometric availability check error:', error);
      return {available: false, biometryType: null};
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<{success: boolean}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      // const {success} = await this.rnBiometrics.simplePrompt({
      //   promptMessage,
      //   cancelButtonText: 'Cancel',
      // });
      // return {success};

      // Mock response for now
      return {success: true};
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {success: false};
    }
  }

  /**
   * Create biometric keys
   */
  async createKeys(): Promise<{publicKey: string}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      // const {publicKey} = await this.rnBiometrics.createKeys();
      // return {publicKey};

      // Mock response for now
      return {publicKey: 'mock-public-key'};
    } catch (error) {
      console.error('Biometric key creation error:', error);
      throw error;
    }
  }

  /**
   * Delete biometric keys
   */
  async deleteKeys(): Promise<{keysDeleted: boolean}> {
    try {
      // TODO: Uncomment when react-native-biometrics is installed
      // const {keysDeleted} = await this.rnBiometrics.deleteKeys();
      // return {keysDeleted};

      // Mock response for now
      return {keysDeleted: true};
    } catch (error) {
      console.error('Biometric key deletion error:', error);
      throw error;
    }
  }
}

export default new BiometricService();
