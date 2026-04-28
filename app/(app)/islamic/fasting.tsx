/**
 * Fasting Tracker Screen - Track Ramadan and voluntary fasts
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronRight,
  Calendar,
  Moon,
  Sun,
  CheckCircle2,
  Circle,
  Target,
  Award,
  TrendingUp,
  Clock,
  Sunrise,
  Sunset,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

// Voluntary fasting types
const fastingTypes = [
  { id: 'monday_thursday', nameAr: 'الإثنين والخميس', nameEn: 'Monday & Thursday', reward: 'سنة نبوية' },
  { id: 'ayyam_beed', nameAr: 'الأيام البيض', nameEn: 'White Days (13-15)', reward: 'صيام الشهر' },
  { id: 'ashura', nameAr: 'عاشوراء', nameEn: 'Ashura (10th Muharram)', reward: 'كفارة سنة' },
  { id: 'arafah', nameAr: 'يوم عرفة', nameEn: 'Day of Arafah', reward: 'كفارة سنتين' },
  { id: 'shawwal', nameAr: '6 من شوال', nameEn: '6 Days of Shawwal', reward: 'صيام الدهر' },
];

// Demo fasting data
const demoFastingDays = [
  { date: '2024-03-11', type: 'ramadan', completed: true },
  { date: '2024-03-12', type: 'ramadan', completed: true },
  { date: '2024-03-13', type: 'ramadan', completed: true },
  { date: '2024-03-14', type: 'ramadan', completed: false },
];

export default function FastingScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();

  const [selectedTab, setSelectedTab] = useState<'ramadan' | 'voluntary'>('ramadan');

  // Calculate stats
  const stats = useMemo(() => {
    const completed = demoFastingDays.filter(d => d.completed).length;
    const total = 30; // Ramadan days
    const streak = 3; // Current streak
    return { completed, total, streak, progress: Math.round((completed / total) * 100) };
  }, []);

  // Get today's fasting times (demo)
  const fastingTimes = {
    suhoor: '04:45',
    iftar: '18:32',
    remaining: '3 ساعات 24 دقيقة',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'متتبع الصيام' : 'Fasting Tracker'}
        </Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Fasting Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.todayCard}
          >
            <View style={styles.todayHeader}>
              <View style={styles.fastingBadge}>
                <Moon size={14} color={Colors.gold[500]} />
                <Text style={[styles.fastingBadgeText, { fontFamily: getFont('medium') }]}>
                  {rtl ? 'صيام اليوم' : "Today's Fast"}
                </Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={[styles.dateText, { fontFamily: getFont('medium') }]}>
                  14 رمضان 1445
                </Text>
              </View>
            </View>

            <View style={styles.timesRow}>
              <View style={styles.timeBox}>
                <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} style={styles.timeIcon}>
                  <Sunrise size={22} color={Colors.gold[400]} />
                </LinearGradient>
                <Text style={[styles.timeLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'السحور' : 'Suhoor'}
                </Text>
                <Text style={[styles.timeValue, { fontFamily: getFont('bold') }]}>{fastingTimes.suhoor}</Text>
              </View>
              <View style={styles.timeDivider}>
                <View style={styles.dividerLine} />
                <Text style={[styles.remainingText, { fontFamily: getFont('medium') }]}>
                  {fastingTimes.remaining}
                </Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.timeBox}>
                <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} style={styles.timeIcon}>
                  <Sunset size={22} color={Colors.gold[400]} />
                </LinearGradient>
                <Text style={[styles.timeLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'الإفطار' : 'Iftar'}
                </Text>
                <Text style={[styles.timeValue, { fontFamily: getFont('bold') }]}>{fastingTimes.iftar}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.markButton}>
              <CheckCircle2 size={20} color={Colors.primary[700]} />
              <Text style={[styles.markButtonText, { fontFamily: getFont('bold') }]}>
                {rtl ? 'تسجيل الصيام' : 'Log Fast'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Progress Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient colors={[Colors.gold[100], Colors.gold[50]]} style={styles.statIcon}>
              <Target size={20} color={Colors.gold[600]} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
              {stats.completed}/{stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {rtl ? 'أيام الصيام' : 'Days Fasted'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient colors={[Colors.primary[100], Colors.primary[50]]} style={styles.statIcon}>
              <TrendingUp size={20} color={Colors.primary[600]} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
              {stats.streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {rtl ? 'أيام متتالية' : 'Day Streak'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient colors={[Colors.sisters[100], Colors.sisters[50]]} style={styles.statIcon}>
              <Award size={20} color={Colors.sisters[600]} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
              {stats.progress}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {rtl ? 'التقدم' : 'Progress'}
            </Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'ramadan' && styles.tabActive]}
            onPress={() => setSelectedTab('ramadan')}
          >
            <Moon size={18} color={selectedTab === 'ramadan' ? Colors.white : theme.textSecondary} />
            <Text style={[styles.tabText, { color: selectedTab === 'ramadan' ? Colors.white : theme.textSecondary, fontFamily: getFont('medium') }]}>
              {rtl ? 'رمضان' : 'Ramadan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'voluntary' && styles.tabActive]}
            onPress={() => setSelectedTab('voluntary')}
          >
            <Sun size={18} color={selectedTab === 'voluntary' ? Colors.white : theme.textSecondary} />
            <Text style={[styles.tabText, { color: selectedTab === 'voluntary' ? Colors.white : theme.textSecondary, fontFamily: getFont('medium') }]}>
              {rtl ? 'تطوع' : 'Voluntary'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Voluntary Fasting Types */}
        {selectedTab === 'voluntary' && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'أنواع الصيام التطوعي' : 'Voluntary Fasting Types'}
            </Text>
            {fastingTypes.map((type, index) => (
              <Animated.View key={type.id} entering={FadeInUp.delay(350 + index * 50).duration(300)}>
                <TouchableOpacity style={[styles.fastingTypeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.fastingTypeIcon, { backgroundColor: Colors.gold[100] }]}>
                    <Moon size={20} color={Colors.gold[600]} />
                  </View>
                  <View style={[styles.fastingTypeInfo, rtl && styles.alignEnd]}>
                    <Text style={[styles.fastingTypeName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                      {rtl ? type.nameAr : type.nameEn}
                    </Text>
                    <View style={[styles.rewardBadge, { backgroundColor: Colors.primary[100] }]}>
                      <Award size={12} color={Colors.primary[600]} />
                      <Text style={[styles.rewardText, { color: Colors.primary[600], fontFamily: getFont('medium') }]}>
                        {type.reward}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={theme.textTertiary} style={{ transform: [{ scaleX: rtl ? 1 : -1 }] }} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Ramadan Calendar */}
        {selectedTab === 'ramadan' && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'تقويم رمضان' : 'Ramadan Calendar'}
            </Text>
            <View style={[styles.calendarGrid, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const dayData = demoFastingDays.find(d => new Date(d.date).getDate() === day);
                const isCompleted = dayData?.completed;
                const isPast = day < 14;
                const isToday = day === 14;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDay,
                      isCompleted && styles.calendarDayCompleted,
                      isToday && styles.calendarDayToday,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} color={Colors.success} />
                    ) : isPast ? (
                      <Circle size={20} color={Colors.error} />
                    ) : (
                      <Text style={[styles.calendarDayText, { color: isToday ? Colors.primary[600] : theme.text, fontFamily: getFont('medium') }]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18 },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 20 },
  alignEnd: { alignItems: 'flex-end' },

  // Today's Card
  todayCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  todayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  fastingBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  fastingBadgeText: { fontSize: 13, color: Colors.white },
  dateBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateText: { fontSize: 13, color: Colors.white },
  timesRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  timeBox: { alignItems: 'center', gap: 8 },
  timeIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  timeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  timeValue: { fontSize: 24, color: Colors.white },
  timeDivider: { alignItems: 'center', gap: 8 },
  dividerLine: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  remainingText: { fontSize: 12, color: Colors.gold[400] },
  markButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.white, paddingVertical: 14, borderRadius: 14 },
  markButtonText: { fontSize: 15, color: Colors.primary[700] },

  // Stats Grid
  statsGrid: { flexDirection: 'row-reverse', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 11 },

  // Tabs
  tabsContainer: { flexDirection: 'row-reverse', backgroundColor: Colors.slate[100], borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  tabActive: { backgroundColor: Colors.primary[500] },
  tabText: { fontSize: 14 },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },

  // Fasting Types
  fastingTypeCard: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 14 },
  fastingTypeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  fastingTypeInfo: { flex: 1 },
  fastingTypeName: { fontSize: 15, marginBottom: 6 },
  rewardBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  rewardText: { fontSize: 11 },

  // Calendar Grid
  calendarGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', padding: 12, borderRadius: 18, borderWidth: 1 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calendarDayCompleted: {},
  calendarDayToday: { backgroundColor: Colors.primary[100], borderRadius: 12 },
  calendarDayText: { fontSize: 14 },
});
