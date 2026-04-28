/**
 * Islamic Features Query Hooks
 * React Query hooks for Islamic features
 */
import { useQuery } from '@tanstack/react-query';
import { islamicApi } from '../../services/api/islamic';
import { queryKeys } from '../../services/queryClient';
import { DEMO_MODE, DEMO_PRAYER_TIMES, DEMO_ADHKAR } from '../../services/demoMode';
import type { PrayerMethod } from '../../types/models';

/**
 * Get prayer times from API
 */
export function usePrayerTimes(
  latitude: number,
  longitude: number,
  method: PrayerMethod = 'MWL',
  date?: string
) {
  return useQuery({
    queryKey: queryKeys.islamic.prayerTimes(latitude, longitude, date),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_PRAYER_TIMES;
      }
      return islamicApi.getPrayerTimes(latitude, longitude, method, date);
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 60, // 1 hour - prayer times don't change often
  });
}

/**
 * Calculate prayer times locally (fallback)
 */
export function useLocalPrayerTimes(
  latitude: number,
  longitude: number,
  method: PrayerMethod = 'MWL'
) {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'local-prayer-times', latitude, longitude, method],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_PRAYER_TIMES;
      }
      return islamicApi.calculatePrayerTimesLocal(
        { latitude, longitude },
        new Date(),
        method
      );
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get adhkar by category
 */
export function useAdhkar(category: 'morning' | 'evening' | 'sleep' | 'prayer' | 'travel') {
  return useQuery({
    queryKey: queryKeys.islamic.adhkar(category),
    queryFn: async () => {
      if (DEMO_MODE) {
        if (category === 'morning') return DEMO_ADHKAR.morning;
        if (category === 'evening') return DEMO_ADHKAR.evening;
        return [
          { id: '1', text: 'سبحان الله', count: 33, category },
          { id: '2', text: 'الحمد لله', count: 33, category },
          { id: '3', text: 'الله أكبر', count: 34, category },
        ];
      }
      return islamicApi.getAdhkar(category);
    },
    staleTime: Infinity, // Adhkar don't change
  });
}

/**
 * Get all adhkar categories
 */
export function useAllAdhkar() {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'all-adhkar'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_ADHKAR;
      }
      return islamicApi.getAllAdhkar();
    },
    staleTime: Infinity,
  });
}

/**
 * Get daily verse
 */
export function useDailyVerse() {
  return useQuery({
    queryKey: queryKeys.islamic.dailyVerse(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          surah: 2,
          ayah: 286,
          arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
          translation: 'Allah does not burden a soul beyond that it can bear',
          surah_name: 'البقرة',
          surah_name_en: 'Al-Baqarah',
        };
      }
      return islamicApi.getDailyVerse();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get specific verse
 */
export function useVerse(surah: number, ayah: number) {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'verse', surah, ayah],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          surah,
          ayah,
          arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        };
      }
      return islamicApi.getVerse(surah, ayah);
    },
    enabled: !!surah && !!ayah,
    staleTime: Infinity, // Quran verses don't change
  });
}

/**
 * Get Islamic dates
 */
export function useIslamicDates(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.islamic.islamicDates(startDate, endDate),
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          hijri_date: DEMO_PRAYER_TIMES.hijri_date,
          gregorian_date: DEMO_PRAYER_TIMES.date,
        };
      }
      return islamicApi.getIslamicDates(startDate, endDate);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get today's Islamic date
 */
export function useTodayIslamicDate() {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'today'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          hijri: DEMO_PRAYER_TIMES.hijri_date,
          hijri_day: 23,
          hijri_month: 10,
          hijri_month_name: 'شوال',
          hijri_year: 1447,
          gregorian: DEMO_PRAYER_TIMES.date,
          day_ar: 'الإثنين',
          day_en: 'Monday',
        };
      }
      return islamicApi.getTodayIslamicDate();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get upcoming Islamic events
 */
