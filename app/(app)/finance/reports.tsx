/**
 * Financial Reports Screen - Enhanced Analytics Dashboard
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
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  Share2,
  Filter,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import {
  useExpenseSummary,
  useExpenseTrends,
  useTransactionsByCategory,
  useTransactionsByMember,
} from '../../../hooks/queries/useExpenses';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { family } = useAuthStore();

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, refetch: refetchSummary } = useExpenseSummary(family?.id || '', period);
  const { data: trends } = useExpenseTrends(family?.id || '', 6);
  const { data: byCategory } = useTransactionsByCategory(family?.id || '');
  const { data: byMember } = useTransactionsByMember(family?.id || '');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchSummary();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} د.ت`;

  const periodLabels = { week: 'الأسبوع', month: 'الشهر', year: 'السنة' };

  // Calculate stats
  const stats = useMemo(() => {
    const balance = (summary?.total_income || 0) - (summary?.total_expenses || 0);
    const savingsRate = summary?.total_income > 0
      ? Math.round((balance / summary.total_income) * 100)
      : 0;
    return { balance, savingsRate };
  }, [summary]);

  // Category colors
  const categoryColors = [
    Colors.primary[500],
    Colors.gold[500],
    Colors.success,
    Colors.sisters[500],
    Colors.error,
    '#8b5cf6',
    '#06b6d4',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.card }]}>
            <Share2 size={18} color={theme.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.card }]}>
            <Download size={18} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>التقارير المالية</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        contentContainerStyle={styles.content}
      >
        {/* Period Selector */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.periodTabs, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(['week', 'month', 'year'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodTab, period === p && { backgroundColor: Colors.primary[500] }]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodTabText, { color: period === p ? Colors.white : theme.textSecondary }]}>
                  {periodLabels[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Overview Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)}>
          <LinearGradient
            colors={stats.balance >= 0 ? [Colors.success, '#059669'] : [Colors.error, '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.overviewCard}
          >
            <View style={styles.overviewHeader}>
              <View style={styles.overviewIconBox}>
                <Wallet size={24} color={Colors.white} />
              </View>
              <View style={styles.overviewHeaderText}>
                <Text style={styles.overviewTitle}>صافي الميزانية</Text>
                <Text style={styles.overviewPeriod}>{periodLabels[period]}</Text>
              </View>
            </View>

            <Text style={styles.overviewAmount}>
              {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
            </Text>

            {/* Quick Stats */}
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <ArrowUpRight size={14} color={Colors.white} />
                </View>
                <Text style={styles.overviewStatValue}>{formatCurrency(summary?.total_income || 0)}</Text>
                <Text style={styles.overviewStatLabel}>الدخل</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <ArrowDownRight size={14} color={Colors.white} />
                </View>
                <Text style={styles.overviewStatValue}>{formatCurrency(summary?.total_expenses || 0)}</Text>
                <Text style={styles.overviewStatLabel}>المصروفات</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <Target size={14} color={Colors.white} />
                </View>
                <Text style={styles.overviewStatValue}>{stats.savingsRate}%</Text>
                <Text style={styles.overviewStatLabel}>معدل التوفير</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Income vs Expenses Cards */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <View style={styles.summaryRow}>
            <TouchableOpacity style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.summaryGradient}>
                <View style={styles.summaryIconBox}>
                  <TrendingUp size={20} color={Colors.success} />
                </View>
              </LinearGradient>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>الدخل</Text>
              <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                {formatCurrency(summary?.total_income || 0)}
              </Text>
              <View style={styles.summaryChange}>
                <ArrowUpRight size={12} color={Colors.success} />
                <Text style={[styles.summaryChangeText, { color: Colors.success }]}>+12%</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <LinearGradient colors={['#fef2f2', '#fee2e2']} style={styles.summaryGradient}>
                <View style={styles.summaryIconBox}>
                  <TrendingDown size={20} color={Colors.error} />
                </View>
              </LinearGradient>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المصروفات</Text>
              <Text style={[styles.summaryAmount, { color: Colors.error }]}>
                {formatCurrency(summary?.total_expenses || 0)}
              </Text>
              <View style={styles.summaryChange}>
                <ArrowDownRight size={12} color={Colors.error} />
                <Text style={[styles.summaryChangeText, { color: Colors.error }]}>-5%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Trends Chart */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)}>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.chartHeader}>
              <TouchableOpacity style={[styles.chartFilterButton, { backgroundColor: theme.inputBackground }]}>
                <Filter size={16} color={theme.icon} />
              </TouchableOpacity>
              <View style={styles.chartTitleRow}>
                <Calendar size={18} color={Colors.primary[500]} />
                <Text style={[styles.chartTitle, { color: theme.text }]}>الاتجاه الشهري</Text>
              </View>
            </View>
            <View style={styles.trendsList}>
              {trends?.map((item: any, index: number) => {
                const maxValue = 5000;
                const incomeHeight = Math.max(10, (item.income / maxValue) * 70);
                const expenseHeight = Math.max(10, (item.expenses / maxValue) * 70);
                return (
                  <View key={index} style={styles.trendItem}>
                    <View style={styles.trendBars}>
                      <View style={[styles.trendBar, { height: incomeHeight, backgroundColor: Colors.success }]} />
                      <View style={[styles.trendBar, { height: expenseHeight, backgroundColor: Colors.error }]} />
                    </View>
                    <Text style={[styles.trendMonth, { color: theme.textSecondary }]}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>الدخل</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>المصروفات</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* By Category */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.chartHeader}>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: Colors.primary[500] }]}>عرض الكل</Text>
              </TouchableOpacity>
              <View style={styles.chartTitleRow}>
                <PieChart size={18} color={Colors.gold[500]} />
                <Text style={[styles.chartTitle, { color: theme.text }]}>حسب الفئة</Text>
              </View>
            </View>
            <View style={styles.categoryList}>
              {byCategory?.slice(0, 5).map((item: any, index: number) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryRow}>
                    <Text style={[styles.categoryAmount, { color: theme.text }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: categoryColors[index % categoryColors.length] }]} />
                      <Text style={[styles.categoryName, { color: theme.text }]}>{item.category}</Text>
                    </View>
                  </View>
                  <View style={[styles.categoryBar, { backgroundColor: theme.inputBackground }]}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${item.percentage}%`, backgroundColor: categoryColors[index % categoryColors.length] },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* By Member */}
        <Animated.View entering={FadeInUp.duration(500).delay(250)}>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.chartHeader}>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: Colors.primary[500] }]}>عرض الكل</Text>
              </TouchableOpacity>
              <View style={styles.chartTitleRow}>
                <BarChart3 size={18} color={Colors.primary[500]} />
                <Text style={[styles.chartTitle, { color: theme.text }]}>حسب الفرد</Text>
              </View>
            </View>
            <View style={styles.memberList}>
              {byMember?.map((item: any, index: number) => (
                <View key={index} style={styles.memberItem}>
                  <Text style={[styles.memberAmount, { color: theme.text }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberPercentage, { color: theme.textSecondary }]}>
                        {item.percentage}%
                      </Text>
                      <Text style={[styles.memberName, { color: theme.text }]}>{item.member}</Text>
                    </View>
                    <View style={[styles.memberBar, { backgroundColor: theme.inputBackground }]}>
                      <LinearGradient
                        colors={[Colors.gold[400], Colors.gold[500]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.memberBarFill, { width: `${item.percentage}%` }]}
                      />
                    </View>
                  </View>
                  <View style={[styles.memberAvatar, { backgroundColor: Colors.primary[100] }]}>
                    <Text style={[styles.memberInitial, { color: Colors.primary[600] }]}>
                      {item.member.charAt(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  backButton: { padding: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Tajawal_700Bold' },
  content: { padding: 16 },
  // Period Tabs
  periodTabs: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  periodTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  periodTabText: { fontSize: 14, fontFamily: 'Tajawal_600SemiBold' },
  // Overview Card
  overviewCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  overviewHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  overviewTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
  overviewPeriod: {
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  overviewAmount: {
    fontSize: 36,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  overviewStats: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  overviewStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 14,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
  overviewStatLabel: {
    fontSize: 11,
    fontFamily: 'Tajawal_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  overviewStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  // Summary Cards
  summaryRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 16,
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, fontFamily: 'Tajawal_500Medium', marginTop: 12, textAlign: 'center' },
  summaryAmount: { fontSize: 20, fontFamily: 'Tajawal_700Bold', marginTop: 4, textAlign: 'center' },
  summaryChange: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  summaryChangeText: { fontSize: 12, fontFamily: 'Tajawal_600SemiBold' },
  // Chart Card
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  chartHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  chartFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllText: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },
  // Trends
  trendsList: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 16, height: 90 },
  trendItem: { alignItems: 'center', gap: 8 },
  trendBars: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 70 },
  trendBar: { width: 14, borderRadius: 4 },
  trendMonth: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  legendRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 24 },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  // Categories
  categoryList: { gap: 14 },
  categoryItem: { gap: 8 },
  categoryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  categoryInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, fontFamily: 'Tajawal_500Medium' },
  categoryAmount: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  categoryBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  // Members
  memberList: { gap: 16 },
  memberItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: { fontSize: 18, fontFamily: 'Tajawal_700Bold' },
  memberInfo: { flex: 1, gap: 6 },
  memberNameRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontSize: 14, fontFamily: 'Tajawal_600SemiBold' },
  memberPercentage: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  memberBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  memberBarFill: { height: '100%', borderRadius: 4 },
  memberAmount: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
});
