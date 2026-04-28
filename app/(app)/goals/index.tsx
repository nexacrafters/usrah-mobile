/**
 * Family Goals Screen - Enhanced UI
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Target, Plus, TrendingUp, Calendar, Users, ChevronRight, ChevronLeft, Trophy, Wallet, PiggyBank, Home, Car, GraduationCap, Heart, Plane, Star, Sparkles, MoreHorizontal } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { ScreenHeader } from '../../../components/ui';
import { useAuthStore } from '../../../store';
import { useGoals, goalsApi } from '../../../hooks/queries/useGoals';
import type { FamilyGoal, GoalCategory } from '../../../services/api/goals';

const { width } = Dimensions.get('window');

const categoryStyles: Record<string, { color: string; bgColor: string; gradient: [string, string]; icon: any }> = {
  hajj: { color: Colors.gold[500], bgColor: Colors.gold[100], gradient: [Colors.gold[500], Colors.gold[600]], icon: Star },
  umrah: { color: Colors.primary[500], bgColor: Colors.primary[100], gradient: [Colors.primary[500], Colors.primary[600]], icon: Sparkles },
  education: { color: Colors.sisters[500], bgColor: Colors.sisters[100], gradient: [Colors.sisters[500], Colors.sisters[600]], icon: GraduationCap },
  home: { color: '#f59e0b', bgColor: '#fef3c7', gradient: ['#f59e0b', '#d97706'], icon: Home },
  car: { color: '#3b82f6', bgColor: '#dbeafe', gradient: ['#3b82f6', '#2563eb'], icon: Car },
  emergency: { color: Colors.error, bgColor: '#fee2e2', gradient: [Colors.error, '#dc2626'], icon: Heart },
  wedding: { color: '#ec4899', bgColor: '#fce7f3', gradient: ['#ec4899', '#db2777'], icon: Heart },
  charity: { color: Colors.success, bgColor: '#dcfce7', gradient: [Colors.success, '#16a34a'], icon: Heart },
  savings: { color: Colors.primary[500], bgColor: Colors.primary[100], gradient: [Colors.primary[500], Colors.primary[700]], icon: PiggyBank },
  travel: { color: '#06b6d4', bgColor: '#cffafe', gradient: ['#06b6d4', '#0891b2'], icon: Plane },
  other: { color: Colors.slate[500], bgColor: Colors.slate[100], gradient: [Colors.slate[500], Colors.slate[600]], icon: Target },
};

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const { family } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch goals from API
  const { data: goals = [], isLoading, refetch } = useGoals(family?.id || '', 'active');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + goalsApi.calculateProgress(g), 0) / goals.length)
      : 0;
    const nearComplete = goals.filter(g => goalsApi.calculateProgress(g) >= 80).length;
    return { totalTarget, totalSaved, avgProgress, nearComplete };
  }, [goals]);

  // Filter goals by category
  const filteredGoals = selectedCategory
    ? goals.filter(g => g.category === selectedCategory)
    : goals;

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(goals.map(g => g.category))];
    return cats;
  }, [goals]);

  const getCategoryStyle = (category: GoalCategory) => {
    return categoryStyles[category] || categoryStyles.other;
  };

  const formatDeadline = (date?: string) => {
    if (!date) return rtl ? 'بدون موعد' : 'No deadline';
    return new Date(date).toLocaleDateString(rtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (category: GoalCategory) => {
    const info = goalsApi.getCategoryInfo(category);
    return rtl ? info.labelAr : info.label;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={rtl ? 'أهداف العائلة' : 'Family Goals'}
        showBack
        rightAction={{
          icon: Plus,
          onPress: () => router.push('/goals/add'),
        }}
      />

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
        {/* Overview Stats Card */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[Colors.primary[600], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={[styles.summaryHeader, rtl && styles.rowReverse]}>
              <View style={styles.summaryIconBox}>
                <Target size={24} color={Colors.gold[400]} />
              </View>
              <View style={[styles.summaryHeaderText, rtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.summaryTitle}>
                  {rtl ? 'نظرة عامة على الأهداف' : 'Goals Overview'}
                </Text>
                <Text style={styles.summarySubtitle}>
                  {rtl ? 'تتبع تقدمك' : 'Track your progress'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Trophy size={18} color={Colors.gold[400]} />
                </View>
                <Text style={styles.statValue}>{goals.length}</Text>
                <Text style={styles.statLabel}>{rtl ? 'أهداف' : 'Goals'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <TrendingUp size={18} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{stats.avgProgress}%</Text>
                <Text style={styles.statLabel}>{rtl ? 'التقدم' : 'Progress'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Wallet size={18} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{(stats.totalSaved / 1000).toFixed(0)}K</Text>
                <Text style={styles.statLabel}>{rtl ? 'تم توفيره' : 'Saved'}</Text>
              </View>
            </View>

            {/* Progress to Total Target */}
            <View style={styles.totalProgress}>
              <View style={[styles.totalProgressHeader, rtl && styles.rowReverse]}>
                <Text style={styles.totalProgressLabel}>
                  {rtl ? 'إجمالي التوفير' : 'Total Savings'}
                </Text>
                <Text style={styles.totalProgressValue}>
                  {stats.totalSaved.toLocaleString()} / {stats.totalTarget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.totalTarget > 0 ? (stats.totalSaved / stats.totalTarget) * 100 : 0}%` }]} />
              </View>
            </View>

            {stats.nearComplete > 0 && (
              <View style={[styles.celebrationBadge, rtl && styles.rowReverse]}>
                <Sparkles size={16} color={Colors.gold[400]} />
                <Text style={styles.celebrationText}>
                  {rtl
                    ? `${stats.nearComplete} أهداف قريبة من الاكتمال!`
                    : `${stats.nearComplete} goals almost complete!`}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Category Filters */}
        {categories.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(100)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoryFilters, rtl && styles.categoryFiltersRTL]}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && { backgroundColor: Colors.primary[500] },
                  selectedCategory && { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryChipText, { color: selectedCategory ? theme.text : Colors.white }]}>
                  {rtl ? 'الكل' : 'All'}
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const catStyle = getCategoryStyle(cat);
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: isActive ? catStyle.color : theme.card, borderColor: isActive ? catStyle.color : theme.cardBorder, borderWidth: 1 },
                    ]}
                    onPress={() => setSelectedCategory(isActive ? null : cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: isActive ? Colors.white : catStyle.color }]}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && goals.length === 0 && (
          <Animated.View entering={FadeInUp.duration(500)} style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
              <Target size={36} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {rtl ? 'لا توجد أهداف بعد' : 'No goals yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {rtl ? 'ابدأ رحلة الادخار مع عائلتك' : 'Start your savings journey with your family'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/goals/add')}
            >
              <Plus size={18} color={Colors.white} />
              <Text style={styles.emptyButtonText}>
                {rtl ? 'إضافة هدف جديد' : 'Add New Goal'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Goals List */}
        {filteredGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {rtl ? 'الأهداف الحالية' : 'Current Goals'}
              </Text>
              <Text style={[styles.goalCount, { color: theme.textSecondary }]}>
                {filteredGoals.length} {rtl ? 'أهداف' : 'goals'}
              </Text>
            </View>

            {filteredGoals.map((goal: FamilyGoal, index: number) => {
              const catStyle = getCategoryStyle(goal.category);
              const progress = goalsApi.calculateProgress(goal);
              const CategoryIcon = catStyle.icon;

              return (
                <Animated.View key={goal.id} entering={FadeInUp.duration(400).delay(150 + index * 50)}>
                  <TouchableOpacity
                    style={[styles.goalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    onPress={() => router.push(`/goals/${goal.id}`)}
                    activeOpacity={0.7}
                  >
                    {/* Header with gradient accent */}
                    <LinearGradient
                      colors={catStyle.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.goalAccent}
                    />

                    <View style={[styles.goalHeader, rtl && styles.rowReverse]}>
                      <View style={[styles.goalIcon, { backgroundColor: catStyle.bgColor }]}>
                        <CategoryIcon size={22} color={catStyle.color} />
                      </View>
                      <View style={[styles.goalInfo, rtl && styles.goalInfoRTL]}>
                        <Text style={[styles.goalTitle, { color: theme.text }]}>
                          {goal.title}
                        </Text>
                        <Text style={[styles.goalDesc, { color: theme.textSecondary }]}>
                          {goal.description || getCategoryLabel(goal.category)}
                        </Text>
                      </View>
                      <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.inputBackground }]}>
                        <MoreHorizontal size={18} color={theme.icon} />
                      </TouchableOpacity>
                    </View>

                    {/* Progress Section */}
                    <View style={styles.goalProgress}>
                      <View style={[styles.progressHeader, rtl && styles.rowReverse]}>
                        <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                          {rtl ? 'التقدم' : 'Progress'}
                        </Text>
                        <Text style={[styles.progressPercent, { color: catStyle.color }]}>
                          {progress}%
                        </Text>
                      </View>
                      <View style={[styles.goalProgressBar, { backgroundColor: theme.inputBackground }]}>
                        <LinearGradient
                          colors={catStyle.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.goalProgressFill, { width: `${progress}%` }]}
                        />
                      </View>
                      <View style={[styles.amountRow, rtl && styles.rowReverse]}>
                        <Text style={[styles.currentAmount, { color: catStyle.color }]}>
                          {goal.current_amount.toLocaleString()} {goal.currency}
                        </Text>
                        <Text style={[styles.targetAmount, { color: theme.textTertiary }]}>
                          / {goal.target_amount.toLocaleString()} {goal.currency}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.goalFooter, rtl && styles.rowReverse]}>
                      <View style={[styles.footerItem, rtl && styles.rowReverse]}>
                        <View style={[styles.footerIcon, { backgroundColor: catStyle.bgColor }]}>
                          <Calendar size={12} color={catStyle.color} />
                        </View>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                          {formatDeadline(goal.deadline)}
                        </Text>
                      </View>
                      <View style={[styles.footerItem, rtl && styles.rowReverse]}>
                        <View style={[styles.footerIcon, { backgroundColor: Colors.primary[100] }]}>
                          <Users size={12} color={Colors.primary[500]} />
                        </View>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                          {goal.contributors?.length || 0} {rtl ? 'مساهمين' : 'contributors'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Add Goal Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.gold[500] }, rtl && styles.rowReverse]}
          onPress={() => router.push('/goals/add')}
        >
          <Plus size={22} color={Colors.navy[900]} />
          <Text style={[styles.addButtonText, { fontFamily: getFont('bold') }]}>
            {rtl ? 'إضافة هدف جديد' : 'Add New Goal'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  // Summary Card
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: getFont('bold'),
    color: Colors.white,
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: getFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: getFont('bold'),
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: getFont('regular'),
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  totalProgress: {
    marginTop: 8,
  },
  totalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalProgressLabel: {
    fontSize: 12,
    fontFamily: getFont('regular'),
    color: 'rgba(255,255,255,0.8)',
  },
  totalProgressValue: {
    fontSize: 12,
    fontFamily: getFont('semibold'),
    color: Colors.white,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold[400],
    borderRadius: 4,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  celebrationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: getFont('medium'),
    color: Colors.white,
  },
  // Category Filters
  categoryFilters: {
    paddingVertical: 8,
    gap: 10,
  },
  categoryFiltersRTL: {
    flexDirection: 'row-reverse',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: getFont('medium'),
  },
  // Goals Section
  goalsSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getFont('bold'),
  },
  goalCount: {
    fontSize: 13,
    fontFamily: getFont('regular'),
  },
  // Goal Card
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  goalAccent: {
    height: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
    gap: 14,
  },
  goalIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalInfoRTL: {
    alignItems: 'flex-end',
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: getFont('bold'),
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 13,
    fontFamily: getFont('regular'),
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Progress Section
  goalProgress: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: getFont('regular'),
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: getFont('bold'),
  },
  goalProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentAmount: {
    fontSize: 16,
    fontFamily: getFont('bold'),
  },
  targetAmount: {
    fontSize: 13,
    fontFamily: getFont('regular'),
  },
  // Footer
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: getFont('medium'),
  },
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: getFont('bold'),
    color: Colors.navy[900],
  },
  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: getFont('bold'),
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: getFont('regular'),
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: getFont('semibold'),
    color: Colors.white,
  },
});
