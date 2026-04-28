/**
 * Quran Tracker Screen - Premium UI
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { BookOpen, Check, ChevronRight, Target, Award, Sparkles, Play, Moon, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useDailyVerse } from '../../../hooks/queries/useIslamic';
import { getFont } from '../../../utils/fonts';

const QURAN_PROGRESS_KEY = '@quran_progress';

interface JuzProgress {
  juz: number;
  completed: boolean;
  inProgress: boolean;
  pages: number;
  pagesRead: number;
}

interface QuranStats {
  totalPages: number;
  pagesRead: number;
  currentJuz: number;
  streak: number;
  lastRead: string;
  lastReadDate?: string;
}

const defaultJuzProgress: JuzProgress[] = Array.from({ length: 30 }, (_, i) => ({
  juz: i + 1,
  completed: false,
  inProgress: i === 0,
  pages: 20,
  pagesRead: 0,
}));

const defaultStats: QuranStats = {
  totalPages: 604,
  pagesRead: 0,
  currentJuz: 1,
  streak: 0,
  lastRead: 'لم تبدأ بعد',
};

export default function QuranScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  // Local state for progress (persisted in AsyncStorage)
  const [juzProgress, setJuzProgress] = useState<JuzProgress[]>(defaultJuzProgress);
  const [stats, setStats] = useState<QuranStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch daily verse from API
  const { data: dailyVerse, isLoading: verseLoading, refetch: refetchVerse } = useDailyVerse();

  // Load progress from AsyncStorage
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(QURAN_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setJuzProgress(parsed.juzProgress || defaultJuzProgress);
        setStats(parsed.stats || defaultStats);
      }
    } catch (error) {
      console.error('Error loading Quran progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newJuzProgress: JuzProgress[], newStats: QuranStats) => {
    try {
      await AsyncStorage.setItem(QURAN_PROGRESS_KEY, JSON.stringify({
        juzProgress: newJuzProgress,
        stats: newStats,
      }));
    } catch (error) {
      console.error('Error saving Quran progress:', error);
    }
  };

  const handleJuzPress = (juzIndex: number) => {
    const newProgress = [...juzProgress];
    const juz = newProgress[juzIndex];

    // Toggle read pages (simple increment for demo)
    if (juz.pagesRead < juz.pages) {
      juz.pagesRead = juz.pages; // Mark as complete
      juz.completed = true;
      juz.inProgress = false;

      // Move in-progress to next juz
      if (juzIndex < 29) {
        newProgress[juzIndex + 1].inProgress = true;
      }
    } else {
      juz.pagesRead = 0;
      juz.completed = false;
    }

    const totalRead = newProgress.reduce((sum, j) => sum + j.pagesRead, 0);
    const currentJuz = newProgress.findIndex(j => j.inProgress) + 1 || newProgress.findIndex(j => !j.completed) + 1;

    const newStats: QuranStats = {
      ...stats,
      pagesRead: totalRead,
      currentJuz: currentJuz || 30,
      lastRead: `الجزء ${juz.juz}`,
      lastReadDate: new Date().toISOString(),
    };

    setJuzProgress(newProgress);
    setStats(newStats);
    saveProgress(newProgress, newStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    await refetchVerse();
    setRefreshing(false);
  };

  const progressPercent = (stats.pagesRead / stats.totalPages) * 100;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold') }]}>متابعة القرآن</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronRight size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
            جاري التحميل...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronRight size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerTitleRow}>
                <BookOpen size={24} color={Colors.gold[400]} />
                <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>متابعة القرآن</Text>
              </View>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                تتبع ختمتك للقرآن الكريم
              </Text>
            </View>
            <View style={styles.headerIconBox}>
              <Moon size={22} color={Colors.gold[400]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
      >
        {/* Daily Verse Card */}
        {dailyVerse && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <LinearGradient
              colors={isDark ? [Colors.gold[600], Colors.gold[700]] : [Colors.gold[400], Colors.gold[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyVerseCard}
            >
              <View style={styles.dailyVerseHeader}>
                <Sparkles size={20} color={Colors.gold[900]} />
                <Text style={[styles.dailyVerseLabel, { fontFamily: getFont('bold') }]}>آية اليوم</Text>
              </View>
              <Text style={[styles.dailyVerseArabic, { fontFamily: getFont('bold') }]}>
                {dailyVerse.arabic_text}
              </Text>
              {dailyVerse.translation && (
                <Text style={[styles.dailyVerseTranslation, { fontFamily: getFont('regular') }]}>
                  {dailyVerse.translation}
                </Text>
              )}
              <View style={styles.dailyVerseRefBox}>
                <Text style={[styles.dailyVerseRef, { fontFamily: getFont('medium') }]}>
                  {dailyVerse.surah_name_arabic} - الآية {dailyVerse.verse_number}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Progress Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressCard}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressIconBox}>
                <Target size={24} color={Colors.primary[600]} />
              </View>
              <Text style={[styles.progressTitle, { fontFamily: getFont('bold') }]}>تقدمك</Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={[styles.progressPercent, { fontFamily: getFont('bold') }]}>{progressPercent.toFixed(1)}%</Text>
              <Text style={[styles.progressPages, { fontFamily: getFont('regular') }]}>{stats.pagesRead} / {stats.totalPages} صفحة</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <View style={styles.lastReadRow}>
              <Text style={[styles.lastReadValue, { fontFamily: getFont('medium') }]}>{stats.lastRead}</Text>
              <Text style={[styles.lastReadLabel, { fontFamily: getFont('regular') }]}>آخر قراءة:</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={[Colors.gold[100], Colors.gold[50]]}
              style={styles.statIconBox}
            >
              <Award size={24} color={Colors.gold[600]} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>{stats.streak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>يوم متتالي</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={[Colors.primary[100], Colors.primary[50]]}
              style={styles.statIconBox}
            >
              <Star size={24} color={Colors.primary[600]} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>{stats.currentJuz}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>الجزء الحالي</Text>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInUp.delay(250).duration(400)}>
          <TouchableOpacity>
            <LinearGradient
              colors={[Colors.gold[400], Colors.gold[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <ChevronRight size={22} color={Colors.slate[900]} />
              <Text style={[styles.continueText, { fontFamily: getFont('bold') }]}>متابعة القراءة</Text>
              <Play size={20} color={Colors.slate[900]} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Juz Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.juzSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>الأجزاء</Text>
          {juzProgress.map((juz, index) => (
            <Animated.View
              key={juz.juz}
              entering={FadeInUp.delay(350 + index * 20).duration(300)}
            >
              <TouchableOpacity
                style={[styles.juzItem, { backgroundColor: theme.card, borderColor: juz.completed ? Colors.primary[500] : juz.inProgress ? Colors.gold[500] : theme.cardBorder }]}
                onPress={() => handleJuzPress(index)}
              >
                <ChevronRight size={18} color={theme.textSecondary} />
                <Text style={[styles.juzPages, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                  {juz.pagesRead}/{juz.pages}
                </Text>
                <View style={styles.juzInfo}>
                  <Text style={[styles.juzTitle, { color: theme.text, fontFamily: getFont('medium') }]}>الجزء {juz.juz}</Text>
                  <View style={[styles.juzProgressBar, { backgroundColor: theme.inputBackground }]}>
                    <LinearGradient
                      colors={juz.completed ? [Colors.primary[500], Colors.primary[600]] : [Colors.gold[400], Colors.gold[500]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.juzProgressFill, { width: `${(juz.pagesRead / juz.pages) * 100}%` }]}
                    />
                  </View>
                </View>
                {juz.completed ? (
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[600]]}
                    style={styles.juzNumber}
                  >
                    <Check size={16} color={Colors.white} strokeWidth={3} />
                  </LinearGradient>
                ) : juz.inProgress ? (
                  <LinearGradient
                    colors={[Colors.gold[400], Colors.gold[500]]}
                    style={styles.juzNumber}
                  >
                    <Text style={[styles.juzNumberText, { color: Colors.slate[900], fontFamily: getFont('bold') }]}>{juz.juz}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.juzNumber, { backgroundColor: theme.inputBackground }]}>
                    <Text style={[styles.juzNumberText, { color: theme.textSecondary, fontFamily: getFont('bold') }]}>{juz.juz}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20 },
  placeholder: { width: 44 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { fontSize: 16 },
  content: { flex: 1, padding: 20 },

  // Premium Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 150,
    height: 150,
    top: -50,
    left: -30,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    right: -20,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'flex-end',
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Daily Verse Card
  dailyVerseCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  dailyVerseHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dailyVerseLabel: {
    fontSize: 15,
    color: Colors.slate[900],
  },
  dailyVerseArabic: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    color: Colors.slate[900],
    marginBottom: 12,
  },
  dailyVerseTranslation: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    color: Colors.slate[700],
    marginBottom: 12,
  },
  dailyVerseRefBox: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dailyVerseRef: {
    fontSize: 12,
    color: Colors.slate[800],
  },

  // Progress Card
  progressCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    color: Colors.white,
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: 18,
  },
  progressPercent: {
    fontSize: 52,
    color: Colors.white,
  },
  progressPages: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  lastReadRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lastReadLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  lastReadValue: {
    fontSize: 14,
    color: Colors.white,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
  },
  statLabel: {
    fontSize: 13,
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 18,
    gap: 12,
    marginBottom: 24,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueText: {
    fontSize: 17,
    color: Colors.slate[900],
    flex: 1,
    textAlign: 'center',
  },

  // Juz Section
  juzSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'right',
  },
  juzItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 14,
  },
  juzNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  juzNumberText: {
    fontSize: 15,
  },
  juzInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  juzTitle: {
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'right',
  },
  juzProgressBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  juzProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  juzPages: {
    fontSize: 12,
  },
});
