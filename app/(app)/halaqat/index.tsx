/**
 * Halaqat (Islamic Study Circles) Screen with Premium UI
 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Video,
  ChevronRight,
  ChevronLeft,
  Play,
  User,
  GraduationCap,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { useHalaqat, useMyEnrollments, useEnrollInHalaqa, halaqatApi } from '../../../hooks/queries/useHalaqat';
import type { Halaqa } from '../../../services/api/halaqat';

export default function HalaqatScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data from API
  const {
    data: halaqatData,
    isLoading: halaqatLoading,
    refetch: refetchHalaqat,
    fetchNextPage,
    hasNextPage,
  } = useHalaqat({ status: 'active' });
  const { data: myEnrollments = [], isLoading: enrollmentsLoading, refetch: refetchEnrollments } = useMyEnrollments();
  const enrollMutation = useEnrollInHalaqa();

  // Flatten paginated data
  const allHalaqat = useMemo(() =>
    halaqatData?.pages.flatMap(page => page.results) || [],
    [halaqatData]
  );

  // Separate my halaqat from discover
  const myEnrollmentIds = useMemo(() =>
    new Set(myEnrollments.map(e => e.halaqa_id)),
    [myEnrollments]
  );

  const myHalaqat = useMemo(() =>
    allHalaqat.filter(h => myEnrollmentIds.has(h.id)),
    [allHalaqat, myEnrollmentIds]
  );

  const discoverHalaqat = useMemo(() =>
    allHalaqat.filter(h => !myEnrollmentIds.has(h.id)),
    [allHalaqat, myEnrollmentIds]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchHalaqat(), refetchEnrollments()]);
    setRefreshing(false);
  }, [refetchHalaqat, refetchEnrollments]);

  const isLoading = halaqatLoading || enrollmentsLoading;

  // Get enrollment progress for a halaqa
  const getEnrollmentProgress = (halaqaId: string) => {
    const enrollment = myEnrollments.find(e => e.halaqa_id === halaqaId);
    return enrollment?.progress || 0;
  };

  // Get level label with color
  const getLevelInfo = (level: string) => {
    const levels: Record<string, { en: string; ar: string; color: string }> = {
      beginner: { en: 'Beginner', ar: 'مبتدئ', color: Colors.success },
      intermediate: { en: 'Intermediate', ar: 'متوسط', color: Colors.gold[500] },
      advanced: { en: 'Advanced', ar: 'متقدم', color: Colors.primary[600] },
    };
    return levels[level] || { en: level, ar: level, color: Colors.slate[500] };
  };

  // Handle enrollment
  const handleEnroll = async (halaqaId: string) => {
    try {
      await enrollMutation.mutateAsync(halaqaId);
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={[styles.headerContent, rtl && styles.rowReverse]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <BackIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={[styles.headerCenter, rtl && styles.alignEnd]}>
              <View style={[styles.headerTitleRow, rtl && styles.rowReverse]}>
                <GraduationCap size={24} color={Colors.gold[400]} />
                <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'الحلقات' : 'Halaqat'}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'حلقات دراسية إسلامية' : 'Islamic Study Circles'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/halaqat/create')}>
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[500]]}
                style={styles.addButton}
              >
                <Plus size={22} color={Colors.slate[900]} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.statsRow, rtl && styles.rowReverse]}>
          <LinearGradient
            colors={isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconBox}>
              <BookOpen size={22} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.statNumber, { fontFamily: getFont('bold') }]}>{myHalaqat.length}</Text>
            <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
              {rtl ? 'حلقاتي' : 'My Halaqat'}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={isDark ? [Colors.gold[600], Colors.gold[700]] : [Colors.gold[400], Colors.gold[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={[styles.statIconBox, { backgroundColor: Colors.white }]}>
              <Clock size={22} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.statNumber, { fontFamily: getFont('bold'), color: Colors.slate[900] }]}>
              {myEnrollments.reduce((sum, e) => sum + (e.hours_attended || 0), 0)}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: getFont('regular'), color: Colors.slate[800] }]}>
              {rtl ? 'ساعات هذا الشهر' : 'Hours This Month'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'my' && styles.tabActive]}
              onPress={() => setActiveTab('my')}
            >
              {activeTab === 'my' ? (
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  style={styles.tabGradient}
                >
                  <Text style={[styles.tabText, { color: Colors.white, fontFamily: getFont('bold') }]}>
                    {rtl ? 'حلقاتي' : 'My Halaqat'}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.tabText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'حلقاتي' : 'My Halaqat'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
              onPress={() => setActiveTab('discover')}
            >
              {activeTab === 'discover' ? (
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  style={styles.tabGradient}
                >
                  <Text style={[styles.tabText, { color: Colors.white, fontFamily: getFont('bold') }]}>
                    {rtl ? 'اكتشف' : 'Discover'}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.tabText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'اكتشف' : 'Discover'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}

        {/* My Halaqat */}
        {activeTab === 'my' && !isLoading && (
          <View style={styles.section}>
            {myHalaqat.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyContainer}>
                <LinearGradient
                  colors={[Colors.primary[100], Colors.primary[50]]}
                  style={styles.emptyIconBox}
                >
                  <BookOpen size={48} color={Colors.primary[500]} />
                </LinearGradient>
                <Text style={[styles.emptyText, { color: theme.text, fontFamily: getFont('bold') }]}>
                  {rtl ? 'لم تنضم لأي حلقة بعد' : 'No enrolled halaqat yet'}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'اكتشف الحلقات المتاحة' : 'Discover available study circles'}
                </Text>
                <TouchableOpacity onPress={() => setActiveTab('discover')}>
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.discoverButton}
                  >
                    <Sparkles size={18} color={Colors.white} />
                    <Text style={[styles.discoverButtonText, { fontFamily: getFont('bold') }]}>
                      {rtl ? 'اكتشف الآن' : 'Discover Now'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              myHalaqat.map((halaqa, index) => {
                const progress = getEnrollmentProgress(halaqa.id);
                const enrollment = myEnrollments.find(e => e.halaqa_id === halaqa.id);
                const levelInfo = getLevelInfo(halaqa.level);

                return (
                  <Animated.View
                    key={halaqa.id}
                    entering={FadeInUp.delay(index * 80).duration(400)}
                  >
                    <TouchableOpacity
                      style={[styles.halaqaCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => router.push(`/halaqat/${halaqa.id}`)}
                    >
                      <View style={[styles.halaqaHeader, rtl && styles.rowReverse]}>
                        <LinearGradient
                          colors={halaqa.is_online
                            ? [Colors.primary[100], Colors.primary[50]]
                            : [Colors.gold[100], Colors.gold[50]]}
                          style={styles.halaqaIcon}
                        >
                          {halaqa.is_online
                            ? <Video size={26} color={Colors.primary[500]} />
                            : <BookOpen size={26} color={Colors.gold[600]} />}
                        </LinearGradient>
                        <View style={[styles.halaqaInfo, rtl && styles.halaqaInfoRTL]}>
                          <Text style={[styles.halaqaTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                            {halaqa.title}
                          </Text>
                          <View style={[styles.halaqaMeta, rtl && styles.rowReverse]}>
                            <User size={14} color={theme.textSecondary} />
                            <Text style={[styles.halaqaMetaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                              {halaqa.teacher_name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.levelBadge, { backgroundColor: `${levelInfo.color}15` }]}>
                          <Text style={[styles.levelText, { color: levelInfo.color, fontFamily: getFont('bold') }]}>
                            {rtl ? levelInfo.ar : levelInfo.en}
                          </Text>
                        </View>
                      </View>

                      {/* Progress */}
                      <View style={styles.progressSection}>
                        <View style={[styles.progressHeader, rtl && styles.rowReverse]}>
                          <Text style={[styles.progressLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {rtl ? 'التقدم' : 'Progress'}
                          </Text>
                          <Text style={[styles.progressValue, { color: Colors.primary[500], fontFamily: getFont('bold') }]}>
                            {progress}%
                          </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
                          <LinearGradient
                            colors={[Colors.primary[400], Colors.primary[600]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${progress}%` }]}
                          />
                        </View>
                        {enrollment?.next_lesson && (
                          <Text style={[styles.nextLesson, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                            {rtl ? 'الدرس التالي: ' : 'Next: '}{enrollment.next_lesson}
                          </Text>
                        )}
                      </View>

                      {/* Schedule */}
                      <View style={[styles.scheduleRow, { borderTopColor: theme.cardBorder }, rtl && styles.rowReverse]}>
                        <View style={[styles.scheduleItem, rtl && styles.rowReverse]}>
                          <Calendar size={14} color={theme.textSecondary} />
                          <Text style={[styles.scheduleText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {halaqa.schedule_day || (rtl ? 'لم يحدد' : 'TBD')}
                          </Text>
                        </View>
                        <View style={[styles.scheduleItem, rtl && styles.rowReverse]}>
                          <Clock size={14} color={theme.textSecondary} />
                          <Text style={[styles.scheduleText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {halaqa.schedule_time || '--:--'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push(`/halaqat/${halaqa.id}/session`)}>
                          <LinearGradient
                            colors={[Colors.primary[500], Colors.primary[600]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.joinButton, rtl && styles.rowReverse]}
                          >
                            <Play size={14} color={Colors.white} />
                            <Text style={[styles.joinText, { fontFamily: getFont('bold') }]}>
                              {rtl ? 'انضم' : 'Join'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        {/* Discover */}
        {activeTab === 'discover' && !isLoading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'حلقات متاحة' : 'Available Halaqat'}
            </Text>

            {discoverHalaqat.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyContainer}>
                <LinearGradient
                  colors={[Colors.gold[100], Colors.gold[50]]}
                  style={styles.emptyIconBox}
                >
                  <Star size={48} color={Colors.gold[500]} />
                </LinearGradient>
                <Text style={[styles.emptyText, { color: theme.text, fontFamily: getFont('bold') }]}>
                  {rtl ? 'لا توجد حلقات متاحة حالياً' : 'No halaqat available now'}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'تحقق مرة أخرى قريباً' : 'Check back soon'}
                </Text>
              </Animated.View>
            ) : (
              discoverHalaqat.map((halaqa, index) => {
                const levelInfo = getLevelInfo(halaqa.level);

                return (
                  <Animated.View
                    key={halaqa.id}
                    entering={FadeInUp.delay(index * 80).duration(400)}
                  >
                    <TouchableOpacity
                      style={[styles.discoverCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => router.push(`/halaqat/${halaqa.id}`)}
                    >
                      <View style={[styles.halaqaHeader, rtl && styles.rowReverse]}>
                        <LinearGradient
                          colors={halaqa.is_online
                            ? [Colors.primary[100], Colors.primary[50]]
                            : [Colors.gold[100], Colors.gold[50]]}
                          style={styles.halaqaIcon}
                        >
                          {halaqa.is_online
                            ? <Video size={26} color={Colors.primary[500]} />
                            : <BookOpen size={26} color={Colors.gold[600]} />}
                        </LinearGradient>
                        <View style={[styles.halaqaInfo, rtl && styles.halaqaInfoRTL]}>
                          <Text style={[styles.halaqaTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                            {halaqa.title}
                          </Text>
                          <View style={[styles.halaqaMeta, rtl && styles.rowReverse]}>
                            <User size={14} color={theme.textSecondary} />
                            <Text style={[styles.halaqaMetaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                              {halaqa.teacher_name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.levelBadge, { backgroundColor: `${levelInfo.color}15` }]}>
                          <Text style={[styles.levelText, { color: levelInfo.color, fontFamily: getFont('bold') }]}>
                            {rtl ? levelInfo.ar : levelInfo.en}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.discoverMeta, rtl && styles.rowReverse]}>
                        <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                          <View style={[styles.metaIconBox, { backgroundColor: Colors.primary[100] }]}>
                            <Calendar size={14} color={Colors.primary[600]} />
                          </View>
                          <Text style={[styles.metaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {halaqa.schedule_day || '--'} {halaqa.schedule_time || '--:--'}
                          </Text>
                        </View>
                        <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                          <View style={[styles.metaIconBox, { backgroundColor: Colors.gold[100] }]}>
                            <MapPin size={14} color={Colors.gold[600]} />
                          </View>
                          <Text style={[styles.metaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {halaqa.is_online ? (rtl ? 'عبر الإنترنت' : 'Online') : (halaqa.location || (rtl ? 'غير محدد' : 'TBD'))}
                          </Text>
                        </View>
                        <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                          <View style={[styles.metaIconBox, { backgroundColor: Colors.sisters[100] }]}>
                            <Users size={14} color={Colors.sisters[600]} />
                          </View>
                          <Text style={[styles.metaText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {halaqa.enrolled_count || 0}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEnroll(halaqa.id);
                        }}
                        disabled={enrollMutation.isPending}
                      >
                        <LinearGradient
                          colors={[Colors.gold[400], Colors.gold[500]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.enrollButton}
                        >
                          <Sparkles size={18} color={Colors.slate[900]} />
                          <Text style={[styles.enrollText, { fontFamily: getFont('bold') }]}>
                            {enrollMutation.isPending ? (rtl ? 'جارٍ التسجيل...' : 'Enrolling...') : (rtl ? 'سجل الآن' : 'Enroll Now')}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}

            {hasNextPage && (
              <Animated.View entering={FadeInUp.duration(300)}>
                <TouchableOpacity onPress={() => fetchNextPage()}>
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loadMoreButton}
                  >
                    <Text style={[styles.loadMoreText, { fontFamily: getFont('bold') }]}>
                      {rtl ? 'تحميل المزيد' : 'Load More'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  content: { flex: 1 },

  // Header
  header: {
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
    right: -30,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    padding: 20,
    paddingTop: 20,
    marginTop: -10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {},
  tabGradient: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },

  // Section
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },

  // Halaqa Card
  halaqaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  halaqaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  halaqaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halaqaInfo: {
    flex: 1,
  },
  halaqaInfoRTL: {
    alignItems: 'flex-end',
  },
  halaqaTitle: {
    fontSize: 17,
    marginBottom: 6,
  },
  halaqaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  halaqaMetaText: {
    fontSize: 13,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 12,
  },

  // Progress
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 15,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLesson: {
    fontSize: 12,
  },

  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    fontSize: 13,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  joinText: {
    fontSize: 13,
    color: Colors.white,
  },

  // Discover Card
  discoverCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  discoverMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  enrollText: {
    fontSize: 15,
    color: Colors.slate[900],
  },

  // Loading & Empty
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  discoverButtonText: {
    fontSize: 15,
    color: Colors.white,
  },

  // Load More
  loadMoreButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 15,
    color: Colors.white,
  },
});
