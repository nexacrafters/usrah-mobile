/**
 * Finance Dashboard - Premium UI
 * Main finance tab with comprehensive overview
 */
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  BarChart3,
  Calendar,
  Shield,
  Coins,
  Receipt,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import {
  useTransactions,
  useExpenseSummary,
  useBudgets,
  useCategories,
} from '../../../hooks/queries/useExpenses';
import { getFont, getTextAlign } from '../../../utils/fonts';
import type { Transaction, Category } from '../../../types/models';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

// Category icon mapping with colors
const categoryConfig: Record<string, { icon: any; gradient: string[] }> = {
  groceries: { icon: Receipt, gradient: ['#f59e0b', '#d97706'] },
  food: { icon: Receipt, gradient: ['#f59e0b', '#d97706'] },
  transport: { icon: Receipt, gradient: ['#3b82f6', '#2563eb'] },
  utilities: { icon: Receipt, gradient: ['#8b5cf6', '#7c3aed'] },
  charity: { icon: Receipt, gradient: ['#10b981', '#059669'] },
  health: { icon: Receipt, gradient: ['#ef4444', '#dc2626'] },
  education: { icon: Receipt, gradient: ['#06b6d4', '#0891b2'] },
  shopping: { icon: Receipt, gradient: ['#ec4899', '#db2777'] },
  default: { icon: Receipt, gradient: ['#64748b', '#475569'] },
};

const getCategoryConfig = (categoryName?: string) => {
  if (!categoryName) return categoryConfig.default;
  const key = categoryName.toLowerCase();
  return categoryConfig[key] || categoryConfig.default;
};

