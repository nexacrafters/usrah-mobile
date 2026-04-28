/**
 * Task Detail Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle2,
  Circle,
  Trash2,
  Trophy,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { useTask, useCompleteTask, useUncompleteTask, useDeleteTask } from '../../../hooks/queries/useTasks';

const priorities: Record<string, { label: string; labelAr: string; color: string; gradient: [string, string] }> = {
  urgent: { label: 'Urgent', labelAr: 'عاجل', color: Colors.error, gradient: ['#dc2626', '#b91c1c'] },
  high: { label: 'High', labelAr: 'عالية', color: Colors.warning, gradient: ['#f59e0b', '#d97706'] },
  normal: { label: 'Normal', labelAr: 'عادية', color: Colors.primary[500], gradient: [Colors.primary[500], Colors.primary[700]] },
  low: { label: 'Low', labelAr: 'منخفضة', color: Colors.slate[400], gradient: ['#64748b', '#475569'] },
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  // API hooks
  const { data: task, isLoading, refetch } = useTask(id || '');
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const deleteTask = useDeleteTask();

  const priority = task ? priorities[task.priority] || priorities.normal : priorities.normal;

  const handleStatusToggle = async () => {
    if (!task || !id) return;

    try {
      if (task.status === 'completed') {
        await uncompleteTask.mutateAsync(id);
      } else {
        await completeTask.mutateAsync(id);
        Alert.alert(
          rtl ? 'أحسنت!' : 'Great job!',
          rtl ? `لقد حصلت على ${task.points || 0} نقاط!` : `You earned ${task.points || 0} points!`
        );
      }
    } catch (error) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'فشل في تحديث حالة المهمة' : 'Failed to update task status'
      );
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      rtl ? 'حذف المهمة' : 'Delete Task',
      rtl ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert(
                rtl ? 'خطأ' : 'Error',
                rtl ? 'فشل في حذف المهمة' : 'Failed to delete task'
              );
            }
          },
        },
      ]
    );
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return rtl ? 'غير محدد' : 'Not set';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString(rtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return rtl ? `اليوم، ${timeStr}` : `Today, ${timeStr}`;
    if (isTomorrow) return rtl ? `غداً، ${timeStr}` : `Tomorrow, ${timeStr}`;
    return date.toLocaleDateString(rtl ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || !task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, rtl && styles.rowReverse]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {rtl ? 'تفاصيل المهمة' : 'Task Details'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {rtl ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = task.status;
  const isCompleted = status === 'completed';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'تفاصيل المهمة' : 'Task Details'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
          <RefreshCcw size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Priority Banner */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={priority.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.priorityBanner}
          >
            <View style={[styles.priorityContent, rtl && styles.rowReverse]}>
              <View style={styles.priorityLeft}>
                <Flag size={20} color={Colors.white} />
                <Text style={[styles.priorityText, { fontFamily: getFont('bold') }]}>
                  {rtl ? priority.labelAr : priority.label}
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <CheckCircle2 size={16} color={Colors.white} />
                  <Text style={[styles.completedText, { fontFamily: getFont('medium') }]}>
                    {rtl ? 'مكتملة' : 'Completed'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.titleSection}>
          <Text
            style={[
              styles.taskTitle,
              { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() },
              isCompleted && styles.completedTitle,
            ]}
          >
            {task.title}
          </Text>
        </Animated.View>

        {/* Points Card */}
        {(task.points || 0) > 0 && (
          <Animated.View entering={ZoomIn.duration(400).delay(300)}>
            <LinearGradient
              colors={[Colors.gold[500], Colors.gold[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pointsCard}
            >
              <View style={styles.pointsIcon}>
                <Trophy size={28} color={Colors.gold[800]} />
              </View>
              <View style={[styles.pointsInfo, rtl && styles.alignEnd]}>
                <Text style={[styles.pointsLabel, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'نقاط المهمة' : 'Task Points'}
                </Text>
                <View style={styles.pointsValue}>
                  <Zap size={18} color={Colors.gold[800]} />
                  <Text style={[styles.pointsNumber, { fontFamily: getFont('bold') }]}>
                    +{task.points}
                  </Text>
                </View>
              </View>
              <Sparkles size={24} color={Colors.gold[300]} style={styles.sparkle} />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Description */}
        {task.description && (
          <Animated.View entering={FadeInUp.duration(500).delay(350)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.primary[100] }]}>
                  <Target size={18} color={Colors.primary[600]} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                  {rtl ? 'الوصف' : 'Description'}
                </Text>
              </View>
              <Text style={[styles.description, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                {task.description}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Details Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)}>
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Due Date */}
            <View style={[styles.detailRow, rtl && styles.rowReverse, { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.primary[100] }]}>
                <Calendar size={20} color={Colors.primary[600]} />
              </View>
              <View style={[styles.detailContent, rtl && styles.alignEnd]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تاريخ الاستحقاق' : 'Due Date'}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            </View>

            {/* Assigned To */}
            {task.assigned_to_name && (
              <View style={[styles.detailRow, rtl && styles.rowReverse, { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
                <View style={[styles.detailIcon, { backgroundColor: Colors.sisters[100] }]}>
                  <User size={20} color={Colors.sisters[600]} />
                </View>
                <View style={[styles.detailContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'معين إلى' : 'Assigned To'}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {task.assigned_to_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Created By */}
            {task.created_by_name && (
              <View style={[styles.detailRow, rtl && styles.rowReverse, { borderBottomWidth: task.is_recurring ? 1 : 0, borderBottomColor: theme.divider }]}>
                <View style={[styles.detailIcon, { backgroundColor: Colors.gold[100] }]}>
                  <User size={20} color={Colors.gold[600]} />
                </View>
                <View style={[styles.detailContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'أنشأها' : 'Created By'}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {task.created_by_name}
                  </Text>
                </View>
              </View>
            )}

            {/* Recurring info */}
            {task.is_recurring && (
              <View style={[styles.detailRow, rtl && styles.rowReverse]}>
                <View style={[styles.detailIcon, { backgroundColor: Colors.primary[100] }]}>
                  <RefreshCcw size={20} color={Colors.primary[600]} />
                </View>
                <View style={[styles.detailContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'تكرار' : 'Recurring'}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {task.recurrence_pattern === 'daily' ? (rtl ? 'يومياً' : 'Daily') :
                     task.recurrence_pattern === 'weekly' ? (rtl ? 'أسبوعياً' : 'Weekly') :
                     task.recurrence_pattern === 'monthly' ? (rtl ? 'شهرياً' : 'Monthly') : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View entering={FadeInUp.duration(500).delay(500)} style={[styles.bottomActions, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: Colors.error }]}
          onPress={handleDelete}
          disabled={deleteTask.isPending}
        >
          {deleteTask.isPending ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Trash2 size={20} color={Colors.error} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleStatusToggle}
          disabled={completeTask.isPending || uncompleteTask.isPending}
          activeOpacity={0.9}
          style={styles.completeButtonWrapper}
        >
          <LinearGradient
            colors={isCompleted ? [Colors.slate[400], Colors.slate[500]] : [Colors.primary[500], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.completeButton, (completeTask.isPending || uncompleteTask.isPending) && { opacity: 0.7 }]}
          >
            {completeTask.isPending || uncompleteTask.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : isCompleted ? (
              <>
                <Circle size={22} color={Colors.white} />
                <Text style={[styles.completeButtonText, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'إلغاء الإكمال' : 'Mark Incomplete'}
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={22} color={Colors.white} />
                <Text style={[styles.completeButtonText, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'إكمال المهمة' : 'Complete Task'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Priority Banner
  priorityBanner: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityText: {
    fontSize: 16,
    color: Colors.white,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedText: {
    fontSize: 13,
    color: Colors.white,
  },

  // Title
  titleSection: {
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 26,
    lineHeight: 36,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },

  // Points Card
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
    marginLeft: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: Colors.gold[900],
    marginBottom: 4,
  },
  pointsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsNumber: {
    fontSize: 26,
    color: Colors.gold[900],
  },
  sparkle: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Section
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  deleteBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonWrapper: {
    flex: 1,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
  },
  completeButtonText: {
    fontSize: 17,
    color: Colors.white,
  },
});
