/**
 * Investments Screen - Premium Portfolio Dashboard
 * Track and manage investment portfolio with modern UI
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
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Coins,
  Building2,
  Landmark,
  Gem,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Percent,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useInvestments, useInvestmentSummary } from '../../../hooks/queries/useExpenses';
import { getFont } from '../../../utils/fonts';

const { width } = Dimensions.get('window');

const investmentConfig: Record<string, { icon: any; gradient: string[]; bgLight: string }> = {
  stocks: { icon: BarChart3, gradient: ['#3b82f6', '#1d4ed8'], bgLight: '#eff6ff' },
  gold: { icon: Coins, gradient: ['#f59e0b', '#d97706'], bgLight: '#fffbeb' },
  real_estate: { icon: Building2, gradient: ['#10b981', '#059669'], bgLight: '#ecfdf5' },
  bonds: { icon: Landmark, gradient: ['#8b5cf6', '#7c3aed'], bgLight: '#f5f3ff' },
  crypto: { icon: Gem, gradient: ['#ec4899', '#db2777'], bgLight: '#fdf2f8' },
  default: { icon: TrendingUp, gradient: ['#64748b', '#475569'], bgLight: '#f8fafc' },
};

const investmentNames: Record<string, { ar: string; en: string }> = {
  stocks: { ar: 'أسهم', en: 'Stocks' },
  gold: { ar: 'ذهب', en: 'Gold' },
  real_estate: { ar: 'عقارات', en: 'Real Estate' },
  bonds: { ar: 'سندات', en: 'Bonds' },
  crypto: { ar: 'عملات رقمية', en: 'Crypto' },
};

export default function InvestmentsScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { family } = useAuthStore();
  const isRTL = true; // Arabic-first

  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: investments, refetch } = useInvestments(family?.id || '');
  const { data: summary } = useInvestmentSummary(family?.id || '');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    if (hideBalance) return '••••••';
    return `${amount.toLocaleString()} ${isRTL ? 'د.ت' : 'TND'}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const currentValue = summary?.current_value || 0;
    const invested = summary?.total_invested || 0;
    const profitLoss = summary?.total_profit_loss || 0;
    const percentage = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
    const isProfit = profitLoss >= 0;

    // Mock asset allocation
    const allocation = [
      { type: 'stocks', percent: 40, color: '#3b82f6' },
      { type: 'gold', percent: 25, color: '#f59e0b' },
      { type: 'real_estate', percent: 20, color: '#10b981' },
      { type: 'bonds', percent: 15, color: '#8b5cf6' },
    ];

    return { currentValue, invested, profitLoss, percentage, isProfit, allocation };
  }, [summary]);

  const periodLabels = { week: 'أسبوع', month: 'شهر', year: 'سنة' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={() => setHideBalance(!hideBalance)}
        >
          {hideBalance ? (
            <EyeOff size={20} color={theme.icon} />
          ) : (
            <Eye size={20} color={theme.icon} />
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {isRTL ? 'الاستثمارات' : 'Investments'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
        }
        contentContainerStyle={styles.content}
      >
        {/* Portfolio Value Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={portfolioStats.isProfit
              ? (isDark ? ['#065f46', '#047857'] : ['#059669', '#10b981'])
              : (isDark ? ['#7f1d1d', '#991b1b'] : ['#dc2626', '#ef4444'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.portfolioCard}
          >
            {/* Decorative elements */}
            <View style={styles.cardDecoration}>
              <Sparkles size={60} color="rgba(255,255,255,0.1)" />
            </View>

            <View style={styles.portfolioHeader}>
              <View style={styles.portfolioIconBox}>
                <LineChart size={26} color={Colors.white} />
              </View>
              <View style={styles.portfolioHeaderText}>
                <Text style={[styles.portfolioLabel, { fontFamily: getFont('medium') }]}>
                  {isRTL ? 'إجمالي المحفظة' : 'Portfolio Value'}
                </Text>
                <View style={[styles.changeBadge, { backgroundColor: portfolioStats.isProfit ? 'rgba(167,243,208,0.3)' : 'rgba(252,165,165,0.3)' }]}>
                  {portfolioStats.isProfit ? (
                    <ArrowUpRight size={14} color="#a7f3d0" />
                  ) : (
                    <ArrowDownRight size={14} color="#fca5a5" />
                  )}
                  <Text style={[styles.changeText, { color: portfolioStats.isProfit ? '#a7f3d0' : '#fca5a5', fontFamily: getFont('semibold') }]}>
                    {formatPercent(portfolioStats.percentage)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.portfolioValue, { fontFamily: getFont('bold') }]}>
              {formatCurrency(portfolioStats.currentValue)}
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconMini, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <DollarSign size={16} color={Colors.white} />
                </View>
                <Text style={[styles.statCardLabel, { fontFamily: getFont('regular') }]}>
                  {isRTL ? 'المستثمر' : 'Invested'}
                </Text>
                <Text style={[styles.statCardValue, { fontFamily: getFont('bold') }]}>
                  {formatCurrency(portfolioStats.invested)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <View style={[styles.statIconMini, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Percent size={16} color={Colors.white} />
                </View>
                <Text style={[styles.statCardLabel, { fontFamily: getFont('regular') }]}>
                  {portfolioStats.isProfit ? (isRTL ? 'الأرباح' : 'Profit') : (isRTL ? 'الخسائر' : 'Loss')}
                </Text>
                <Text style={[styles.statCardValue, { color: portfolioStats.isProfit ? '#a7f3d0' : '#fca5a5', fontFamily: getFont('bold') }]}>
                  {portfolioStats.isProfit ? '+' : ''}{formatCurrency(portfolioStats.profitLoss)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <View style={[styles.periodSelector, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(['week', 'month', 'year'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodTab, selectedPeriod === p && styles.periodTabActive]}
                onPress={() => setSelectedPeriod(p)}
              >
                {selectedPeriod === p ? (
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

        {/* Asset Allocation */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <View style={[styles.allocationCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                  {isRTL ? 'تفاصيل' : 'Details'}
                </Text>
              </TouchableOpacity>
              <View style={styles.sectionTitleRow}>
                <PieChart size={20} color={Colors.gold[500]} />
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                  {isRTL ? 'توزيع الأصول' : 'Asset Allocation'}
                </Text>
              </View>
            </View>

            {/* Allocation Bar */}
            <View style={styles.allocationBar}>
              {portfolioStats.allocation.map((item, index) => (
                <View
                  key={item.type}
                  style={[
                    styles.allocationSegment,
                    { width: `${item.percent}%`, backgroundColor: item.color },
                    index === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                    index === portfolioStats.allocation.length - 1 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                  ]}
                />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendGrid}>
              {portfolioStats.allocation.map((item) => {
                const config = investmentConfig[item.type] || investmentConfig.default;
                const names = investmentNames[item.type] || { ar: item.type, en: item.type };
                return (
                  <View key={item.type} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendLabel, { color: theme.text, fontFamily: getFont('medium') }]}>
                      {isRTL ? names.ar : names.en}
                    </Text>
                    <Text style={[styles.legendPercent, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                      {item.percent}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Investments Section Header */}
        <Animated.View entering={FadeInUp.duration(400).delay(250)}>
          <View style={styles.sectionHeaderMain}>
            <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]}>
              <MoreHorizontal size={18} color={theme.icon} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitleMain, { color: theme.text, fontFamily: getFont('bold') }]}>
              {isRTL ? 'استثماراتي' : 'My Investments'}
            </Text>
          </View>
        </Animated.View>

        {/* Investments List */}
        <View style={styles.investmentsList}>
          {investments?.map((investment: any, index: number) => {
            const config = investmentConfig[investment.type] || investmentConfig.default;
            const names = investmentNames[investment.type] || { ar: investment.type, en: investment.type };
            const Icon = config.icon;
            const isPositive = investment.profit_loss >= 0;

            return (
              <Animated.View key={investment.id} entering={FadeInUp.duration(400).delay(300 + index * 60)}>
                <TouchableOpacity
                  style={[styles.investmentCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.7}
                >
                  {/* Accent line */}
                  <LinearGradient
                    colors={config.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardAccent}
                  />

                  <View style={styles.investmentContent}>
                    {/* Header */}
                    <View style={styles.investmentHeader}>
                      <View style={styles.investmentInfo}>
                        <LinearGradient
                          colors={config.gradient}
                          style={styles.investmentIcon}
                        >
                          <Icon size={22} color={Colors.white} />
                        </LinearGradient>
                        <View style={styles.investmentTitles}>
                          <Text style={[styles.investmentName, { color: theme.text, fontFamily: getFont('bold') }]}>
                            {investment.name}
                          </Text>
                          <Text style={[styles.investmentType, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {isRTL ? names.ar : names.en}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.profitBadge, { backgroundColor: isPositive ? '#dcfce7' : '#fef2f2' }]}>
                        {isPositive ? (
                          <ArrowUpRight size={14} color="#16a34a" />
                        ) : (
                          <ArrowDownRight size={14} color="#dc2626" />
                        )}
                        <Text style={[styles.profitBadgeText, { color: isPositive ? '#16a34a' : '#dc2626', fontFamily: getFont('bold') }]}>
                          {formatPercent(investment.percentage || 0)}
                        </Text>
                      </View>
                    </View>

                    {/* Values */}
                    <View style={styles.valuesRow}>
                      <View style={styles.valueItem}>
                        <Text style={[styles.valueLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                          {isRTL ? 'القيمة الحالية' : 'Current Value'}
                        </Text>
                        <Text style={[styles.valueAmount, { color: theme.text, fontFamily: getFont('bold') }]}>
                          {formatCurrency(investment.current_value)}
                        </Text>
                      </View>
                      <View style={styles.valueItem}>
                        <Text style={[styles.valueLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                          {isRTL ? 'المستثمر' : 'Invested'}
                        </Text>
                        <Text style={[styles.valueAmountSecondary, { color: theme.textSecondary, fontFamily: getFont('semibold') }]}>
                          {formatCurrency(investment.initial_amount)}
                        </Text>
                      </View>
                      <View style={styles.valueItem}>
                        <Text style={[styles.valueLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                          {isRTL ? 'الربح/الخسارة' : 'P/L'}
                        </Text>
                        <Text style={[styles.valueAmount, { color: isPositive ? '#16a34a' : '#dc2626', fontFamily: getFont('bold') }]}>
                          {isPositive ? '+' : ''}{formatCurrency(investment.profit_loss)}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.investmentFooter, { borderTopColor: theme.divider }]}>
                      <Text style={[styles.dateText, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
                        {isRTL ? 'منذ' : 'Since'} {investment.start_date}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Empty State */}
        {(!investments || investments.length === 0) && (
          <Animated.View entering={FadeInUp.duration(400).delay(300)}>
            <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
                <BarChart3 size={36} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                {isRTL ? 'ابدأ رحلة الاستثمار' : 'Start Investing'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {isRTL ? 'أضف استثماراتك لتتبع أداء محفظتك' : 'Add investments to track your portfolio'}
              </Text>
              <TouchableOpacity style={styles.emptyButton}>
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  style={styles.emptyButtonGradient}
                >
                  <Plus size={18} color={Colors.white} />
                  <Text style={[styles.emptyButtonText, { fontFamily: getFont('semibold') }]}>
                    {isRTL ? 'إضافة استثمار' : 'Add Investment'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.gold[500], Colors.gold[600]]}
          style={styles.fabGradient}
        >
          <Plus size={28} color={Colors.navy[900]} strokeWidth={2.5} />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20 },
  content: { padding: 16 },

  // Portfolio Card
  portfolioCard: {
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
  cardDecoration: {
    position: 'absolute',
    top: -20,
    left: -20,
    opacity: 0.5,
  },
  portfolioHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  portfolioIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  portfolioHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  portfolioLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  changeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
  },
  portfolioValue: {
    fontSize: 40,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 18,
    padding: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconMini: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statCardValue: {
    fontSize: 15,
    color: Colors.white,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
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

  // Allocation Card
  allocationCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
  },
  seeAllText: {
    fontSize: 13,
  },
  allocationBar: {
    height: 12,
    flexDirection: 'row-reverse',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
  },
  legendPercent: {
    fontSize: 12,
  },

  // Section Header Main
  sectionHeaderMain: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleMain: {
    fontSize: 18,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Investment Card
  investmentsList: {
    gap: 14,
  },
  investmentCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 4,
  },
  investmentContent: {
    padding: 18,
  },
  investmentHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  investmentInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  investmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  investmentTitles: {
    flex: 1,
    alignItems: 'flex-end',
  },
  investmentName: {
    fontSize: 16,
    marginBottom: 3,
  },
  investmentType: {
    fontSize: 13,
  },
  profitBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  profitBadgeText: {
    fontSize: 13,
  },
  valuesRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  valueItem: {
    alignItems: 'flex-end',
    flex: 1,
  },
  valueLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 15,
  },
  valueAmountSecondary: {
    fontSize: 14,
  },
  investmentFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 40,
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
    fontSize: 20,
    marginBottom: 10,
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
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    color: Colors.white,
  },

  // FAB
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
