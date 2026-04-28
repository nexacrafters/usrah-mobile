/**
 * Islamic Features API Service
 * Handles prayer times, adhkar, Quran, and Islamic calendar
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  PrayerTimes,
  PrayerMethod,
  Adhkar,
  DailyVerse,
  IslamicDate,
} from '../../types/models';

// Prayer time calculation using adhan.js-style algorithm
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CalculationMethod {
  name: PrayerMethod;
  fajrAngle: number;
  ishaAngle: number;
}

const CALCULATION_METHODS: Record<PrayerMethod, CalculationMethod> = {
  MWL: { name: 'MWL', fajrAngle: 18, ishaAngle: 17 },
  ISNA: { name: 'ISNA', fajrAngle: 15, ishaAngle: 15 },
  Egypt: { name: 'Egypt', fajrAngle: 19.5, ishaAngle: 17.5 },
  Makkah: { name: 'Makkah', fajrAngle: 18.5, ishaAngle: 90 }, // 90 min after maghrib
  Karachi: { name: 'Karachi', fajrAngle: 18, ishaAngle: 18 },
  Tehran: { name: 'Tehran', fajrAngle: 17.7, ishaAngle: 14 },
  Jafari: { name: 'Jafari', fajrAngle: 16, ishaAngle: 14 },
};

/**
 * Islamic Features API Service
 */
export const islamicApi = {
  // ==================== Prayer Times ====================

  /**
   * Get prayer times from API
   */
  async getPrayerTimes(
    latitude: number,
    longitude: number,
    method: PrayerMethod = 'MWL',
    date?: string
  ): Promise<PrayerTimes> {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      method,
      date: date || new Date().toISOString().split('T')[0],
    });

    return apiClient.get<PrayerTimes>(
      `${ENDPOINTS.islamic.prayerTimes}?${params.toString()}`,
      { cache: true }
    );
  },

  /**
   * Calculate prayer times locally (fallback)
   * Uses simplified algorithm - for production use adhan.js
   */
  calculatePrayerTimesLocal(
    coords: Coordinates,
    date: Date,
    method: PrayerMethod = 'MWL'
  ): Omit<PrayerTimes, 'hijri_date' | 'location'> {
    // This is a simplified calculation
    // For production, use a library like adhan.js
    const calcMethod = CALCULATION_METHODS[method];

    // Get timezone offset in hours
    const tzOffset = -date.getTimezoneOffset() / 60;

    // Calculate solar noon (simplified)
    const jd = this._getJulianDate(date);
    const solarNoon = 12 - tzOffset;

    // Simplified prayer times (approximate)
    const fajr = this._formatTime(solarNoon - 6);
    const sunrise = this._formatTime(solarNoon - 5);
    const dhuhr = this._formatTime(solarNoon + 0.1);
    const asr = this._formatTime(solarNoon + 3.5);
    const maghrib = this._formatTime(solarNoon + 5);
    const isha = this._formatTime(solarNoon + 6.5);

    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      date: date.toISOString().split('T')[0],
      method,
    };
  },

  _getJulianDate(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (month <= 2) {
      return Math.floor(365.25 * (year - 1)) +
        Math.floor(30.6001 * (month + 13)) +
        day + 1720995;
    }
    return Math.floor(365.25 * year) +
      Math.floor(30.6001 * (month + 1)) +
      day + 1720995;
  },

  _formatTime(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },

  // ==================== Adhkar ====================

  /**
   * Get adhkar by category
   */
  async getAdhkar(category: 'morning' | 'evening' | 'sleep' | 'prayer' | 'travel'): Promise<Adhkar[]> {
    const response = await apiClient.get<{ results: Adhkar[] }>(
      `${ENDPOINTS.islamic.adhkar}?category=${category}`,
      { cache: true }
    );
    return response.results;
  },

  /**
   * Get all adhkar categories
   */
  async getAllAdhkar(): Promise<Record<string, Adhkar[]>> {
    const categories = ['morning', 'evening', 'sleep', 'prayer', 'travel'] as const;
    const results: Record<string, Adhkar[]> = {};

    for (const category of categories) {
      results[category] = await this.getAdhkar(category);
    }

    return results;
  },

  // ==================== Quran ====================

  /**
   * Get daily verse
   */
  async getDailyVerse(): Promise<DailyVerse> {
    return apiClient.get<DailyVerse>(ENDPOINTS.islamic.dailyVerse, { cache: true });
  },

  /**
   * Get verse by reference
   */
  async getVerse(surah: number, ayah: number): Promise<DailyVerse> {
    return apiClient.get<DailyVerse>(
      `${ENDPOINTS.islamic.dailyVerse}?surah=${surah}&ayah=${ayah}`,
      { cache: true }
    );
  },

  // ==================== Islamic Calendar ====================

  /**
   * Get Islamic dates
   */
  async getIslamicDates(
    startDate?: string,
    endDate?: string
  ): Promise<IslamicDate[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const response = await apiClient.get<{ results: IslamicDate[] }>(
      `${ENDPOINTS.islamic.islamicDates}${queryString ? `?${queryString}` : ''}`,
      { cache: true }
    );
    return response.results;
  },

  /**
   * Get today's Islamic date
   */
  async getTodayIslamicDate(): Promise<IslamicDate> {
    const today = new Date().toISOString().split('T')[0];
    const dates = await this.getIslamicDates(today, today);
    return dates[0];
  },

  /**
   * Convert Gregorian to Hijri (local calculation)
   */
  gregorianToHijri(date: Date): {
    day: number;
    month: number;
    year: number;
    monthName: string;
  } {
    const HIJRI_MONTHS = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ];

    // Simplified conversion (approximate)
    const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
              Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
               Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    return {
      day,
      month,
      year,
      monthName: HIJRI_MONTHS[month - 1],
    };
  },

  // ==================== Qibla ====================

  /**
   * Calculate Qibla direction
   */
  calculateQiblaDirection(latitude: number, longitude: number): number {
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;

    const lat1 = (latitude * Math.PI) / 180;
    const lng1 = (longitude * Math.PI) / 180;
    const lat2 = (kaabaLat * Math.PI) / 180;
    const lng2 = (kaabaLng * Math.PI) / 180;

    const dLng = lng2 - lng1;

    const y = Math.sin(dLng);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLng);

    let qibla = Math.atan2(y, x);
    qibla = (qibla * 180) / Math.PI;

    // Normalize to 0-360
    if (qibla < 0) qibla += 360;

    return qibla;
  },

  /**
   * Calculate distance to Kaaba
   */
  calculateDistanceToKaaba(latitude: number, longitude: number): number {
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    const R = 6371; // Earth radius in km

    const dLat = ((kaabaLat - latitude) * Math.PI) / 180;
    const dLng = ((kaabaLng - longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((kaabaLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  // ==================== Special Days ====================

  /**
   * Get upcoming Islamic events
   */
  async getUpcomingEvents(days: number = 30): Promise<IslamicDate[]> {
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const dates = await this.getIslamicDates(
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    return dates.filter((d) => d.is_special_day);
  },

  /**
   * Check if today is a special day
   */
  async isTodaySpecial(): Promise<{
    isSpecial: boolean;
    specialDayName?: string;
  }> {
    const today = await this.getTodayIslamicDate();
    return {
      isSpecial: today.is_special_day,
      specialDayName: today.special_day_name,
    };
  },
};
