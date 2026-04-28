/**
 * Prayer Times Screen - Arabic Only - Enhanced UI
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronRight,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  MapPin,
  Bell,
  BellOff,
  RefreshCw,
  Calendar,
  Navigation,
  Volume2,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';

const { width } = Dimensions.get('window');
import { useThemeStore } from '../../../store/themeStore';
import { usePrayerCountdown, useTodayIslamicDate } from '../../../hooks/queries/useIslamic';
import { useAuthStore } from '../../../store';
import type { PrayerMethod } from '../../../types/models';

interface PrayerTimeDisplay {
  name: string;
  nameAr: string;
  time: string;
  icon: React.ReactNode;
  notificationEnabled: boolean;
}

export default function PrayerTimesScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const fontFamily = 'Tajawal_500Medium';
  const fontBold = 'Tajawal_700Bold';
  const { user } = useAuthStore();

  // Location state
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [locationLoading, setLocationLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user's prayer method preference
  const prayerMethod: PrayerMethod = user?.prayer_method || 'MWL';

  // Get location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('لم يتم منح إذن الموقع');
          setLocationLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Reverse geocode to get location name
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          setLocationName(`${address.city || address.region || ''}, ${address.country || ''}`);
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocationName('تعذر تحديد الموقع');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Fetch prayer times with countdown
  const {
    prayerTimes: apiPrayerTimes,
    nextPrayer,
    countdown,
    isLoading: prayerTimesLoading,
    refetch,
  } = usePrayerCountdown(
    location?.latitude || 0,
    location?.longitude || 0,
    prayerMethod
  );

  // Fetch Islamic date
  const { data: islamicDate } = useTodayIslamicDate();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Build prayer times display array
  const prayerTimesList: PrayerTimeDisplay[] = apiPrayerTimes ? [
    { name: 'Fajr', nameAr: 'الفجر', time: apiPrayerTimes.fajr, icon: <Moon size={22} color={Colors.primary[400]} />, notificationEnabled: true },
    { name: 'Sunrise', nameAr: 'الشروق', time: apiPrayerTimes.sunrise, icon: <Sunrise size={22} color={Colors.gold[500]} />, notificationEnabled: false },
    { name: 'Dhuhr', nameAr: 'الظهر', time: apiPrayerTimes.dhuhr, icon: <Sun size={22} color={Colors.gold[500]} />, notificationEnabled: true },
    { name: 'Asr', nameAr: 'العصر', time: apiPrayerTimes.asr, icon: <Sun size={22} color={Colors.gold[400]} />, notificationEnabled: true },
    { name: 'Maghrib', nameAr: 'المغرب', time: apiPrayerTimes.maghrib, icon: <Sunset size={22} color={Colors.accent[500]} />, notificationEnabled: true },
    { name: 'Isha', nameAr: 'العشاء', time: apiPrayerTimes.isha, icon: <Moon size={22} color={Colors.primary[500]} />, notificationEnabled: true },
  ] : [];

  // Find next prayer index
  const nextPrayerIndex = prayerTimesList.findIndex(p => p.name === nextPrayer?.name) || 0;

  const getTimeUntilNextPrayer = () => {
    if (!countdown) return 'جاري الحساب...';
    const { hours, minutes } = countdown;
    return `${hours} ساعة ${minutes} دقيقة`;
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format Hijri date
  const hijriDateStr = islamicDate
    ? `${islamicDate.hijri_day} ${islamicDate.hijri_month_name} ${islamicDate.hijri_year}`
    : 'جاري التحميل...';

  const isLoading = locationLoading || prayerTimesLoading;

  // Prayer method display names
  const methodNames: Record<PrayerMethod, string> = {
    'MWL': 'رابطة العالم الإسلامي',
    'ISNA': 'الجمعية الإسلامية لأمريكا الشمالية',
    'Egypt': 'الهيئة المصرية العامة للمساحة',
    'Makkah': 'جامعة أم القرى',
    'Karachi': 'جامعة العلوم الإسلامية كراتشي',
    'Tehran': 'معهد الجيوفيزياء طهران',
    'Jafari': 'المذهب الجعفري',
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.title, isDark && styles.textDark, { fontFamily: fontBold }]}>مواقيت الصلاة</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronRight size={24} color={isDark ? Colors.white : Colors.slate[800]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={[styles.loadingText, isDark && styles.textDark, { fontFamily }]}>
            جاري تحميل مواقيت الصلاة...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.card }]} onPress={() => refetch()}>
          <RefreshCw size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text, fontFamily: fontBold }]}>مواقيت الصلاة</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date & Location Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={[styles.dateContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.dateRow}>
              <View style={[styles.dateIconBox, { backgroundColor: Colors.gold[100] }]}>
                <Calendar size={20} color={Colors.gold[600]} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={[styles.hijriDate, { fontFamily: fontBold, color: Colors.primary[500] }]}>{hijriDateStr}</Text>
                <Text style={[styles.dateText, { color: theme.textSecondary, fontFamily }]}>{formatDate()}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.locationRow}>
              <Navigation size={16} color={Colors.primary[500]} />
              <Text style={[styles.locationText, { color: theme.textSecondary, fontFamily }]}>{locationName}</Text>
              <MapPin size={16} color={Colors.primary[500]} />
            </View>
          </View>
        </Animated.View>

        {/* Next Prayer Card with Gradient */}
        {prayerTimesList.length > 0 && nextPrayer && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <LinearGradient
              colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextPrayerCard}
            >
              <View style={styles.nextPrayerHeader}>
                <Text style={[styles.nextPrayerLabel, { fontFamily }]}>الصلاة القادمة</Text>
                <View style={styles.adhanBadge}>
                  <Volume2 size={14} color={Colors.gold[500]} />
                  <Text style={[styles.adhanText, { fontFamily }]}>الأذان</Text>
                </View>
              </View>
              <View style={styles.nextPrayerInfo}>
                <View style={styles.nextPrayerDetails}>
                  <Text style={[styles.nextPrayerName, { fontFamily: fontBold }]}>
                    {prayerTimesList[nextPrayerIndex]?.nameAr || nextPrayer.name}
                  </Text>
                  <Text style={[styles.nextPrayerTime, { fontFamily: fontBold }]}>{nextPrayer.time}</Text>
                </View>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.nextPrayerIconBox}
                >
                  {prayerTimesList[nextPrayerIndex]?.icon}
                </LinearGradient>
              </View>
              <View style={styles.countdownContainer}>
                <View style={styles.countdownInner}>
                  <Clock size={18} color={Colors.gold[400]} />
                  <Text style={[styles.countdownLabel, { fontFamily }]}>الوقت المتبقي</Text>
                </View>
                <Text style={[styles.countdownText, { fontFamily: fontBold }]}>{getTimeUntilNextPrayer()}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Prayer Times List */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={[styles.prayerList, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.prayerListHeader}>
              <Text style={[styles.prayerListTitle, { color: theme.text, fontFamily: fontBold }]}>أوقات الصلاة</Text>
            </View>
            {prayerTimesList.map((prayer, index) => {
              const isNext = index === nextPrayerIndex;
              return (
                <Animated.View
                  key={prayer.name}
                  entering={FadeInDown.delay(350 + index * 50).duration(400)}
                >
                  <View style={[
                    styles.prayerItem,
                    isNext && styles.prayerItemActive,
                    { borderBottomColor: theme.divider }
                  ]}>
                    {isNext && <View style={styles.activeIndicator} />}
                    <View style={styles.prayerItemRight}>
                      <TouchableOpacity style={[styles.bellButton, { backgroundColor: prayer.notificationEnabled ? Colors.primary[100] : theme.inputBackground }]}>
                        {prayer.notificationEnabled ? <Bell size={16} color={Colors.primary[500]} /> : <BellOff size={16} color={theme.textTertiary} />}
                      </TouchableOpacity>
                      <Text style={[styles.prayerTime, { color: isNext ? Colors.primary[600] : theme.text, fontFamily: fontBold }]}>{prayer.time}</Text>
                    </View>
                    <View style={styles.prayerItemLeft}>
                      <View>
                        <Text style={[styles.prayerName, { color: isNext ? Colors.primary[600] : theme.text, fontFamily: isNext ? fontBold : fontFamily }]}>{prayer.nameAr}</Text>
                        {isNext && (
                          <View style={styles.nextBadge}>
                            <Text style={[styles.nextBadgeText, { fontFamily }]}>التالية</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.prayerIcon, { backgroundColor: isNext ? Colors.primary[100] : theme.inputBackground }]}>{prayer.icon}</View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Calculation Method */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <TouchableOpacity style={[styles.methodButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.methodContent}>
              <View style={[styles.methodIcon, { backgroundColor: Colors.gold[100] }]}>
                <Navigation size={18} color={Colors.gold[600]} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodValue, { color: theme.text, fontFamily: fontBold }]}>{methodNames[prayerMethod]}</Text>
                <Text style={[styles.methodLabel, { color: theme.textSecondary, fontFamily }]}>طريقة الحساب</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.textTertiary} style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  refreshButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  placeholder: { width: 44 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 16 },

  // Date Container
  dateContainer: { padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  dateIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateInfo: { flex: 1, alignItems: 'flex-end' },
  hijriDate: { fontSize: 18, marginBottom: 2 },
  dateText: { fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.slate[200], marginVertical: 12 },
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  locationText: { fontSize: 14 },

  // Next Prayer Card
  nextPrayerCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
  nextPrayerHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  nextPrayerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  adhanBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  adhanText: { fontSize: 12, color: Colors.gold[400] },
  nextPrayerInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16, marginBottom: 20 },
  nextPrayerDetails: { flex: 1, alignItems: 'flex-end' },
  nextPrayerIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  nextPrayerName: { fontSize: 32, color: Colors.white, marginBottom: 4 },
  nextPrayerTime: { fontSize: 24, color: Colors.gold[400] },
  countdownContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.12)', padding: 16, borderRadius: 16 },
  countdownInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  countdownLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  countdownText: { fontSize: 18, color: Colors.white },

  // Prayer List
  prayerList: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1 },
  prayerListHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[100] },
  prayerListTitle: { fontSize: 16, textAlign: 'right' },
  prayerItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, position: 'relative' },
  prayerItemActive: { backgroundColor: Colors.primary[50] },
  activeIndicator: { position: 'absolute', right: 0, top: 8, bottom: 8, width: 4, backgroundColor: Colors.primary[500], borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  prayerItemLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  prayerIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  prayerName: { fontSize: 16, textAlign: 'right' },
  nextBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.primary[100] },
  nextBadgeText: { fontSize: 10, color: Colors.primary[600] },
  prayerItemRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  prayerTime: { fontSize: 18 },
  bellButton: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Method Button
  methodButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: 16, borderWidth: 1 },
  methodContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  methodIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  methodInfo: { alignItems: 'flex-end' },
  methodLabel: { fontSize: 12, marginTop: 2 },
  methodValue: { fontSize: 15 },
});