// Quick Actions Data
const quickActions = [
  { id: 'budgets', icon: PieChart, label: 'الميزانية', labelEn: 'Budgets', route: '/(app)/finance/budgets', gradient: ['#3b82f6', '#1d4ed8'] },
  { id: 'debts', icon: CreditCard, label: 'الديون', labelEn: 'Debts', route: '/(app)/finance/debts', gradient: ['#ef4444', '#dc2626'] },
  { id: 'goals', icon: Target, label: 'الأهداف', labelEn: 'Goals', route: '/(app)/goals', gradient: ['#f59e0b', '#d97706'] },
  { id: 'investments', icon: BarChart3, label: 'استثمارات', labelEn: 'Invest', route: '/(app)/finance/investments', gradient: ['#10b981', '#059669'] },
  { id: 'emergency', icon: Shield, label: 'طوارئ', labelEn: 'Emergency', route: '/(app)/finance/emergency-fund', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 'reports', icon: Coins, label: 'تقارير', labelEn: 'Reports', route: '/(app)/finance/reports', gradient: ['#ec4899', '#db2777'] },
];

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const { family } = useAuthStore();
  const familyId = family?.id || '';

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // API calls
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions({ family_id: familyId });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useExpenseSummary(familyId, period);

  const { data: budgets } = useBudgets(familyId);

  // Flatten paginated transactions
  const transactions = useMemo(() => {
    if (!transactionsData?.pages) return [];
    return transactionsData.pages.flatMap((page) => page.results || []);
  }, [transactionsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalIncome = summary?.total_income || 0;
    const totalExpenses = summary?.total_expenses || 0;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

    const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
    const budgetUsage = totalBudget > 0 ? Math.min(100, Math.round((totalExpenses / totalBudget) * 100)) : 0;

    return { totalIncome, totalExpenses, balance, savingsRate, budgetUsage, totalBudget };
  }, [summary, budgets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTransactions(), refetchSummary()]);
    setRefreshing(false);
  }, [refetchTransactions, refetchSummary]);

  const formatCurrency = (amount: number) => {
    return `${Math.abs(amount).toLocaleString()} ${isRTL ? 'د.ت' : 'TND'}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return isRTL ? 'اليوم' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return isRTL ? 'أمس' : 'Yesterday';
    }
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', {
      month: 'short',
      day: 'numeric',
    });
  };

  const periodLabels = {
    week: isRTL ? 'أسبوع' : 'Week',
    month: isRTL ? 'شهر' : 'Month',
    year: isRTL ? 'سنة' : 'Year',
  };

  const isLoading = transactionsLoading || summaryLoading;
  const isPositive = stats.balance >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <TouchableOpacity
          style={[styles.addButton]}
          onPress={() => router.push('/(app)/expenses/add')}
        >
          <LinearGradient
            colors={[Colors.gold[500], Colors.gold[600]]}
            style={styles.addButtonGradient}
          >
            <Plus size={22} color={Colors.navy[900]} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {isRTL ? 'المالية' : 'Finance'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
            {isRTL ? 'إدارة أموالك بذكاء' : 'Manage your money smartly'}
          </Text>
        </View>
        <View style={styles.headerLogo}>
          <Sparkles size={24} color={Colors.gold[500]} />
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* Main Balance Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={isPositive
              ? (isDark ? ['#065f46', '#047857'] : ['#059669', '#10b981'])
              : (isDark ? ['#7f1d1d', '#991b1b'] : ['#dc2626', '#ef4444'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Glass overlay effect */}
            <View style={styles.glassOverlay} />

            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={Colors.white} size="large" />
              </View>
            ) : (
              <>
                <View style={styles.balanceHeader}>
                  <View style={styles.balanceIconBox}>
                    <Wallet size={24} color={Colors.white} />
                  </View>
                  <View style={styles.balanceHeaderText}>
                    <Text style={[styles.balanceLabel, { fontFamily: getFont('medium') }]}>
                      {isRTL ? 'الرصيد الحالي' : 'Current Balance'}
                    </Text>
                    <Text style={[styles.balancePeriod, { fontFamily: getFont('regular') }]}>
                      {periodLabels[period]}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.balanceAmount, { fontFamily: getFont('bold') }]}>
                  {isPositive ? '+' : '-'}{formatCurrency(stats.balance)}
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconBox}>
                      <ArrowUpRight size={16} color="#a7f3d0" />
                    </View>
                    <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>
                      {formatCurrency(stats.totalIncome)}
                    </Text>
                    <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                      {isRTL ? 'الدخل' : 'Income'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconBox}>
                      <ArrowDownRight size={16} color="#fca5a5" />
                    </View>
                    <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>
                      {formatCurrency(stats.totalExpenses)}
                    </Text>
                    <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                      {isRTL ? 'المصروفات' : 'Expenses'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconBox}>
                      <Target size={16} color="#fde68a" />
                    </View>
                    <Text style={[styles.statValue, { fontFamily: getFont('bold') }]}>
                      {stats.savingsRate}%
                    </Text>
                    <Text style={[styles.statLabel, { fontFamily: getFont('regular') }]}>
                      {isRTL ? 'توفير' : 'Savings'}
                    </Text>
                  </View>
                </View>

                {/* Budget Progress */}
                {stats.totalBudget > 0 && (
                  <View style={styles.budgetProgress}>
                    <View style={styles.budgetHeader}>
                      <Text style={[styles.budgetPercent, { fontFamily: getFont('bold') }]}>
                        {stats.budgetUsage}%
                      </Text>
                      <Text style={[styles.budgetLabel, { fontFamily: getFont('regular') }]}>
                        {isRTL ? 'من الميزانية' : 'of budget'}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            width: `${stats.budgetUsage}%`,
                            backgroundColor: stats.budgetUsage > 90 ? '#fca5a5' : stats.budgetUsage > 75 ? '#fde68a' : '#a7f3d0',
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <View style={[styles.periodSelector, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(['week', 'month', 'year'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodTab,
                  period === p && styles.periodTabActive,
                ]}
                onPress={() => setPeriod(p)}
              >
                {period === p ? (
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[600]]}
                    style={styles.periodTabGradient}
                  >
                    <Text style={[styles.periodTabTextActive, { fontFamily: getFont('semibold') }]}>
                      {periodLabels[p]}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.periodTabText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                    {periodLabels[p]}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <View style={styles.sectionHeader}>
            <Link href="/(app)/finance/reports" asChild>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                  {isRTL ? 'عرض الكل' : 'See all'}
                </Text>
                <ChevronLeft size={16} color={Colors.primary[500]} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
              </TouchableOpacity>
            </Link>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {isRTL ? 'الإدارة المالية' : 'Finance Tools'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.actionsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          >
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Animated.View key={action.id} entering={FadeInUp.duration(300).delay(250 + index * 50)}>
                  <Link href={action.route as any} asChild>
                    <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                      <LinearGradient
                        colors={action.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionGradient}
                      >
                        <Icon size={26} color={Colors.white} />
                      </LinearGradient>
                      <Text style={[styles.actionLabel, { color: theme.text, fontFamily: getFont('semibold') }]}>
                        {isRTL ? action.label : action.labelEn}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                {isRTL ? 'عرض الكل' : 'See all'}
              </Text>
              <ChevronLeft size={16} color={Colors.primary[500]} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {isRTL ? 'آخر المعاملات' : 'Recent Transactions'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingTransactions}>
              <ActivityIndicator color={Colors.primary[500]} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
                <Receipt size={32} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                {isRTL ? 'لا توجد معاملات' : 'No transactions yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {isRTL ? 'أضف أول معاملة لتتبع مصاريفك' : 'Add your first transaction to track expenses'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(app)/expenses/add')}
              >
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  style={styles.emptyButtonGradient}
                >
                  <Plus size={18} color={Colors.white} />
                  <Text style={[styles.emptyButtonText, { fontFamily: getFont('semibold') }]}>
                    {isRTL ? 'إضافة معاملة' : 'Add Transaction'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 6).map((transaction: Transaction, index: number) => {
                const config = getCategoryConfig(transaction.category?.name);
                const isIncome = transaction.type === 'income';

                return (
                  <Animated.View
                    key={transaction.id}
                    entering={FadeInUp.duration(300).delay(350 + index * 40)}
                  >
                    <TouchableOpacity
                      style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => router.push(`/(app)/expenses/${transaction.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.transactionRow, isRTL && styles.rowReverse]}>
                        <LinearGradient
                          colors={isIncome ? ['#dcfce7', '#bbf7d0'] : config.gradient}
                          style={styles.transactionIcon}
                        >
                          {isIncome ? (
                            <ArrowUpRight size={20} color="#16a34a" />
                          ) : (
                            <ArrowDownRight size={20} color={Colors.white} />
                          )}
                        </LinearGradient>

                        <View style={[styles.transactionContent, isRTL && styles.transactionContentRTL]}>
                          <Text style={[styles.transactionCategory, { color: theme.text, fontFamily: getFont('semibold'), textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {transaction.description || transaction.category?.name || (isRTL ? 'معاملة' : 'Transaction')}
                          </Text>
                          <Text style={[styles.transactionDate, { color: theme.textTertiary, fontFamily: getFont('regular'), textAlign: isRTL ? 'right' : 'left' }]}>
                            {formatDate(transaction.date)}
                          </Text>
                        </View>

                        <View style={[styles.transactionAmountBox, isRTL && styles.transactionAmountBoxRTL]}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              { color: isIncome ? Colors.success : Colors.error, fontFamily: getFont('bold') },
                            ]}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.7,
  },
  headerLogo: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },

  // Balance Card
  balanceCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  loadingCard: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  balanceHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 16,
    color: Colors.white,
  },
  balancePeriod: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 42,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  budgetProgress: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  budgetHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  budgetPercent: {
    fontSize: 15,
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
    borderRadius: 4,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  periodTab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodTabActive: {},
  periodTabGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodTabText: {
    fontSize: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  periodTabTextActive: {
    fontSize: 14,
    color: Colors.white,
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
  },
  seeAllButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
  },

  // Quick Actions
  actionsScroll: {
    paddingBottom: 8,
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    alignItems: 'center',
    width: 80,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Transactions
  loadingTransactions: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionContentRTL: {
    alignItems: 'flex-end',
  },
  transactionCategory: {
    fontSize: 15,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmountBox: {
    alignItems: 'flex-end',
  },
  transactionAmountBoxRTL: {
    alignItems: 'flex-start',
  },
  transactionAmount: {
    fontSize: 16,
  },

  // Empty State
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    color: Colors.white,
  },
});
