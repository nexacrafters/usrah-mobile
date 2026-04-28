/**
 * Debts & Loans Screen - Enhanced UI
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
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  MoreHorizontal,
  Filter,
  CreditCard,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useDebts, useDebtSummary } from '../../../hooks/queries/useExpenses';

const { width } = Dimensions.get('window');

export default function DebtsScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { family } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'all' | 'borrowed' | 'lent'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: debts, refetch } = useDebts(family?.id || '', activeTab === 'all' ? undefined : activeTab);
  const { data: summary } = useDebtSummary(family?.id || '');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} د.ت`;

  // Calculate net balance
  const netBalance = (summary?.total_lent || 0) - (summary?.total_borrowed || 0);
  const isPositive = netBalance >= 0;

  // Calculate stats
  const stats = useMemo(() => {
    const pendingDebts = debts?.filter((d: any) => d.status !== 'paid') || [];
    const overdueDebts = pendingDebts.filter((d: any) => {
      if (!d.due_date) return false;
      return new Date(d.due_date) < new Date();
    });
    return {
      pendingCount: pendingDebts.length,
      overdueCount: overdueDebts.length,
    };
  }, [debts]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors.primary[500] }]}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>الديون والسلف</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        contentContainerStyle={styles.content}
      >
        {/* Overview Card */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={isPositive ? [Colors.success, '#059669'] : [Colors.error, '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.overviewCard}
          >
            <View style={styles.overviewHeader}>
              <View style={styles.overviewIconBox}>
                <CreditCard size={24} color={Colors.white} />
              </View>
              <View style={styles.overviewHeaderText}>
                <Text style={styles.overviewTitle}>الرصيد الصافي</Text>
                <Text style={styles.overviewSubtitle}>
                  {isPositive ? 'لك أكثر مما عليك' : 'عليك أكثر مما لك'}
                </Text>
              </View>
            </View>

            <Text style={styles.overviewAmount}>
              {isPositive ? '+' : ''}{formatCurrency(netBalance)}
            </Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              {stats.pendingCount > 0 && (
                <View style={styles.quickStatBadge}>
                  <Clock size={12} color={Colors.white} />
                  <Text style={styles.quickStatText}>{stats.pendingCount} معلقة</Text>
                </View>
              )}
              {stats.overdueCount > 0 && (
                <View style={[styles.quickStatBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <AlertTriangle size={12} color={Colors.white} />
                  <Text style={styles.quickStatText}>{stats.overdueCount} متأخرة</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <View style={styles.summaryRow}>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderColor: activeTab === 'borrowed' ? Colors.error : theme.cardBorder },
                activeTab === 'borrowed' && { borderWidth: 2 },
              ]}
              onPress={() => setActiveTab('borrowed')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#fef2f2', '#fee2e2']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryIconBox}>
                  <ArrowDownCircle size={22} color={Colors.error} />
                </View>
              </LinearGradient>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>علي (مستلف)</Text>
              <Text style={[styles.summaryAmount, { color: Colors.error }]}>
                {formatCurrency(summary?.total_borrowed || 0)}
              </Text>
              <View style={styles.summaryFooter}>
                <Text style={[styles.summaryCount, { color: theme.textTertiary }]}>
                  {summary?.borrowed_count || 0} معاملات
                </Text>
                <TrendingDown size={14} color={Colors.error} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderColor: activeTab === 'lent' ? Colors.success : theme.cardBorder },
                activeTab === 'lent' && { borderWidth: 2 },
              ]}
              onPress={() => setActiveTab('lent')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ecfdf5', '#d1fae5']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryIconBox}>
                  <ArrowUpCircle size={22} color={Colors.success} />
                </View>
              </LinearGradient>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>لي (مسلّف)</Text>
              <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                {formatCurrency(summary?.total_lent || 0)}
              </Text>
              <View style={styles.summaryFooter}>
                <Text style={[styles.summaryCount, { color: theme.textTertiary }]}>
                  {summary?.lent_count || 0} معاملات
                </Text>
                <TrendingUp size={14} color={Colors.success} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)}>
          <View style={[styles.tabsContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={18} color={theme.icon} />
            </TouchableOpacity>
            <View style={styles.tabs}>
              {(['all', 'borrowed', 'lent'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && { backgroundColor: Colors.primary[500] }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, { color: activeTab === tab ? Colors.white : theme.textSecondary }]}>
                    {tab === 'all' ? 'الكل' : tab === 'borrowed' ? 'علي' : 'لي'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.debtCount, { color: theme.textSecondary }]}>
            {debts?.length || 0} سجلات
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>قائمة الديون</Text>
        </View>

        {/* Debts List */}
        <View style={styles.list}>
          {debts?.map((debt: any, index: number) => {
            const progress = debt.amount > 0 ? (debt.paid_amount / debt.amount) * 100 : 0;
            const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && debt.status !== 'paid';
            const isBorrowed = debt.type === 'borrowed';

            return (
              <Animated.View key={debt.id} entering={FadeInUp.duration(400).delay(200 + index * 50)}>
                <TouchableOpacity
                  style={[styles.debtCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.7}
                >
                  {/* Color Accent */}
                  <View style={[styles.debtAccent, { backgroundColor: isBorrowed ? Colors.error : Colors.success }]} />

                  <View style={styles.debtContent}>
                    {/* Header */}
                    <View style={styles.debtHeader}>
                      <View style={styles.debtHeaderRight}>
                        <View style={[styles.debtAvatar, { backgroundColor: isBorrowed ? '#fef2f2' : '#ecfdf5' }]}>
                          <User size={18} color={isBorrowed ? Colors.error : Colors.success} />
                        </View>
                        <View style={styles.debtPersonInfo}>
                          <Text style={[styles.personName, { color: theme.text }]}>{debt.person}</Text>
                          <Text style={[styles.debtDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                            {debt.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.debtHeaderLeft}>
                        <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.inputBackground }]}>
                          <MoreHorizontal size={16} color={theme.icon} />
                        </TouchableOpacity>
                        <View style={[styles.typeBadge, { backgroundColor: isBorrowed ? '#fef2f2' : '#ecfdf5' }]}>
                          {isBorrowed ? (
                            <ArrowDownCircle size={12} color={Colors.error} />
                          ) : (
                            <ArrowUpCircle size={12} color={Colors.success} />
                          )}
                          <Text style={[styles.typeText, { color: isBorrowed ? Colors.error : Colors.success }]}>
                            {isBorrowed ? 'علي' : 'لي'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Amount and Progress */}
                    <View style={styles.debtAmountSection}>
                      <View style={styles.amountRow}>
                        <Text style={[styles.debtAmount, { color: isBorrowed ? Colors.error : Colors.success }]}>
                          {formatCurrency(debt.amount)}
                        </Text>
                        {debt.paid_amount > 0 && (
                          <Text style={[styles.paidAmount, { color: theme.textSecondary }]}>
                            مدفوع: {formatCurrency(debt.paid_amount)}
                          </Text>
                        )}
                      </View>

                      {/* Progress Bar */}
                      {progress > 0 && progress < 100 && (
                        <View style={styles.progressSection}>
                          <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progress}%`, backgroundColor: isBorrowed ? Colors.error : Colors.success },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                            {Math.round(progress)}% مدفوع
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Footer */}
                    <View style={styles.debtFooter}>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: debt.status === 'paid' ? '#dcfce7' : isOverdue ? '#fef2f2' : '#fef3c7',
                        },
                      ]}>
                        {debt.status === 'paid' ? (
                          <CheckCircle size={12} color={Colors.success} />
                        ) : isOverdue ? (
                          <AlertTriangle size={12} color={Colors.error} />
                        ) : (
                          <Clock size={12} color={Colors.warning} />
                        )}
                        <Text style={[styles.statusText, {
                          color: debt.status === 'paid' ? Colors.success : isOverdue ? Colors.error : Colors.warning,
                        }]}>
                          {debt.status === 'paid' ? 'مسدد' : isOverdue ? 'متأخر' : 'قيد السداد'}
                        </Text>
                      </View>

                      <View style={styles.dueDateRow}>
                        <Text style={[styles.debtDate, { color: isOverdue ? Colors.error : theme.textSecondary }]}>
                          {debt.due_date || 'بدون موعد'}
                        </Text>
                        <Calendar size={12} color={isOverdue ? Colors.error : theme.textSecondary} />
                      </View>
                    </View>

                    {/* Action Button */}
                    {debt.status !== 'paid' && (
                      <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: isBorrowed ? Colors.error : Colors.success }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.payButtonText}>تسجيل دفعة</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Empty State */}
        {(!debts || debts.length === 0) && (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
              <CreditCard size={32} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>لا توجد سجلات ديون</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              أضف أول سجل لتتبع الديون والسلف
            </Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Plus size={18} color={Colors.white} />
              <Text style={styles.emptyButtonText}>إضافة سجل جديد</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient colors={[Colors.gold[500], Colors.gold[600]]} style={styles.fabGradient}>
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
  headerTitle: { fontSize: 20, fontFamily: 'Tajawal_700Bold' },
  content: { padding: 16 },
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
  overviewSubtitle: {
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
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
  },
  quickStatBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickStatText: {
    fontSize: 12,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.white,
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
  summaryAmount: { fontSize: 22, fontFamily: 'Tajawal_700Bold', marginTop: 4, textAlign: 'center' },
  summaryFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  summaryCount: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  // Tabs
  tabsContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    marginBottom: 20,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row-reverse',
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: { fontSize: 14, fontFamily: 'Tajawal_600SemiBold' },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Tajawal_700Bold' },
  debtCount: { fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  // Debt Card
  list: { gap: 14 },
  debtCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  debtAccent: {
    height: 4,
  },
  debtContent: {
    padding: 16,
  },
  debtHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  debtHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  debtAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  debtPersonInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  personName: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  debtDescription: { fontSize: 13, fontFamily: 'Tajawal_400Regular', marginTop: 2 },
  debtHeaderLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeText: { fontSize: 12, fontFamily: 'Tajawal_600SemiBold' },
  // Amount Section
  debtAmountSection: {
    marginBottom: 14,
  },
  amountRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 8,
  },
  debtAmount: { fontSize: 24, fontFamily: 'Tajawal_700Bold' },
  paidAmount: { fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  progressSection: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'right',
  },
  // Footer
  debtFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontFamily: 'Tajawal_600SemiBold' },
  dueDateRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  debtDate: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  payButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  payButtonText: { color: Colors.white, fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_700Bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', marginBottom: 20 },
  emptyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: { fontSize: 16, fontFamily: 'Tajawal_600SemiBold', color: Colors.white },
  // FAB
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