export function useUpcomingIslamicEvents(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.islamic.upcomingEvents(days),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', name: 'عيد الفطر', name_en: 'Eid al-Fitr', date: '2026-04-30', hijri_date: '1 شوال 1447' },
          { id: '2', name: 'يوم عرفة', name_en: 'Day of Arafah', date: '2026-07-07', hijri_date: '9 ذو الحجة 1447' },
          { id: '3', name: 'عيد الأضحى', name_en: 'Eid al-Adha', date: '2026-07-08', hijri_date: '10 ذو الحجة 1447' },
        ];
      }
      return islamicApi.getUpcomingEvents(days);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Check if today is special
 */
export function useIsTodaySpecial() {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'is-today-special'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return { is_special: false, event: null };
      }
      return islamicApi.isTodaySpecial();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Calculate Qibla direction (local)
 */
export function useQiblaDirection(latitude: number, longitude: number) {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'qibla', latitude, longitude],
    queryFn: async () => {
      if (DEMO_MODE) {
        // Calculate approximate Qibla for Tunisia (demo location)
        return {
          direction: 115.5, // Approximate Qibla from Tunisia
          distanceKm: 4200, // Approximate distance from Tunisia to Mecca
        };
      }
      return {
        direction: islamicApi.calculateQiblaDirection(latitude, longitude),
        distanceKm: islamicApi.calculateDistanceToKaaba(latitude, longitude),
      };
    },
    enabled: !!latitude && !!longitude,
    staleTime: Infinity, // Qibla direction doesn't change for a location
  });
}

/**
 * Convert Gregorian to Hijri (local)
 */
export function useGregorianToHijri(date: Date) {
  return useQuery({
    queryKey: [...queryKeys.islamic.all, 'gregorian-to-hijri', date.toISOString()],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          hijri: DEMO_PRAYER_TIMES.hijri_date,
          gregorian: date.toISOString().split('T')[0],
        };
      }
      return islamicApi.gregorianToHijri(date);
    },
    staleTime: Infinity,
  });
}

/**
 * Hook to get next prayer
 */
export function useNextPrayer(
  latitude: number,
  longitude: number,
  method: PrayerMethod = 'MWL'
) {
  const { data: prayerTimes, ...rest } = usePrayerTimes(latitude, longitude, method);

  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const prayers = [
      { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr },
      { name: 'Sunrise', nameAr: 'الشروق', time: prayerTimes.sunrise },
      { name: 'Dhuhr', nameAr: 'الظهر', time: prayerTimes.dhuhr },
      { name: 'Asr', nameAr: 'العصر', time: prayerTimes.asr },
      { name: 'Maghrib', nameAr: 'المغرب', time: prayerTimes.maghrib },
      { name: 'Isha', nameAr: 'العشاء', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      if (prayer.time > currentTime) {
        return prayer;
      }
    }

    // If all prayers have passed, return Fajr for tomorrow
    return { name: 'Fajr', nameAr: 'الفجر', time: prayerTimes.fajr, isTomorrow: true };
  };

  return {
    ...rest,
    data: prayerTimes,
    nextPrayer: prayerTimes ? getNextPrayer() : null,
  };
}

/**
 * Prayer time countdown hook
 */
export function usePrayerCountdown(
  latitude: number,
  longitude: number,
  method: PrayerMethod = 'MWL'
) {
  const { nextPrayer, data: prayerTimes, ...rest } = useNextPrayer(
    latitude,
    longitude,
    method
  );

  const getCountdown = () => {
    if (!nextPrayer) return null;

    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);

    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);

    // If prayer is tomorrow
    if ((nextPrayer as any).isTomorrow) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    const diff = prayerDate.getTime() - now.getTime();

    if (diff < 0) return null;

    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hours: hoursLeft,
      minutes: minutesLeft,
      seconds: secondsLeft,
      totalSeconds: Math.floor(diff / 1000),
      formatted: `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`,
    };
  };

  return {
    ...rest,
    prayerTimes,
    nextPrayer,
    countdown: nextPrayer ? getCountdown() : null,
  };
}

/**
 * Dhikr counter state (local only)
 */
export function useDhikrCounter(target: number = 33) {
  // This is a local-only hook, no API calls
  // State should be managed with useState in the component
  return {
    target,
    formatCount: (count: number) => `${count}/${target}`,
    isComplete: (count: number) => count >= target,
    progress: (count: number) => (count / target) * 100,
  };
}
