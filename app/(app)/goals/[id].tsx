/**
 * Goal Detail Screen - Premium Design
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Edit3,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Coins,
  X,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import {
  useGoal,
  useGoalContributions,
  useContribute,
  useDeleteGoal,
  usePauseGoal,
  useResumeGoal,
  goalsApi,
} from '../../../hooks/queries/useGoals';

const categoryConfig: Record<string, { gradient: string[]; icon: any; bgLight: string }> = {
  hajj: { gradient: [Colors.gold[500], Colors.gold[600]], icon: Target, bgLight: Colors.gold[100] },
  umrah: { gradient: [Colors.primary[500], Colors.primary[600]], icon: Target, bgLight: Colors.primary[100] },
  education: { gradient: [Colors.sisters[500], Colors.sisters[600]], icon: Target, bgLight: Colors.sisters[100] },
  home: { gradient: ['#f59e0b', '#d97706'], icon: Target, bgLight: '#fef3c7' },
  car: { gradient: ['#3b82f6', '#2563eb'], icon: Target, bgLight: '#dbeafe' },
  emergency: { gradient: [Colors.error, '#b91c1c'], icon: Target, bgLight: '#fee2e2' },
  wedding: { gradient: ['#ec4899', '#db2777'], icon: Target, bgLight: '#fce7f3' },
  charity: { gradient: [Colors.success, '#15803d'], icon: Target, bgLight: '#dcfce7' },
  other: { gradient: [Colors.slate[500], Colors.slate[600]], icon: Target, bgLight: Colors.slate[100] },
};

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  const [refreshing, setRefreshing] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');

  // Fetch data
  const { data: goal, isLoading, refetch } = useGoal(id || '');
  const { data: contributions = [], refetch: refetchContributions } = useGoalContributions(id || '');

  // Mutations
  const contributeMutation = useContribute();
  const deleteMutation = useDeleteGoal();
  const pauseMutation = usePauseGoal();
  const resumeMutation = useResumeGoal();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchContributions()]);
    setRefreshing(false);
  }, [refetch, refetchContributions]);

  const handleContribute = async () => {
    if (!contributeAmount || isNaN(Number(contributeAmount))) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    try {
      await contributeMutation.mutateAsync({
        goalId: id!,
        amount: Number(contributeAmount),
        note: contributeNote.trim() || undefined,
      });
      setShowContributeModal(false);
      setContributeAmount('');
      setContributeNote('');
      Alert.alert(rtl ? 'نجاح' : 'Success', rtl ? 'تمت إضافة المساهمة' : 'Contribution added');
    } catch (error: any) {
      Alert.alert(rtl ? 'خطأ' : 'Error', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      rtl ? 'حذف الهدف' : 'Delete Goal',
      rtl ? 'هل أنت متأكد من حذف هذا الهدف؟' : 'Are you sure you want to delete this goal?',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id!);
              router.back();
            } catch (error: any) {
              Alert.alert(rtl ? 'خطأ' : 'Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handlePauseResume = async () => {
    try {
      if (goal?.status === 'paused') {
        await resumeMutation.mutateAsync(id!);
      } else {
        await pauseMutation.mutateAsync(id!);
      }
    } catch (error: any) {
      Alert.alert(rtl ? 'خطأ' : 'Error', error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, rtl && styles.rowReverse]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {rtl ? 'تفاصيل الهدف' : 'Goal Details'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: Colors.primary[100] }]}>
            <Target size={48} color={Colors.primary[500]} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {rtl ? 'الهدف غير موجود' : 'Goal not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = goalsApi.calculateProgress(goal);
  const config = categoryConfig[goal.category] || categoryConfig.other;
  const categoryInfo = goalsApi.getCategoryInfo(goal.category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'تفاصيل الهدف' : 'Goal Details'}
        </Text>
        <TouchableOpacity onPress={() => router.push(`/goals/edit/${id}`)} style={styles.editButton}>
          <Edit3 size={20} color={theme.text} />
        </TouchableOpacity>
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
        {/* Goal Header Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            {/* Decorative Elements */}
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />

            <View style={styles.headerCardContent}>
              <Animated.View entering={ZoomIn.duration(400).delay(200)} style={styles.goalIconCircle}>
                <Target size={32} color={config.gradient[0]} />
              </Animated.View>

              <View style={styles.statusBadge}>
                {goal.status === 'completed' ? (
                  <CheckCircle size={14} color="#a7f3d0" />
                ) : goal.status === 'paused' ? (
                  <Pause size={14} color="#fcd34d" />
                ) : (
                  <Sparkles size={14} color={Colors.white} />
                )}
                <Text style={[styles.statusText, { fontFamily: getFont('medium') }]}>
                  {goal.status === 'completed'
                    ? (rtl ? 'مكتمل' : 'Completed')
                    : goal.status === 'paused'
                    ? (rtl ? 'متوقف' : 'Paused')
                    : (rtl ? 'نشط' : 'Active')}
                </Text>
              </View>
            </View>

            <View style={styles.headerCardText}>
              <Text style={[styles.categoryLabel, { fontFamily: getFont('medium') }]}>
                {rtl ? categoryInfo.labelAr : categoryInfo.label}
              </Text>
              <Text style={[styles.goalTitle, { fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {goal.title}
              </Text>
              {goal.description && (
                <Text style={[styles.goalDesc, { fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {goal.description}
                </Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Progress Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.progressHeader, rtl && styles.rowReverse]}>
              <View style={[styles.progressIconBox, { backgroundColor: config.bgLight }]}>
                <TrendingUp size={20} color={config.gradient[0]} />
              </View>
              <Text style={[styles.progressLabel, { color: theme.text, fontFamily: getFont('bold') }]}>
                {rtl ? 'التقدم' : 'Progress'}
              </Text>
              <Text style={[styles.progressPercent, { color: config.gradient[0], fontFamily: getFont('bold') }]}>
                {progress}%
              </Text>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: theme.inputBackground }]}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>

            <View style={[styles.amountRow, rtl && styles.rowReverse]}>
              <Text style={[styles.currentAmount, { color: config.gradient[0], fontFamily: getFont('bold') }]}>
                {goal.current_amount.toLocaleString()}
              </Text>
              <Text style={[styles.targetAmount, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                / {goal.target_amount.toLocaleString()} {goal.currency}
              </Text>
            </View>

            {goal.deadline && (
              <View style={[styles.deadlineRow, { backgroundColor: theme.inputBackground }, rtl && styles.rowReverse]}>
                <Calendar size={16} color={theme.textSecondary} />
                <Text style={[styles.deadlineText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                  {rtl ? 'الموعد النهائي: ' : 'Deadline: '}
                  {new Date(goal.deadline).toLocaleDateString(rtl ? 'ar-SA' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Contribute Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <TouchableOpacity
            onPress={() => setShowContributeModal(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contributeButton}
            >
              <Coins size={22} color={Colors.white} />
              <Text style={[styles.contributeButtonText, { fontFamily: getFont('bold') }]}>
                {rtl ? 'إضافة مساهمة' : 'Add Contribution'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Contributions */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.contributionsSection}>
          <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
              <Users size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'المساهمات' : 'Contributions'}
            </Text>
            <View style={styles.countBadge}>
              <Text style={[styles.countBadgeText, { fontFamily: getFont('bold') }]}>
                {contributions.length}
              </Text>
            </View>
          </View>

          {contributions.length === 0 ? (
            <View style={[styles.noContributions, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TrendingUp size={32} color={theme.textTertiary} />
              <Text style={[styles.noContributionsText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'لا توجد مساهمات بعد' : 'No contributions yet'}
              </Text>
            </View>
          ) : (
            contributions.map((contribution, index) => (
              <Animated.View
                key={contribution.id}
                entering={FadeInUp.duration(300).delay(500 + index * 60)}
              >
                <View style={[styles.contributionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.contributionHeader, rtl && styles.rowReverse]}>
                    <LinearGradient
                      colors={config.gradient}
                      style={styles.contributorAvatar}
                    >
                      <Text style={[styles.contributorInitial, { fontFamily: getFont('bold') }]}>
                        {contribution.contributor_name?.charAt(0) || '?'}
                      </Text>
                    </LinearGradient>
                    <View style={[styles.contributionInfo, rtl && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.contributorName, { color: theme.text, fontFamily: getFont('medium') }]}>
                        {contribution.contributor_name}
                      </Text>
                      <Text style={[styles.contributionDate, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                        {new Date(contribution.created_at).toLocaleDateString(rtl ? 'ar-SA' : 'en-US')}
                      </Text>
                    </View>
                    <Text style={[styles.contributionAmount, { color: config.gradient[0], fontFamily: getFont('bold') }]}>
                      +{contribution.amount.toLocaleString()} {goal.currency}
                    </Text>
                  </View>
                  {contribution.note && (
                    <Text style={[styles.contributionNote, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                      {contribution.note}
                    </Text>
                  )}
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.duration(500).delay(500)} style={[styles.actionsSection, rtl && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: goal.status === 'paused' ? Colors.success : Colors.warning }]}
            onPress={handlePauseResume}
          >
            {goal.status === 'paused' ? (
              <>
                <Play size={20} color={Colors.success} />
                <Text style={[styles.actionText, { color: Colors.success, fontFamily: getFont('medium') }]}>
                  {rtl ? 'استئناف' : 'Resume'}
                </Text>
              </>
            ) : (
              <>
                <Pause size={20} color={Colors.warning} />
                <Text style={[styles.actionText, { color: Colors.warning, fontFamily: getFont('medium') }]}>
                  {rtl ? 'إيقاف' : 'Pause'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: Colors.error }]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error, fontFamily: getFont('medium') }]}>
              {rtl ? 'حذف' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Contribute Modal */}
      {showContributeModal && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(300)} style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, rtl && styles.rowReverse]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                {rtl ? 'إضافة مساهمة' : 'Add Contribution'}
              </Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.modalInputIcon, { backgroundColor: config.bgLight }]}>
                <Coins size={24} color={config.gradient[0]} />
              </View>

              <TextInput
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular') }]}
                value={contributeAmount}
                onChangeText={setContributeAmount}
                placeholder={rtl ? 'المبلغ' : 'Amount'}
                placeholderTextColor={theme.placeholder}
                keyboardType="number-pad"
                textAlign={rtl ? 'right' : 'left'}
              />

              <TextInput
                style={[styles.modalTextArea, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={contributeNote}
                onChangeText={setContributeNote}
                placeholder={rtl ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                placeholderTextColor={theme.placeholder}
                multiline
              />

              <View style={[styles.modalButtons, rtl && styles.rowReverse]}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { backgroundColor: theme.inputBackground }]}
                  onPress={() => setShowContributeModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text, fontFamily: getFont('medium') }]}>
                    {rtl ? 'إلغاء' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContribute}
                  disabled={contributeMutation.isPending}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={config.gradient}
                    style={styles.modalSubmitButton}
                  >
                    {contributeMutation.isPending ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={[styles.modalSubmitText, { fontFamily: getFont('bold') }]}>
                        {rtl ? 'إضافة' : 'Add'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  emptyIcon: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 17 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  editButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18 },
  content: { flex: 1, padding: 20 },

  // Header Card
  headerCard: { borderRadius: 28, padding: 24, marginBottom: 20, overflow: 'hidden', position: 'relative' },
  decorCircle: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle1: { width: 150, height: 150, top: -50, right: -30 },
  decorCircle2: { width: 100, height: 100, bottom: -30, left: -20 },
  headerCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  goalIconCircle: { width: 64, height: 64, borderRadius: 22, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontSize: 13, color: Colors.white },
  headerCardText: { alignItems: 'flex-end' },
  categoryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  goalTitle: { fontSize: 24, color: Colors.white, marginBottom: 8 },
  goalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },

  // Progress Card
  progressCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 20 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  progressIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  progressLabel: { flex: 1, fontSize: 16 },
  progressPercent: { fontSize: 28 },
  progressBarBg: { height: 14, borderRadius: 7, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 7 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 },
  currentAmount: { fontSize: 32 },
  targetAmount: { fontSize: 16 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  deadlineText: { fontSize: 14 },

  // Contribute Button
  contributeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 18, gap: 12, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  contributeButtonText: { fontSize: 17, color: Colors.white },

  // Contributions Section
  contributionsSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 17 },
  countBadge: { backgroundColor: Colors.primary[500], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 13, color: Colors.white },
  noContributions: { padding: 40, borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 14 },
  noContributionsText: { fontSize: 15 },
  contributionCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  contributionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  contributorAvatar: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  contributorInitial: { fontSize: 18, color: Colors.white },
  contributionInfo: { flex: 1 },
  contributorName: { fontSize: 15, marginBottom: 3 },
  contributionDate: { fontSize: 12 },
  contributionAmount: { fontSize: 17 },
  contributionNote: { fontSize: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },

  // Actions
  actionsSection: { flexDirection: 'row', gap: 14 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, gap: 10 },
  actionText: { fontSize: 15 },

  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  modalTitle: { fontSize: 20 },
  modalBody: { padding: 20, alignItems: 'center' },
  modalInputIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalInput: { width: '100%', height: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 18, fontSize: 18, marginBottom: 14 },
  modalTextArea: { width: '100%', minHeight: 90, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, textAlignVertical: 'top', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 14, width: '100%' },
  modalCancelButton: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 16 },
  modalSubmitButton: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
  modalSubmitText: { fontSize: 16, color: Colors.white },
});
