/**
 * Prayer Store
 * Prayer times are computed ON-DEVICE with the `adhan` library (accurate, works
 * offline, uses the device's local timezone). Location is detected by IP
 * (no GPS permission needed), falling back to the last-known location or Tunis.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  Coordinates,
  CalculationMethod,
  PrayerTimes as AdhanPrayerTimes,
  Madhab,
} from 'adhan';
import apiClient from '../services/api/client';
import i18n from '../../i18n';

export interface PrayerTimesResponse {
  date: string;
  hijri_date: string;
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  method: string;
  timezone: string;
  coordinates?: {latitude: number; longitude: number};
}

export interface PrayerLog {
  public_id: string;
  date: string;
  prayer: string;
  status: string;
  prayed_at?: string | null;
  in_jamaah: boolean;
  at_masjid: boolean;
  notes?: string;
  created: string;
}

export interface PrayerTime {
  key: string;
  name: string;
  arabicName: string;
  emoji: string;
  time: string;
  isPassed: boolean;
  isNext: boolean;
}

export interface Location {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Default to Tunis (target market) until the device's IP location resolves.
export const DEFAULT_LOCATION: Location = {
  city: 'Tunis',
  country: 'Tunisia',
  latitude: 36.8065,
  longitude: 10.1815,
};

const PRAYER_META: Array<{
  key: string;
  name: string;
  arabicName: string;
  emoji: string;
  field: keyof PrayerTimesResponse;
  isPrayer: boolean;
}> = [
  {key: 'fajr', name: 'Fajr', arabicName: 'الفجر', emoji: '🌅', field: 'fajr', isPrayer: true},
  {key: 'sunrise', name: 'Sunrise', arabicName: 'الشروق', emoji: '🌄', field: 'sunrise', isPrayer: false},
  {key: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', emoji: '☀️', field: 'dhuhr', isPrayer: true},
  {key: 'asr', name: 'Asr', arabicName: 'العصر', emoji: '🌤️', field: 'asr', isPrayer: true},
  {key: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', emoji: '🌆', field: 'maghrib', isPrayer: true},
  {key: 'isha', name: 'Isha', arabicName: 'العشاء', emoji: '🌙', field: 'isha', isPrayer: true},
];

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const buildPrayerTimes = (data: PrayerTimesResponse): PrayerTime[] => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const rows: PrayerTime[] = PRAYER_META.map((meta) => {
    const time = (data[meta.field] as string | null) ?? '';
    return {
      key: meta.key,
      name: meta.name,
      arabicName: meta.arabicName,
      emoji: meta.emoji,
      time,
      isPassed: time ? toMinutes(time) <= nowMinutes : false,
      isNext: false,
    };
  });

  const next = rows.find(
    (r) =>
      r.time &&
      toMinutes(r.time) > nowMinutes &&
      PRAYER_META.find((m) => m.key === r.key)?.isPrayer,
  );
  if (next) {
    next.isNext = true;
  }
  return rows;
};

// --- on-device computation helpers -----------------------------------------
const fmt = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const methodParams = (m: string) => {
  switch (m) {
    case 'Egypt':
      return CalculationMethod.Egyptian();
    case 'Makkah':
      return CalculationMethod.UmmAlQura();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'ISNA':
      return CalculationMethod.NorthAmerica();
    case 'Tehran':
      return CalculationMethod.Tehran();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
};

const hijriDate = (date: Date): string => {
  const isArabic = i18n.language?.startsWith('ar');
  const locale = isArabic
    ? 'ar-SA-u-ca-islamic-umalqura-nu-latn'
    : 'en-US-u-ca-islamic-umalqura';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
};

/** Resolve approximate location from the device's public IP (no permission). */
const lookupIpLocation = async (): Promise<Location | null> => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const j: any = await res.json();
    if (typeof j?.latitude === 'number' && typeof j?.longitude === 'number') {
      return {
        city: j.city || 'Unknown',
        country: j.country_name || '',
        latitude: j.latitude,
        longitude: j.longitude,
      };
    }
  } catch {
    // offline / blocked — caller falls back to stored location
  }
  return null;
};

/** Reverse-geocode lat/lng to a city/country label (free, no API key). */
const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<{city: string; country: string}> => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (res.ok) {
      const j: any = await res.json();
      return {
        city: j.city || j.locality || j.principalSubdivision || 'Current location',
        country: j.countryName || '',
      };
    }
  } catch {
    // non-fatal — coords alone are enough to compute times
  }
  return {city: 'Current location', country: ''};
};

/**
 * Resolve the device's REAL location via GPS (most accurate — IP geolocation is
 * unreliable on mobile carriers and often points to the wrong country). Requests
 * the runtime permission on Android first; resolves null if denied/unavailable.
 */
const lookupGpsLocation = (): Promise<Location | null> =>
  new Promise(async (resolve) => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          resolve(null);
          return;
        }
      }
      Geolocation.getCurrentPosition(
        async (pos) => {
          const {latitude, longitude} = pos.coords;
          const label = await reverseGeocode(latitude, longitude);
          resolve({latitude, longitude, city: label.city, country: label.country});
        },
        () => resolve(null),
        {enableHighAccuracy: false, timeout: 10000, maximumAge: 600000},
      );
    } catch {
      resolve(null);
    }
  });

