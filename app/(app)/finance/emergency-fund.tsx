/**
 * Emergency Fund Screen - Premium design with animations
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  ChevronLeft,
  PiggyBank,
  Plus,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Calendar,
  Shield,
  TrendingUp,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { useEmergencyFund, useDepositEmergencyFund, useWithdrawEmergencyFund } from '../../../hooks/queries/useExpenses';

export default function EmergencyFundScreen() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { family } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);

  const { data: fund, refetch } = useEmergencyFund(family?.id || '');
  const depositMutation = useDepositEmergencyFund();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} د.ت`;

  const currentAmount = fund?.current_amount || 4500;
  const targetAmount = fund?.target_amount || 15000;
  const monthlyContribution = fund?.monthly_contribution || 500;
  const progress = Math.min(100, (currentAmount / targetAmount) * 100);
  const monthsToGoal = Math.ceil((targetAmount - currentAmount) / monthlyContribution);

  // Mock history for demo
  const history = fund?.history || [
    { id: '1', type: 'deposit', amount: 500, date: '١٥ مارس ٢٠٢٥', reason: 'إيداع شهري' },
    { id: '2', type: 'deposit', amount: 1000, date: '١ مارس ٢٠٢٥', reason: 'مكافأة' },
    { id: '3', type: 'withdraw', amount: 200, date: '٢٠ فبراير ٢٠٢٥', reason: 'إصلاح سيارة' },
    { id: '4', type: 'deposit', amount: 500, date: '١٥ فبراير ٢٠٢٥', reason: 'إيداع شهري' },
  ];

  const handleQuickDeposit = (depositAmount: number) => {
    depositMutation.mutate({ familyId: family?.id || '', amount: depositAmount });
    Alert.alert('تم الإيداع', `تم إيداع ${formatCurrency(depositAmount)} في صندوق الطوارئ`);
  };

  const quickDepositAmounts = [100, 250, 500, 1000];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>صندوق الطوارئ</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Main Balance Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={['#7c3aed', '#9333ea', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCard}
          >
            {/* Glass overlay */}
            <View style={styles.glassOverlay} />

            {/* Decorative elements */}
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />

            {/* Lock icon badge */}
            <View style={styles.lockBadge}>
              <Lock size={12} color="#7c3aed" />
              <Text style={styles.lockBadgeText}>محمي</Text>
            </View>

            <Animated.View entering={ZoomIn.duration(400).delay(300)} style={styles.iconCircle}>
              <PiggyBank size={36} color="#7c3aed" />
            </Animated.View>

            <Text style={styles.mainLabel}>الرصيد الحالي</Text>
            <Text style={styles.mainAmount}>{formatCurrency(currentAmount)}</Text>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTarget}>{formatCurrency(targetAmount)}</Text>
                <Text style={styles.progressLabel}>الهدف</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    entering={FadeInDown.duration(800).delay(500)}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>

              <View style={styles.progressFooter}>
                <Text style={styles.progressMonths}>
                  {monthsToGoal > 0 ? `${monthsToGoal} شهر للوصول` : 'تم تحقيق الهدف! 🎉'}
                </Text>
                <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
              </View>
            </View>

            {/* Quick Deposit Buttons */}
            <Text style={styles.quickDepositLabel}>إيداع سريع</Text>
            <View style={styles.quickActions}>
              {quickDepositAmounts.map((amount, index) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickButton}
                  onPress={() => handleQuickDeposit(amount)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickButtonText}>+{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={['#f3e8ff', '#ede9fe']}
              style={styles.statIconBg}
            >
              <Target size={20} color="#7c3aed" />
            </LinearGradient>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>الهدف</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(targetAmount)}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={['#dbeafe', '#e0e7ff']}
              style={styles.statIconBg}
            >
              <Calendar size={20} color="#3b82f6" />
            </LinearGradient>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>شهري</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(monthlyContribution)}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={['#dcfce7', '#d1fae5']}
              style={styles.statIconBg}
            >
              <TrendingUp size={20} color="#16a34a" />
            </LinearGradient>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>المتبقي</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(targetAmount - currentAmount)}</Text>
          </View>
        </Animated.View>

        {/* Security Notice */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <LinearGradient
            colors={isDark ? ['#2e1065', '#1e1b4b'] : ['#faf5ff', '#f5f3ff']}
            style={[styles.securityCard, { borderColor: isDark ? '#4c1d95' : '#e9d5ff' }]}
          >
            <View style={styles.securityIconContainer}>
              <Shield size={28} color="#7c3aed" />
              <Sparkles size={14} color="#a855f7" style={styles.sparkle} />
            </View>
            <View style={styles.securityText}>
              <Text style={[styles.securityTitle, { color: isDark ? '#e9d5ff' : '#6b21a8' }]}>
                صندوق طوارئ آمن
              </Text>
              <Text style={[styles.securityDesc, { color: isDark ? '#c4b5fd' : '#7c3aed' }]}>
                هذا المال مخفي ومحمي للحالات الطارئة فقط. لا تستخدمه إلا عند الضرورة القصوى.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Transaction History */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{history.length}</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>سجل المعاملات</Text>
          </View>

          <View style={styles.historyList}>
            {history.map((item: any, index: number) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.duration(400).delay(500 + index * 80)}
              >
                <View style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIcon,
                        { backgroundColor: item.type === 'deposit' ? '#dcfce7' : '#fef2f2' },
                      ]}
                    >
                      {item.type === 'deposit' ? (
                        <ArrowUpCircle size={22} color="#16a34a" />
                      ) : (
                        <ArrowDownCircle size={22} color="#dc2626" />
                      )}
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyType, { color: theme.text }]}>
                        {item.type === 'deposit' ? 'إيداع' : 'سحب'}
                      </Text>
                      <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{item.date}</Text>
                      {item.reason && (
                        <View style={[styles.reasonBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#f3e8ff' }]}>
                          <Text style={[styles.historyReason, { color: '#7c3aed' }]}>{item.reason}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyAmount,
                        { color: item.type === 'deposit' ? '#16a34a' : '#dc2626' },
                      ]}
                    >
                      {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing for action bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(600)}
        style={[styles.actionBar, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}
      >
        <TouchableOpacity
          style={styles.withdrawButton}
          activeOpacity={0.8}
        >
          <Minus size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>سحب</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={['#7c3aed', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.depositButton}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>إيداع</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_700Bold',
  },
  content: {
    padding: 16,
  },

  // Main Card
  mainCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    bottom: -20,
    right: -20,
  },
  lockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  lockBadgeText: {
    fontSize: 11,
    fontFamily: 'Tajawal_600SemiBold',
    color: '#7c3aed',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Tajawal_500Medium',
  },
  mainAmount: {
    fontSize: 42,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: 1,
  },

  // Progress
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Tajawal_500Medium',
  },
  progressTarget: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
  progressBarContainer: {
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  progressFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressPercent: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
  progressMonths: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Tajawal_500Medium',
  },

  // Quick Deposit
  quickDepositLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Tajawal_500Medium',
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    width: '100%',
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quickButtonText: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Tajawal_500Medium',
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Tajawal_700Bold',
  },

  // Security Card
  securityCard: {
    flexDirection: 'row-reverse',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  securityIconContainer: {
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  securityText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  securityTitle: {
    fontSize: 15,
    fontFamily: 'Tajawal_700Bold',
    marginBottom: 4,
  },
  securityDesc: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'right',
    lineHeight: 20,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Tajawal_700Bold',
  },
  sectionBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },

  // History
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 3,
  },
  historyType: {
    fontSize: 15,
    fontFamily: 'Tajawal_600SemiBold',
  },
  historyDate: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  historyReason: {
    fontSize: 11,
    fontFamily: 'Tajawal_500Medium',
  },
  historyRight: {
    alignItems: 'flex-start',
  },
  historyAmount: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
  },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    paddingBottom: 24,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#dc2626',
  },
  depositButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 160,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
});
