/**
 * Budgets Screen - Monthly/Yearly budget tracking
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ChevronLeft, Plus, Wallet, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, PieChart, Calendar, Target, MoreHorizontal } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useBudgets, useCategories } from '../../../hooks/queries/useExpenses';

const { width } = Dimensions.get('window');

export default function BudgetsScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { family } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const { data: budgets, refetch } = useBudgets(family?.id || '');
  const { data: categories } = useCategories(family?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} د.ت`;

  // Calculate stats
  const stats = useMemo(() => {
    const totalBudget = budgets?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
    const totalSpent = budgets?.reduce((sum: number, b: any) => sum + b.spent, 0) || 0;
    const totalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpent;
    const overBudgetCount = budgets?.filter((b: any) => b.spent > b.amount).length || 0;
    const warningCount = budgets?.filter((b: any) => {
      const p = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      return p > 80 && p <= 100;
    }).length || 0;
    const healthyCount = (budgets?.length || 0) - overBudgetCount - warningCount;

    return { totalBudget, totalSpent, totalProgress, remaining, overBudgetCount, warningCount, healthyCount };
  }, [budgets]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(app)/finance/budgets/add')} style={[styles.addButton, { backgroundColor: Colors.primary[500] }]}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>الميزانيات</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodTab, period === 'year' && { backgroundColor: Colors.primary[500] }]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[styles.periodText, { color: period === 'year' ? Colors.white : theme.textSecondary }]}>سنوي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'month' && { backgroundColor: Colors.primary[500] }]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, { color: period === 'month' ? Colors.white : theme.textSecondary }]}>شهري</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[Colors.primary[600], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconBox}>
                <Wallet size={24} color={Colors.gold[400]} />
              </View>
              <View style={styles.summaryHeaderText}>
                <Text style={styles.summaryTitle}>إجمالي الميزانية</Text>
                <Text style={styles.summaryPeriod}>{period === 'month' ? 'هذا الشهر' : 'هذه السنة'}</Text>
              </View>
            </View>

            <Text style={styles.summaryAmount}>{formatCurrency(stats.totalBudget)}</Text>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressPercent}>{Math.round(stats.totalProgress)}%</Text>
                <Text style={styles.progressLabel}>نسبة الصرف</Text>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={stats.totalProgress > 80 ? ['#ef4444', '#dc2626'] : [Colors.gold[400], Colors.gold[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.min(100, stats.totalProgress)}%` }]}
                />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <TrendingDown size={16} color={Colors.error} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(stats.totalSpent)}</Text>
                <Text style={styles.statLabel}>المصروف</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Target size={16} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(stats.remaining)}</Text>
                <Text style={styles.statLabel}>المتبقي</Text>
              </View>
            </View>

            {/* Status Badges */}
            <View style={styles.statusRow}>
              {stats.healthyCount > 0 && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                  <CheckCircle size={12} color={Colors.success} />
                  <Text style={[styles.statusBadgeText, { color: Colors.success }]}>{stats.healthyCount} جيدة</Text>
                </View>
              )}
              {stats.warningCount > 0 && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                  <AlertTriangle size={12} color={Colors.warning} />
                  <Text style={[styles.statusBadgeText, { color: Colors.warning }]}>{stats.warningCount} تحذير</Text>
                </View>
              )}
              {stats.overBudgetCount > 0 && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                  <AlertTriangle size={12} color={Colors.error} />
                  <Text style={[styles.statusBadgeText, { color: Colors.error }]}>{stats.overBudgetCount} تجاوز</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Budget List */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: Colors.primary[500] }]}>تصفية</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>الميزانيات حسب الفئة</Text>
        </View>

        <View style={styles.list}>
          {budgets?.map((budget: any, index: number) => {
            const progress = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const isOverBudget = progress > 100;
            const isWarning = progress > 80 && !isOverBudget;
            const statusColor = isOverBudget ? Colors.error : isWarning ? Colors.warning : Colors.success;
            const statusBgColor = isOverBudget ? '#fef2f2' : isWarning ? '#fef3c7' : '#dcfce7';

            return (
              <Animated.View key={budget.id} entering={FadeInUp.duration(400).delay(100 + index * 50)}>
                <TouchableOpacity
                  style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.7}
                >
                  {/* Accent Line */}
                  <View style={[styles.budgetAccent, { backgroundColor: statusColor }]} />

                  <View style={styles.budgetContent}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetInfo}>
                        <Text style={[styles.budgetCategory, { color: theme.text }]}>
                          {budget.category?.name_ar || budget.category?.name || 'عام'}
                        </Text>
                        <Text style={[styles.budgetPeriod, { color: theme.textSecondary }]}>
                          {period === 'month' ? 'شهري' : 'سنوي'}
                        </Text>
                      </View>
                      <View style={styles.budgetHeaderRight}>
                        <View style={[styles.cardStatusBadge, { backgroundColor: statusBgColor }]}>
                          {isOverBudget ? (
                            <AlertTriangle size={12} color={statusColor} />
                          ) : (
                            <CheckCircle size={12} color={statusColor} />
                          )}
                          <Text style={[styles.cardStatusText, { color: statusColor }]}>
                            {isOverBudget ? 'تجاوز' : isWarning ? 'تحذير' : 'جيد'}
                          </Text>
                        </View>
                        <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.inputBackground }]}>
                          <MoreHorizontal size={16} color={theme.icon} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.budgetBody}>
                      <View style={styles.amountsRow}>
                        <Text style={[styles.spentAmount, { color: theme.text }]}>
                          {formatCurrency(budget.spent)}
                        </Text>
                        <Text style={[styles.budgetAmount, { color: theme.textSecondary }]}>
                          / {formatCurrency(budget.amount)}
                        </Text>
                      </View>

                      <View style={[styles.budgetProgressBar, { backgroundColor: theme.inputBackground }]}>
                        <View
                          style={[
                            styles.budgetProgressFill,
                            {
                              width: `${Math.min(100, progress)}%`,
                              backgroundColor: statusColor,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.budgetFooter}>
                        <Text style={[styles.progressText, { color: statusColor }]}>
                          {Math.round(progress)}%
                        </Text>
                        <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
                          المتبقي: {formatCurrency(Math.max(0, budget.amount - budget.spent))}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Empty State */}
        {(!budgets || budgets.length === 0) && (
          <View style={styles.emptyState}>
            <Wallet size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              لا توجد ميزانيات بعد
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              أضف ميزانية للتحكم في مصاريفك
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={[Colors.gold[500], Colors.gold[600]]}
          style={styles.fabGradient}
        >
          <Plus size={28} color={Colors.navy[900]} />
        </LinearGradient>
      </TouchableOpacity>
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
  backButton: { padding: 8 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Tajawal_700Bold' },
  content: { padding: 16 },
  // Period Selector
  periodSelector: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Tajawal_600SemiBold',
  },
  // Summary Card
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  summaryHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
  summaryPeriod: {
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  summaryAmount: {
    fontSize: 36,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Tajawal_400Regular',
  },
  progressPercent: {
    fontSize: 14,
    color: Colors.gold[400],
    fontFamily: 'Tajawal_700Bold',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Tajawal_400Regular',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  // Status Row
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Tajawal_600SemiBold',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_700Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Tajawal_500Medium',
  },
  // Budget List
  list: { gap: 14 },
  budgetCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  budgetAccent: {
    height: 4,
  },
  budgetContent: {
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  budgetInfo: { alignItems: 'flex-end' },
  budgetCategory: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  budgetPeriod: { fontSize: 12, fontFamily: 'Tajawal_400Regular', marginTop: 2 },
  budgetHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardStatusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardStatusText: { fontSize: 11, fontFamily: 'Tajawal_600SemiBold' },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetBody: { gap: 10 },
  amountsRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
  spentAmount: { fontSize: 22, fontFamily: 'Tajawal_700Bold' },
  budgetAmount: { fontSize: 14, fontFamily: 'Tajawal_400Regular' },
  budgetProgressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 4 },
  budgetFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  progressText: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_700Bold' },
  emptySubtext: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'center' },
  // FAB
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    elevation: 8,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
