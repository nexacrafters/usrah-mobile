import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  I18nManager,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { TaskPriorities } from '../../../constants';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import { useTasks, useTaskLeaderboard, useCompleteTask, useUncompleteTask } from '../../../hooks/queries/useTasks';
import type { Task, TaskStatus, TaskPriority } from '../../../types/models';

type FilterType = 'all' | 'mine' | 'assigned';

export default function TasksScreen() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { user, family } = useAuthStore();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  // Build filters based on current selection
  const getFilters = () => {
    const filters: any = { family_id: family?.id || '' };

    if (filter === 'mine') {
      filters.created_by = user?.id;
    } else if (filter === 'assigned') {
      filters.assigned_to = user?.id;
    }

    if (statusFilter && statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    return filters;
  };

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useTasks(getFilters());

  // Fetch leaderboard
  const { data: leaderboard } = useTaskLeaderboard(family?.id || '');

  // Complete/uncomplete mutations
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  // Flatten paginated tasks
  const tasks = tasksData?.pages.flatMap((page) => page.results) || [];

  // Calculate task stats
  const taskStats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
    return { pending, inProgress, completed, total, completionRate, urgentCount };
  }, [tasks]);

  const pendingCount = taskStats.pending + taskStats.inProgress;

  const handleToggleComplete = useCallback((task: Task) => {
    if (task.status === 'completed') {
      uncompleteTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
  }, [completeTask, uncompleteTask]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getPriorityColor = (priority: string) => {
    const found = TaskPriorities.find((p) => p.id === priority);
    return found?.color || Colors.slate[400];
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('tasks.urgent');
      case 'high': return t('tasks.high');
      case 'normal': return t('tasks.medium');
      case 'low': return t('tasks.low');
      default: return priority;
    }
  };

  const getFilterLabel = (f: FilterType) => {
    switch (f) {
      case 'all': return t('tasks.all');
      case 'mine': return t('tasks.myTasks');
      case 'assigned': return t('tasks.assignedToMe');
      default: return f;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={22} color={Colors.success} />;
      case 'in_progress':
        return <Clock size={22} color={Colors.warning} />;
      default:
        return <Circle size={22} color={theme.textTertiary} />;
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return '';
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) {
      return `${t('tasks.today')}, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return `${t('tasks.tomorrow')}, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        item.status === 'completed' && styles.completedTask,
      ]}
      onPress={() => router.push(`/(app)/tasks/${item.id}`)}
    >
      <TouchableOpacity
        style={styles.statusButton}
        onPress={() => handleToggleComplete(item)}
        disabled={completeTask.isPending || uncompleteTask.isPending}
      >
        {getStatusIcon(item.status)}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              { color: theme.text },
              item.status === 'completed' && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.points > 0 && (
            <View style={styles.pointsBadge}>
              <Trophy size={12} color={Colors.gold[600]} />
              <Text style={styles.pointsText}>{item.points}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text
            style={[styles.taskDescription, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.taskMeta}>
          <View style={styles.metaLeft}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: `${getPriorityColor(item.priority)}20` },
              ]}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(item.priority) },
                ]}
              >
                {getPriorityLabel(item.priority)}
              </Text>
            </View>
            {item.due_date && (
              <View style={styles.dueDateBadge}>
                <Clock size={12} color={theme.textTertiary} />
                <Text style={[styles.dueDateText, { color: theme.textTertiary }]}>
                  {formatDueDate(item.due_date)}
                </Text>
              </View>
            )}
          </View>

          {item.assigned_to && (
            <View style={styles.assignee}>
              <View style={[styles.assigneeAvatar, { backgroundColor: Colors.primary[100] }]}>
                <Text style={styles.assigneeAvatarText}>
                  {item.assigned_to.full_name?.charAt(0) || item.assigned_to.id.charAt(0)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Status filter options
  const statusFilters: { id: TaskStatus | 'all'; label: string; labelAr: string; icon: any; color: string }[] = [
    { id: 'all', label: 'All', labelAr: 'الكل', icon: Target, color: Colors.primary[500] },
    { id: 'pending', label: 'Pending', labelAr: 'معلقة', icon: Circle, color: Colors.slate[500] },
    { id: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ', icon: Clock, color: Colors.warning },
    { id: 'completed', label: 'Done', labelAr: 'مكتملة', icon: CheckCircle2, color: Colors.success },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text, textAlign: getTextAlign() }]}>{t('tasks.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary, textAlign: getTextAlign() }]}>
            {pendingCount} {t('tasks.pending')}
          </Text>
        </View>
        <View style={[styles.headerActions, isRTL && styles.headerActionsRTL]}>
          <TouchableOpacity style={[styles.filterButton, { borderColor: theme.border }]}>
            <Filter size={20} color={theme.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colors.primary[500] }]}
            onPress={() => router.push('/(app)/tasks/add')}
          >
            <Plus size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Overview Card */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.statsSection}>
          <LinearGradient
            colors={[Colors.primary[600], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={[styles.statsHeader, isRTL && styles.rowReverse]}>
              <View style={styles.statsIconBox}>
                <Target size={22} color={Colors.gold[400]} />
              </View>
              <View style={[styles.statsHeaderText, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={styles.statsTitle}>
                  {isRTL ? 'نظرة عامة على المهام' : 'Tasks Overview'}
                </Text>
                <Text style={styles.statsSubtitle}>
                  {isRTL ? 'هذا الأسبوع' : 'This Week'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Circle size={18} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{taskStats.pending}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'معلقة' : 'Pending'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Clock size={18} color={Colors.warning} />
                </View>
                <Text style={styles.statValue}>{taskStats.inProgress}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'قيد التنفيذ' : 'In Progress'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <CheckCircle2 size={18} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{taskStats.completed}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'مكتملة' : 'Done'}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={[styles.progressHeader, isRTL && styles.rowReverse]}>
                <Text style={styles.progressLabel}>
                  {isRTL ? 'نسبة الإنجاز' : 'Completion Rate'}
                </Text>
                <Text style={styles.progressPercent}>{taskStats.completionRate}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${taskStats.completionRate}%` }]} />
              </View>
            </View>

            {/* Urgent Alert */}
            {taskStats.urgentCount > 0 && (
              <View style={[styles.urgentAlert, isRTL && styles.rowReverse]}>
                <Flame size={16} color={Colors.error} />
                <Text style={styles.urgentText}>
                  {isRTL
                    ? `${taskStats.urgentCount} مهام عاجلة تحتاج انتباهك`
                    : `${taskStats.urgentCount} urgent tasks need attention`}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Leaderboard Card */}
        {leaderboard && leaderboard.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.leaderboardContainer}>
            <LinearGradient
              colors={[Colors.gold[500], Colors.gold[600]]}
              style={styles.leaderboardCard}
            >
              <View style={[styles.leaderboardHeader, isRTL && styles.leaderboardHeaderRTL]}>
                <View style={styles.leaderboardIconBox}>
                  <Trophy size={20} color={Colors.navy[900]} />
                </View>
                <Text style={[styles.leaderboardTitle, { color: Colors.navy[900] }]}>
                  {t('tasks.familyLeaderboard')}
                </Text>
              </View>
              <View style={styles.leaderboardList}>
                {leaderboard.slice(0, 3).map((member, index) => (
                  <View key={member.user_id} style={styles.leaderboardItem}>
                    <View style={[styles.leaderboardRank, { backgroundColor: index === 0 ? Colors.gold[300] : 'rgba(255,255,255,0.3)' }]}>
                      {index === 0 ? (
                        <Star size={14} color={Colors.gold[700]} fill={Colors.gold[700]} />
                      ) : (
                        <Text style={styles.rankText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={[styles.memberAvatar, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                      <Text style={[styles.memberAvatarText, { color: Colors.navy[900] }]}>
                        {member.full_name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <Text style={[styles.memberName, { color: Colors.navy[900] }]}>
                      {member.full_name || t('common.unknown')}
                    </Text>
                    <View style={styles.pointsBox}>
                      <Zap size={12} color={Colors.navy[800]} />
                      <Text style={[styles.memberPoints, { color: Colors.navy[800] }]}>
                        {member.total_points}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Status Filter Chips */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.statusFilters, isRTL && styles.statusFiltersRTL]}
          >
            {statusFilters.map((sf) => {
              const Icon = sf.icon;
              const isActive = statusFilter === sf.id;
              return (
                <TouchableOpacity
                  key={sf.id}
                  style={[
                    styles.statusFilterChip,
                    { backgroundColor: isActive ? sf.color : theme.card, borderColor: isActive ? sf.color : theme.cardBorder },
                  ]}
                  onPress={() => setStatusFilter(sf.id)}
                >
                  <Icon size={16} color={isActive ? Colors.white : sf.color} />
                  <Text style={[styles.statusFilterText, { color: isActive ? Colors.white : theme.text }]}>
                    {isRTL ? sf.labelAr : sf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabs, isRTL && styles.filterTabsRTL]}>
          {(['all', 'mine', 'assigned'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                { backgroundColor: filter === f ? Colors.primary[500] : theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === f ? Colors.white : theme.textSecondary },
                ]}
              >
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <View style={styles.tasksListSection}>
          <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {isRTL ? 'قائمة المهام' : 'Task List'}
            </Text>
            <Text style={[styles.taskCount, { color: theme.textSecondary }]}>
              {tasks.length} {isRTL ? 'مهمة' : 'tasks'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : tasks.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
                <Target size={32} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {t('tasks.noTasks')}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {isRTL ? 'أضف مهمة جديدة للبدء' : 'Add a new task to get started'}
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: Colors.primary[500] }]}
                onPress={() => router.push('/(app)/tasks/add')}
              >
                <Plus size={18} color={Colors.white} />
                <Text style={styles.emptyButtonText}>{t('tasks.addTask')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View entering={FadeInUp.duration(500).delay(200)}>
              {tasks.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInUp.duration(400).delay(250 + index * 50)}>
                  {renderTask({ item })}
                </Animated.View>
              ))}
              {isFetchingNextPage && (
                <ActivityIndicator style={{ padding: 16 }} color={Colors.primary[500]} />
              )}
              {hasNextPage && !isFetchingNextPage && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, { borderColor: Colors.primary[500] }]}
                  onPress={handleLoadMore}
                >
                  <Text style={[styles.loadMoreText, { color: Colors.primary[500] }]}>
                    {isRTL ? 'تحميل المزيد' : 'Load More'}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/tasks/add')}
        activeOpacity={0.8}
      >
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
  container: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: getFont('bold'),
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getFont('regular'),
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionsRTL: {
    flexDirection: 'row-reverse',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats Section
  statsSection: {
    padding: 20,
  },
  statsCard: {
    borderRadius: 24,
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsHeaderText: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: getFont('bold'),
    color: Colors.white,
  },
  statsSubtitle: {
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
    gap: 8,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
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
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: getFont('regular'),
    color: 'rgba(255,255,255,0.8)',
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: getFont('bold'),
    color: Colors.gold[400],
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
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  urgentText: {
    flex: 1,
    fontSize: 13,
    fontFamily: getFont('medium'),
    color: Colors.white,
  },
  // Leaderboard
  leaderboardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  leaderboardCard: {
    borderRadius: 20,
    padding: 16,
  },
  leaderboardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  leaderboardTitle: {
    fontSize: 16,
    fontFamily: getFont('bold'),
  },
  leaderboardList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaderboardItem: {
    alignItems: 'center',
    gap: 6,
  },
  leaderboardRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontFamily: getFont('bold'),
    color: Colors.navy[800],
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontFamily: getFont('bold'),
  },
  memberName: {
    fontSize: 13,
    fontFamily: getFont('semibold'),
  },
  pointsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  memberPoints: {
    fontSize: 12,
    fontFamily: getFont('bold'),
  },
  // Status Filters
  statusFilters: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  statusFiltersRTL: {
    flexDirection: 'row-reverse',
  },
  statusFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusFilterText: {
    fontSize: 13,
    fontFamily: getFont('medium'),
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTabsRTL: {
    flexDirection: 'row-reverse',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: getFont('medium'),
  },
  // Tasks List Section
  tasksListSection: {
    paddingHorizontal: 20,
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
  taskCount: {
    fontSize: 13,
    fontFamily: getFont('regular'),
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  completedTask: {
    opacity: 0.7,
  },
  statusButton: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: getFont('semibold'),
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontFamily: getFont('semibold'),
    color: Colors.gold[700],
  },
  taskDescription: {
    fontSize: 13,
    fontFamily: getFont('regular'),
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: getFont('medium'),
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    fontFamily: getFont('regular'),
  },
  assignee: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarText: {
    fontSize: 12,
    fontFamily: getFont('semibold'),
    color: Colors.primary[600],
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: getFont('bold'),
    textAlign: 'center',
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
  loadMoreButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: getFont('medium'),
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    left: 20,
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
