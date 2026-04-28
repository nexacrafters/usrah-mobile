/**
 * Home Screen - Arabic Only
 */
import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Bell, Plus, Heart, MessageCircle, Bookmark, MoreHorizontal, Moon, MapPin, Sparkles, ChefHat, Calculator, BookOpen, Users, ChevronLeft, Wallet, Target, TrendingUp, TrendingDown, CheckSquare, Calendar } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Colors as ThemeColors, Typography, BorderRadius, Shadows, Spacing } from '../../../constants/theme';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { Card, Avatar, Badge } from '../../../components/ui';
import { useAuthStore } from '../../../store';
import { usePrayerCountdown, useTodayIslamicDate } from '../../../hooks/queries/useIslamic';
import { usePosts } from '../../../hooks/queries/useSocial';
import { useExpenseSummary } from '../../../hooks/queries/useExpenses';
import { useTasks } from '../../../hooks/queries/useTasks';

const { width } = Dimensions.get('window');
const fontFamily = 'Tajawal_500Medium';
const fontBold = 'Tajawal_700Bold';

const prayerNamesAr: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export default function HomeScreen() {
  const { user, family } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  // Location state for prayer times
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');

  // Get location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('الموقع غير متاح');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address) {
          setLocationName(`${address.city || address.region || ''}`);
        }
      } catch (error) {
        setLocationName('تعذر تحديد الموقع');
      }
    })();
  }, []);

  // Fetch prayer times with countdown
  const {
    prayerTimes,
    nextPrayer,
    countdown,
    refetch: refetchPrayer,
  } = usePrayerCountdown(
    location?.latitude || 0,
    location?.longitude || 0,
    user?.prayer_method || 'MWL'
  );

  // Fetch Islamic date
  const { data: islamicDate, refetch: refetchIslamicDate } = useTodayIslamicDate();

  // Fetch social posts
  const { data: postsData, refetch: refetchPosts } = usePosts(
    family?.id || '',
    { limit: 5 }
  );
  const posts = postsData?.pages?.flatMap(p => p.results) || [];

  // Fetch financial summary for male users
  const { data: expenseSummary, refetch: refetchExpenses } = useExpenseSummary(family?.id || '');

  // Fetch pending tasks
  const { data: tasksData, refetch: refetchTasks } = useTasks(family?.id || '', { status: 'pending', limit: 5 });

  const bgGradient: [string, string, string] = isDark
    ? [ThemeColors.navy[950], ThemeColors.navy[900], ThemeColors.navy[800]]
    : [Colors.cream[100], Colors.cream[50], Colors.white];
  const textColor = theme.text;
  const textSecondary = theme.textSecondary;
  const cardBg = theme.card;
  const borderColor = theme.cardBorder;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPrayer(),
      refetchIslamicDate(),
      refetchPosts(),
      refetchExpenses(),
      refetchTasks(),
    ]);
    setRefreshing(false);
  }, [refetchPrayer, refetchIslamicDate, refetchPosts]);

  // Format countdown
  const getCountdownText = () => {
    if (!countdown) return 'جاري الحساب...';
    const { hours, minutes } = countdown;
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  // Format Hijri date
  const getHijriDate = () => {
    if (!islamicDate) return 'جاري التحميل...';
    return `${islamicDate.hijri_day} ${islamicDate.hijri_month_name} ${islamicDate.hijri_year}`;
  };

  // Format post time
  const formatPostTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffDays} أيام`;
  };

  // Filter quick actions based on gender
  const isFemale = user?.gender === 'female';
  const isMale = user?.gender === 'male';

  const allQuickActions = [
    // Male-focused actions
    { id: '1', title: 'الميزانية', icon: Wallet, color: Colors.success, href: '/(app)/finance/budgets', femaleOnly: false, maleOnly: true },
    { id: '2', title: 'الأهداف', icon: Target, color: Colors.gold[600], href: '/(app)/goals', femaleOnly: false, maleOnly: true },
    { id: '3', title: 'حلقة الإخوة', icon: Users, color: Colors.primary[600], href: '/(app)/brothers-circle', femaleOnly: false, maleOnly: true },
    { id: '4', title: 'حاسبة الزكاة', icon: Calculator, color: Colors.primary[500], href: '/(app)/islamic/zakat', femaleOnly: false, maleOnly: true },
    // Female-focused actions
    { id: '5', title: 'حلقة الأخوات', icon: Sparkles, color: Colors.sisters[500], href: '/(app)/sisters-circle', femaleOnly: true, maleOnly: false },
    { id: '6', title: 'الوصفات', icon: ChefHat, color: Colors.gold[500], href: '/(app)/recipes', femaleOnly: true, maleOnly: false },
    { id: '7', title: 'المهام', icon: CheckSquare, color: Colors.primary[500], href: '/(app)/(tabs)/tasks', femaleOnly: true, maleOnly: false },
    { id: '8', title: 'التقويم', icon: Calendar, color: Colors.info, href: '/(app)/calendar', femaleOnly: true, maleOnly: false },
  ];

  const quickActions = allQuickActions.filter(action => {
    if (action.femaleOnly && !isFemale) return false;
    if (action.maleOnly && !isMale) return false;
    return true;
  });

  const getReactionIcon = (type: string) => {
    const icons: Record<string, { emoji: string; color: string }> = {
      love: { emoji: '❤️', color: Colors.error },
      mashallah: { emoji: '✨', color: Colors.reactions.mashallah },
      alhamdulillah: { emoji: '🙏', color: Colors.reactions.alhamdulillah },
      jazakallah: { emoji: '💫', color: Colors.reactions.jazakallah },
    };
    return icons[type] || icons.love;
  };

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: cardBg, borderColor }]}>
            <Bell size={22} color={textColor} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { fontFamily, color: textSecondary }]}>السلام عليكم</Text>
            <Text style={[styles.familyName, { fontFamily: fontBold, color: textColor }]}>{family?.name || 'مرحباً بك في أسرة'}</Text>
          </View>
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold[500]} />}>
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <Link href="/(app)/islamic/prayer-times" asChild>
              <TouchableOpacity activeOpacity={0.9}>
                <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.prayerCard}>
                  <View style={[styles.decorCircle, styles.decorCircle1]} />
                  <View style={[styles.decorCircle, styles.decorCircle2]} />
                  <View style={styles.prayerHeader}>
                    <View style={styles.prayerHijri}><Text style={[styles.hijriDate, { fontFamily }]}>{getHijriDate()}</Text></View>
                    <View style={styles.prayerIconBox}><Moon size={22} color={Colors.gold[400]} /></View>
                  </View>
                  <View style={styles.prayerContent}>
                    <View style={styles.prayerTimeBox}>
                      <Text style={[styles.prayerTime, { fontFamily: fontBold }]}>{nextPrayer?.time || '--:--'}</Text>
                      <Text style={[styles.prayerRemaining, { fontFamily }]}>بعد {getCountdownText()}</Text>
                    </View>
                    <View style={styles.prayerNameBox}>
                      <Text style={[styles.nextPrayerLabel, { fontFamily }]}>الصلاة القادمة</Text>
                      <Text style={[styles.prayerName, { fontFamily: fontBold }]}>
                        {nextPrayer ? (prayerNamesAr[nextPrayer.name] || nextPrayer.name) : 'جاري التحميل...'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.prayerFooter}>
                    <ChevronLeft size={16} color={Colors.primary[200]} />
                    <Text style={[styles.locationText, { fontFamily }]}>{locationName}</Text>
                    <MapPin size={14} color={Colors.primary[200]} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Financial Overview - For Male Users */}
          {isMale && (
            <Animated.View entering={FadeInUp.duration(500).delay(150)}>
              <Link href="/(app)/(tabs)/expenses" asChild>
                <TouchableOpacity activeOpacity={0.9}>
                  <View style={[styles.financeCard, { backgroundColor: cardBg, borderColor }]}>
                    <View style={styles.financeHeader}>
                      <View style={[styles.financeIconBox, { backgroundColor: Colors.success + '20' }]}>
                        <Wallet size={24} color={Colors.success} />
                      </View>
                      <View style={styles.financeHeaderText}>
                        <Text style={[styles.financeTitle, { fontFamily: fontBold, color: textColor }]}>الملخص المالي</Text>
                        <Text style={[styles.financeSubtitle, { fontFamily, color: textSecondary }]}>هذا الشهر</Text>
                      </View>
                      <ChevronLeft size={20} color={textSecondary} />
                    </View>
                    <View style={styles.financeStats}>
                      <View style={styles.financeStat}>
                        <View style={[styles.financeStatIcon, { backgroundColor: Colors.success + '15' }]}>
                          <TrendingUp size={18} color={Colors.success} />
                        </View>
                        <Text style={[styles.financeStatLabel, { fontFamily, color: textSecondary }]}>الدخل</Text>
                        <Text style={[styles.financeStatValue, { fontFamily: fontBold, color: Colors.success }]}>
                          {expenseSummary?.total_income?.toLocaleString() || '0'} د.ت
                        </Text>
                      </View>
                      <View style={[styles.financeStatDivider, { backgroundColor: borderColor }]} />
                      <View style={styles.financeStat}>
                        <View style={[styles.financeStatIcon, { backgroundColor: Colors.error + '15' }]}>
                          <TrendingDown size={18} color={Colors.error} />
                        </View>
                        <Text style={[styles.financeStatLabel, { fontFamily, color: textSecondary }]}>المصروفات</Text>
                        <Text style={[styles.financeStatValue, { fontFamily: fontBold, color: Colors.error }]}>
                          {expenseSummary?.total_expenses?.toLocaleString() || '0'} د.ت
                        </Text>
                      </View>
                      <View style={[styles.financeStatDivider, { backgroundColor: borderColor }]} />
                      <View style={styles.financeStat}>
                        <View style={[styles.financeStatIcon, { backgroundColor: Colors.gold[500] + '15' }]}>
                          <Target size={18} color={Colors.gold[600]} />
                        </View>
                        <Text style={[styles.financeStatLabel, { fontFamily, color: textSecondary }]}>الميزانية</Text>
                        <Text style={[styles.financeStatValue, { fontFamily: fontBold, color: Colors.gold[600] }]}>
                          {expenseSummary?.budget_remaining?.toLocaleString() || '0'} د.ت
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          )}

          {/* Pending Tasks - For Male Users */}
          {isMale && tasksData?.results && tasksData.results.length > 0 && (
            <Animated.View entering={FadeInUp.duration(500).delay(200)}>
              <View style={[styles.tasksCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tasksHeader}>
                  <Link href="/(app)/(tabs)/tasks" asChild>
                    <TouchableOpacity style={styles.tasksViewAll}>
                      <ChevronLeft size={16} color={Colors.primary[500]} />
                      <Text style={[styles.tasksViewAllText, { fontFamily, color: Colors.primary[500] }]}>عرض الكل</Text>
                    </TouchableOpacity>
                  </Link>
                  <View style={styles.tasksHeaderRight}>
                    <View style={[styles.tasksIconBox, { backgroundColor: Colors.primary[500] + '20' }]}>
                      <CheckSquare size={20} color={Colors.primary[500]} />
                    </View>
                    <Text style={[styles.tasksTitle, { fontFamily: fontBold, color: textColor }]}>المهام المعلقة</Text>
                  </View>
                </View>
                {tasksData.results.slice(0, 3).map((task: any, index: number) => (
                  <View key={task.id} style={[styles.taskItem, index < 2 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                    <View style={[styles.taskPriority, { backgroundColor: task.priority === 'urgent' ? Colors.error : task.priority === 'high' ? Colors.warning : Colors.primary[500] }]} />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { fontFamily, color: textColor }]} numberOfLines={1}>{task.title}</Text>
                      {task.due_date && (
                        <Text style={[styles.taskDue, { fontFamily, color: textSecondary }]}>
                          <Calendar size={12} color={textSecondary} /> {new Date(task.due_date).toLocaleDateString('ar-TN')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: textColor }]}>إجراءات سريعة</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <Animated.View key={action.id} entering={FadeInUp.duration(400).delay(200 + index * 50)}>
                  <Link href={action.href as any} asChild>
                    <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: cardBg, borderColor }]} activeOpacity={0.7}>
                      <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                        <action.icon size={24} color={action.color} />
                      </View>
                      <Text style={[styles.quickActionText, { color: textColor }]}>{action.title}</Text>
                      <ChevronLeft size={16} color={textSecondary} style={styles.quickActionArrow} />
                    </TouchableOpacity>
                  </Link>
                </Animated.View>
              ))}
            </View>
          </View>

          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <Card variant="gradient" gradientColors={[Colors.gold[600], Colors.gold[700]]} padding="lg" style={styles.villageCard}>
              <View style={styles.villageCardContent}>
                <View style={styles.villageInfo}>
                  <Badge label="وصفات القرية" variant="gold" size="sm" />
                  <Text style={[styles.villageTitle, { fontFamily: fontBold }]}>شارك مع الجيران</Text>
                  <Text style={[styles.villageDesc, { fontFamily }]}>شارك وصفات عائلتك مع العائلات الأخرى</Text>
                </View>
                <View style={styles.villageIconBox}><Users size={26} color={Colors.navy[950]} /></View>
              </View>
              <Link href="/(app)/recipes" asChild>
                <TouchableOpacity style={styles.villageButton}>
                  <ChevronLeft size={18} color={Colors.navy[950]} />
                  <Text style={[styles.villageButtonText, { fontFamily: fontBold }]}>تصفح وصفات القرية</Text>
                </TouchableOpacity>
              </Link>
            </Card>
          </Animated.View>

          <View style={styles.feedSection}>
            <View style={styles.feedHeader}>
              <TouchableOpacity style={[styles.addPostButton, { backgroundColor: cardBg }]}><Plus size={20} color={Colors.gold[500]} /></TouchableOpacity>
              <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: textColor }]}>أخبار العائلة</Text>
            </View>

            {posts.length === 0 && (
              <View style={[styles.emptyPosts, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.emptyPostsText, { fontFamily, color: textSecondary }]}>لا توجد منشورات بعد</Text>
                <Text style={[styles.emptyPostsSubtext, { fontFamily, color: textSecondary }]}>كن أول من يشارك مع العائلة!</Text>
              </View>
            )}

            {posts.map((post, index) => {
              // Convert reactions_count object to array for display
              const reactionsArray = Object.entries(post.reactions_count || {})
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => ({ type, count }));

              return (
                <Animated.View key={post.id} entering={FadeInUp.duration(500).delay(500 + index * 100)}>
                  <View style={[styles.postCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, borderRadius: BorderRadius.xl }]}>
                    <View style={styles.postHeader}>
                      <TouchableOpacity style={styles.moreButton}><MoreHorizontal size={20} color={textSecondary} /></TouchableOpacity>
                      <View style={styles.postAuthor}>
                        <View style={styles.authorInfo}>
                          <Text style={[styles.authorName, { fontFamily: fontBold, color: textColor }]}>{post.author?.full_name || 'مستخدم'}</Text>
                          <Text style={[styles.postTime, { fontFamily, color: textSecondary }]}>{formatPostTime(post.created)}</Text>
                        </View>
                        <Avatar name={post.author?.full_name || 'مستخدم'} size="md" verified={post.author?.is_verified} />
                      </View>
                    </View>
                    {post.content && <Text style={[styles.postContent, { fontFamily, color: textColor }]}>{post.content}</Text>}
                    {post.media && post.media.length > 0 && post.media[0].type === 'image' && (
                      <View style={[styles.postMedia, { backgroundColor: theme.surfaceVariant }]}>
                        <ChefHat size={44} color={textSecondary} />
                        <Text style={[styles.mediaPlaceholder, { fontFamily, color: textSecondary }]}>صورة</Text>
                      </View>
                    )}
                    <View style={styles.reactionsRow}>
                      <Text style={[styles.commentsCount, { fontFamily, color: textSecondary }]}>{post.comments_count || 0} تعليقات</Text>
                      {reactionsArray.map((reaction, idx) => {
                        const { emoji, color } = getReactionIcon(reaction.type);
                        return (
                          <View key={idx} style={styles.reactionBadge}>
                            <Text style={[styles.reactionCount, { color, fontFamily }]}>{reaction.count}</Text>
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={[styles.postActions, { borderTopColor: borderColor }]}>
                      <TouchableOpacity style={styles.postAction}><Text style={[styles.actionText, { fontFamily, color: textSecondary }]}>حفظ</Text><Bookmark size={20} color={textSecondary} /></TouchableOpacity>
                      <TouchableOpacity style={styles.postAction}><Text style={[styles.actionText, { fontFamily, color: textSecondary }]}>تعليق</Text><MessageCircle size={20} color={textSecondary} /></TouchableOpacity>
                      <TouchableOpacity style={styles.postAction}><Text style={[styles.actionText, { fontFamily, color: textSecondary }]}>تفاعل</Text><Heart size={20} color={textSecondary} /></TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        <TouchableOpacity activeOpacity={0.9} style={styles.fabContainer}>
          <LinearGradient colors={[Colors.gold[500], Colors.gold[600]]} style={styles.fab}><Plus size={28} color={Colors.navy[950]} /></LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  headerText: { alignItems: 'flex-end' },
  greeting: { fontSize: Typography.sizes.body },
  familyName: { fontSize: Typography.sizes.h3, marginTop: 2 },
  notificationButton: { width: 48, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notificationBadge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold[500], borderWidth: 2, borderColor: Colors.white },
  content: { flex: 1 },
  prayerCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], borderRadius: BorderRadius['2xl'], padding: Spacing.xl, overflow: 'hidden', ...Shadows.lg },
  decorCircle: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle1: { width: 120, height: 120, top: -40, right: -40 },
  decorCircle2: { width: 80, height: 80, bottom: -20, left: -20 },
  prayerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  prayerIconBox: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  prayerHijri: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  hijriDate: { fontSize: Typography.sizes.caption, color: Colors.text.primary },
  prayerContent: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  prayerNameBox: { alignItems: 'flex-end' },
  nextPrayerLabel: { fontSize: Typography.sizes.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  prayerName: { fontSize: Typography.sizes.h2, color: Colors.text.primary },
  prayerTimeBox: { alignItems: 'flex-start' },
  prayerTime: { fontSize: Typography.sizes.h1, color: Colors.gold[400] },
  prayerRemaining: { fontSize: Typography.sizes.caption, color: 'rgba(255,255,255,0.7)' },
  prayerFooter: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', gap: Spacing.xs },
  locationText: { fontSize: Typography.sizes.caption, color: 'rgba(255,255,255,0.6)', flex: 1, textAlign: 'right' },
  quickActionsSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.sizes.bodyLarge, marginBottom: Spacing.md, textAlign: 'right', paddingHorizontal: 4 },
  quickActionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickActionCard: { width: (width - Spacing.lg * 2 - 10) / 2, borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 100, justifyContent: 'space-between' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  quickActionText: { fontSize: 14, textAlign: 'right', marginTop: 12, fontFamily: 'Tajawal_600SemiBold' },
  quickActionArrow: { position: 'absolute', bottom: 16, left: 14 },
  villageCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  villageCardContent: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.lg, marginBottom: Spacing.lg },
  villageIconBox: { width: 52, height: 52, borderRadius: BorderRadius.xl, backgroundColor: 'rgba(10, 22, 40, 0.2)', justifyContent: 'center', alignItems: 'center' },
  villageInfo: { flex: 1, gap: Spacing.xs, alignItems: 'flex-end' },
  villageTitle: { fontSize: Typography.sizes.h4, color: Colors.navy[950], textAlign: 'right' },
  villageDesc: { fontSize: Typography.sizes.bodySmall, color: Colors.navy[800], lineHeight: 20, textAlign: 'right' },
  villageButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 22, 40, 0.15)', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.xs },
  villageButtonText: { fontSize: Typography.sizes.body, color: Colors.navy[950] },
  feedSection: { paddingHorizontal: Spacing.xl },
  feedHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  addPostButton: { width: 36, height: 36, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.gold[500], justifyContent: 'center', alignItems: 'center' },
  postCard: { marginBottom: Spacing.lg },
  postHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  postAuthor: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  authorInfo: { gap: 2, alignItems: 'flex-end' },
  authorName: { fontSize: Typography.sizes.body, textAlign: 'right' },
  postTime: { fontSize: Typography.sizes.caption },
  moreButton: { padding: Spacing.xs },
  postContent: { fontSize: Typography.sizes.body, lineHeight: 24, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, textAlign: 'right', writingDirection: 'rtl' },
  postMedia: { height: 200, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  mediaPlaceholder: { fontSize: Typography.sizes.bodySmall },
  reactionsRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  reactionBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: Typography.sizes.caption },
  commentsCount: { fontSize: Typography.sizes.caption, marginRight: 'auto' },
  postActions: { flexDirection: 'row-reverse', borderTopWidth: 1 },
  postAction: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  actionText: { fontSize: Typography.sizes.bodySmall },
  fabContainer: { position: 'absolute', left: Spacing.xl, bottom: 100 },
  fab: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...Shadows.gold },
  emptyPosts: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.lg },
  emptyPostsText: { fontSize: Typography.sizes.bodyLarge, marginBottom: Spacing.xs },
  emptyPostsSubtext: { fontSize: Typography.sizes.bodySmall },
  // Financial Card Styles
  financeCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing.lg, ...Shadows.md },
  financeHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: Spacing.lg },
  financeIconBox: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  financeHeaderText: { flex: 1, marginRight: Spacing.md, alignItems: 'flex-end' },
  financeTitle: { fontSize: Typography.sizes.bodyLarge },
  financeSubtitle: { fontSize: Typography.sizes.caption, marginTop: 2 },
  financeStats: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  financeStat: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  financeStatIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  financeStatLabel: { fontSize: Typography.sizes.caption },
  financeStatValue: { fontSize: Typography.sizes.body },
  financeStatDivider: { width: 1, height: 60, marginHorizontal: Spacing.sm },
  // Tasks Card Styles
  tasksCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing.lg, ...Shadows.md },
  tasksHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  tasksHeaderRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  tasksIconBox: { width: 36, height: 36, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  tasksTitle: { fontSize: Typography.sizes.body },
  tasksViewAll: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  tasksViewAllText: { fontSize: Typography.sizes.bodySmall },
  taskItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  taskPriority: { width: 4, height: 32, borderRadius: 2 },
  taskContent: { flex: 1, alignItems: 'flex-end' },
  taskTitle: { fontSize: Typography.sizes.body },
  taskDue: { fontSize: Typography.sizes.caption, marginTop: 4, flexDirection: 'row', alignItems: 'center' },
});