const computeTimes = (location: Location, method: string): PrayerTimesResponse => {
  const date = new Date();
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = methodParams(method);
  params.madhab = Madhab.Shafi;
  const pt = new AdhanPrayerTimes(coords, date, params);
  return {
    date: date.toISOString().slice(0, 10),
    hijri_date: hijriDate(date),
    fajr: fmt(pt.fajr),
    sunrise: fmt(pt.sunrise),
    dhuhr: fmt(pt.dhuhr),
    asr: fmt(pt.asr),
    maghrib: fmt(pt.maghrib),
    isha: fmt(pt.isha),
    method,
    timezone: '',
    coordinates: {latitude: location.latitude, longitude: location.longitude},
  };
};

export interface PrayerStats {
  total_prayers: number;
  prayed_on_time: number;
  prayed_qada: number;
  missed: number;
  jamaah_count: number;
  masjid_count: number;
  completion_rate: number;
  streak_days: number;
  period_days: number;
}

interface PrayerState {
  raw: PrayerTimesResponse | null;
  prayerTimes: PrayerTime[];
  todayLogs: PrayerLog[];
  stats: PrayerStats | null;
  location: Location;
  method: string;
  isLoading: boolean;
  error: string | null;

  setLocation: (location: Location) => void;
  setMethod: (method: string) => void;
  fetchPrayerTimes: () => Promise<void>;
  fetchTodayLogs: () => Promise<void>;
  fetchStats: (days?: number) => Promise<void>;
  logPrayer: (
    prayer: string,
    status: 'prayed' | 'qada' | 'missed',
    extra?: {in_jamaah?: boolean; at_masjid?: boolean},
  ) => Promise<void>;
  getLogStatus: (prayer: string) => string | null;
  getNextPrayer: () => PrayerTime | null;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set, get) => ({
      raw: null,
      prayerTimes: [],
      todayLogs: [],
      stats: null,
      location: DEFAULT_LOCATION,
      method: 'MWL',
      isLoading: false,
      error: null,

      setLocation: (location) => {
        set({location});
        const raw = computeTimes(location, get().method);
        set({raw, prayerTimes: buildPrayerTimes(raw)});
      },
      setMethod: (method) => {
        set({method});
        const raw = computeTimes(get().location, method);
        set({raw, prayerTimes: buildPrayerTimes(raw)});
      },

      fetchPrayerTimes: async () => {
        set({isLoading: true, error: null});
        // 1) Show times immediately from the last-known (or default Tunis) location.
        const current = get().location;
        const immediate = computeTimes(current, get().method);
        set({raw: immediate, prayerTimes: buildPrayerTimes(immediate), isLoading: false});

        // 2) In the background, refine the location and recompute. Prefer real
        // GPS (accurate); only fall back to IP geolocation if GPS is denied or
        // unavailable (IP is unreliable on mobile carriers and was sending some
        // users the wrong country's times).
        try {
          const gpsLoc = await lookupGpsLocation();
          const loc = gpsLoc ?? (await lookupIpLocation());
          if (loc) {
            const raw = computeTimes(loc, get().method);
            set({raw, prayerTimes: buildPrayerTimes(raw), location: loc});
          }
        } catch {
          // keep the immediate result
        }
      },

      fetchTodayLogs: async () => {
        const today = new Date().toISOString().slice(0, 10);
        try {
          const response = await apiClient.get<PrayerLog[]>('/islamic/prayers/', {
            params: {start_date: today, end_date: today},
          });
          const data = response.data as any;
          set({todayLogs: Array.isArray(data) ? data : data?.results ?? []});
        } catch {
          set({todayLogs: []});
        }
      },

      fetchStats: async (days = 30) => {
        try {
          const response = await apiClient.get<PrayerStats>(
            '/islamic/prayers/stats/',
            {params: {days}},
          );
          set({stats: response.data});
        } catch {
          // stats are non-critical; keep the previous value
        }
      },

      logPrayer: async (prayer, status, extra) => {
        const today = new Date().toISOString().slice(0, 10);
        // Optimistically reflect the tap immediately.
        const optimistic: PrayerLog = {
          public_id: `temp-${prayer}`,
          date: today,
          prayer,
          status,
          in_jamaah: extra?.in_jamaah ?? false,
          at_masjid: extra?.at_masjid ?? false,
          created: new Date().toISOString(),
        };
        set((state) => ({
          todayLogs: [
            ...state.todayLogs.filter((l) => l.prayer !== prayer),
            optimistic,
          ],
        }));
        try {
          const response = await apiClient.post<PrayerLog>('/islamic/prayers/', {
            date: today,
            prayer,
            status,
            in_jamaah: extra?.in_jamaah ?? false,
            at_masjid: extra?.at_masjid ?? false,
          });
          set((state) => ({
            todayLogs: [
              ...state.todayLogs.filter((l) => l.prayer !== prayer),
              response.data,
            ],
          }));
          void get().fetchStats();
        } catch {
          // Roll back the optimistic entry on failure.
          set((state) => ({
            todayLogs: state.todayLogs.filter((l) => l.public_id !== optimistic.public_id),
          }));
        }
      },

      getLogStatus: (prayer) =>
        get().todayLogs.find((l) => l.prayer === prayer)?.status ?? null,

      getNextPrayer: () =>
        get().prayerTimes.find((prayer) => prayer.isNext) || null,
    }),
    {
      name: 'prayer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        location: state.location,
        method: state.method,
      }),
    },
  ),
);
