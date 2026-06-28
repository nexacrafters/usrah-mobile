/**
 * Location Service
 * Wrapper for @react-native-community/geolocation
 */

// import Geolocation from '@react-native-community/geolocation';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

class LocationService {
  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Location | null> {
    return new Promise((resolve) => {
      try {
        // TODO: Uncomment when @react-native-community/geolocation is installed
        // Geolocation.getCurrentPosition(
        //   (position) => {
        //     resolve({
        //       latitude: position.coords.latitude,
        //       longitude: position.coords.longitude,
        //       accuracy: position.coords.accuracy,
        //       altitude: position.coords.altitude || undefined,
        //       heading: position.coords.heading || undefined,
        //       speed: position.coords.speed || undefined,
        //     });
        //   },
        //   (error) => {
        //     console.error('Get location error:', error);
        //     resolve(null);
        //   },
        //   {
        //     enableHighAccuracy: true,
        //     timeout: 20000,
        //     maximumAge: 1000,
        //   },
        // );

        // Mock response for now (New York coordinates)
        resolve({
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        });
      } catch (error) {
        console.error('Get location error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Calculate Qibla direction from current location
   */
  async getQiblaDirection(): Promise<number | null> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return null;

      // Kaaba coordinates
      const kaabaLat = 21.4225;
      const kaabaLng = 39.8262;

      // Calculate angle to Kaaba
      const qiblaAngle = this.calculateBearing(
        location.latitude,
        location.longitude,
        kaabaLat,
        kaabaLng,
      );

      return qiblaAngle;
    } catch (error) {
      console.error('Calculate Qibla direction error:', error);
      return null;
    }
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;

    const dLng = toRadians(lng2 - lng1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  /**
   * Watch position changes
   */
  watchPosition(
    onSuccess: (location: Location) => void,
    onError: (error: any) => void,
  ): number {
    try {
      // TODO: Uncomment when @react-native-community/geolocation is installed
      // return Geolocation.watchPosition(
      //   (position) => {
      //     onSuccess({
      //       latitude: position.coords.latitude,
      //       longitude: position.coords.longitude,
      //       accuracy: position.coords.accuracy,
      //       altitude: position.coords.altitude || undefined,
      //       heading: position.coords.heading || undefined,
      //       speed: position.coords.speed || undefined,
      //     });
      //   },
      //   onError,
      //   {
      //     enableHighAccuracy: true,
      //     distanceFilter: 10,
      //   },
      // );

      // Mock response for now
      return 1;
    } catch (error) {
      console.error('Watch position error:', error);
      onError(error);
      return -1;
    }
  }

  /**
   * Clear position watch
   */
  clearWatch(watchId: number): void {
    try {
      // TODO: Uncomment when @react-native-community/geolocation is installed
      // Geolocation.clearWatch(watchId);

      console.log('Clear watch (mock):', watchId);
    } catch (error) {
      console.error('Clear watch error:', error);
    }
  }
}

export default new LocationService();
