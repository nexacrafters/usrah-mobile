/**
 * Tasks Board Screen
 * Kanban-style task management backed by the real /tasks API.
 *
 * Collaboration features:
 *  - Each card shows its assignee (Avatar + name) with a "Assigned to you" badge
 *    when the task is assigned to the current user.
 *  - Long-press a card to open an action sheet to MOVE it between columns
 *    (To Do / In Progress / Done -> persisted via updateTask) or to REASSIGN it
 *    to a family member (persisted via assignTask).
 *
 * Drag approach: we use the reliable long-press -> action-sheet "Move to ..."
 * pattern (recommended fallback in the spec) instead of free cross-column
 * dragging. A horizontal kanban with nested vertical ScrollViews makes a
 * gesture-driven cross-column drag fragile in bare RN; the long-press menu is
 * built on react-native-gesture-handler's Pressable and works reliably on both
 * platforms while still persisting status changes through the API.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import i18n from '../../../i18n';
import taskCollabEn from '../../../i18n/locales/taskscollab.en';
import taskCollabAr from '../../../i18n/locales/taskscollab.ar';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import {useTaskStore, Task, TaskStatus, TaskPriority} from '../../store/taskStore';
import {useFamilyStore, FamilyMember} from '../../store/familyStore';
import {getCurrentFamilyId, useAuthStore} from '../../store/authStore';
import taskService from '../../services/api/task.service';
import familyService from '../../services/api/family.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

// Merge the NEW collaboration keys into the existing `tasks` namespace without
// editing en.ts / ar.ts / index.ts. Deep-merge so existing keys are preserved.
i18n.addResourceBundle('en', 'translation', taskCollabEn, true, false);
i18n.addResourceBundle('ar', 'translation', taskCollabAr, true, false);

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: colors.slate[400],
  normal: colors.islamic.mashallah,
  high: colors.gold[500],
  urgent: colors.error,
};

const COLUMNS: Array<{titleKey: string; status: TaskStatus; color: string}> = [
  {titleKey: 'tasks.toDo', status: 'pending', color: colors.slate[500]},
  {titleKey: 'tasks.inProgress', status: 'in_progress', color: colors.primary[500]},
  {titleKey: 'tasks.done', status: 'completed', color: colors.islamic.mashallah},
];

const MOVE_TARGETS: Array<{labelKey: string; status: TaskStatus}> = [
  {labelKey: 'tasks.moveToToDo', status: 'pending'},
  {labelKey: 'tasks.moveToInProgress', status: 'in_progress'},
  {labelKey: 'tasks.moveToDone', status: 'completed'},
];

export default function TasksScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {
    tasks,
    isLoading,
    error,
    setTasks,
    setLoading,
    setError,
    updateTask: updateTaskInStore,
    getTasksByStatus,
  } = useTaskStore();
  const {members, setMembers} = useFamilyStore();
  const currentUserId = useAuthStore((s) => s.user?.public_id ?? null);
  const [refreshing, setRefreshing] = useState(false);

  // Action sheet state (long-press menu) and reassign picker.
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pickerTask, setPickerTask] = useState<Task | null>(null);

  const loadTasks = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setTasks([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('tasks.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setTasks, setLoading, setError, t],
  );

  // Lazily load family members so the reassign picker has data.
  const ensureMembers = useCallback(() => {
    const familyId = getCurrentFamilyId();
    if (!familyId || members.length > 0) {
      return;
    }
    familyService
      .getMembers(familyId)
      .then(setMembers)
      .catch(() => {
        /* reassign picker is best-effort */
      });
  }, [members.length, setMembers]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      ensureMembers();
    }, [loadTasks, ensureMembers]),
  );

  const activeCount = tasks.filter((tk) => tk.status !== 'completed').length;

  // Move a task to a new column. Optimistic update + API persist + reload.
  const moveTask = useCallback(
    async (task: Task, status: TaskStatus) => {
      setActiveTask(null);
      if (task.status === status) {
        return;
      }
      const prevStatus = task.status;
      updateTaskInStore(task.id, {status}); // optimistic
      try {
        await taskService.updateTask(task.id, {status});
      } catch (e) {
        updateTaskInStore(task.id, {status: prevStatus}); // rollback
        setError(e instanceof Error ? e.message : t('tasks.updateError'));
      } finally {
        loadTasks(true);
      }
    },
    [updateTaskInStore, setError, t, loadTasks],
  );

  // Reassign a task to a family member (or unassign with null).
  const reassignTask = useCallback(
    async (task: Task, member: FamilyMember | null) => {
      setPickerTask(null);
      const assignedToId = member?.user.public_id ?? null;
      const optimistic = member
        ? {
            public_id: member.user.public_id,
            full_name: member.user.full_name,
            avatar: member.user.avatar,
            gender: member.user.gender,
          }
        : null;
      const prevAssigned = task.assigned_to;
      updateTaskInStore(task.id, {assigned_to: optimistic}); // optimistic
      try {
        await taskService.assignTask(task.id, assignedToId);
      } catch (e) {
        updateTaskInStore(task.id, {assigned_to: prevAssigned}); // rollback
        setError(e instanceof Error ? e.message : t('tasks.assignError'));
      } finally {
        loadTasks(true);
      }
    },
    [updateTaskInStore, setError, t, loadTasks],
  );

  const renderTask = (task: Task) => {
    const isMine =
      !!task.assigned_to &&
      !!currentUserId &&
      task.assigned_to.public_id === currentUserId;
    return (
      <Pressable
        key={task.id}
        style={({pressed}) => [
          styles.taskCard,
          isMine && styles.taskCardMine,
          pressed && styles.taskCardPressed,
        ]}
        onLongPress={() => {
          ensureMembers();
          setActiveTask(task);
        }}
        delayLongPress={250}>
        <View style={styles.taskHeader}>
          <View
            style={[
              styles.priorityDot,
              {backgroundColor: PRIORITY_COLORS[task.priority] ?? colors.slate[400]},
            ]}
          />
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.is_private ? '🔒 ' : ''}{task.title}
          </Text>
        </View>

        {!!task.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {isMine && (
          <View style={styles.mineBadge}>
            <Text style={styles.mineBadgeText}>{t('tasks.assignedToYou')}</Text>
          </View>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.taskAssigned}>
            {task.assigned_to ? (
              <>
                <Avatar name={task.assigned_to.full_name} size="small" />
                <Text style={styles.taskAssignedText} numberOfLines={1}>
                  {task.assigned_to.full_name}
                </Text>
              </>
            ) : (
              <Text style={styles.taskAssignedText}>
                {t('tasks.unassigned')}
              </Text>
            )}
          </View>
          {!!task.due_date && (
            <View
              style={[
                styles.dueDateBadge,
                task.is_overdue && styles.dueDateBadgeUrgent,
              ]}>
              <Text
                style={[
                  styles.dueDateText,
                  task.is_overdue && styles.dueDateTextUrgent,
                ]}>
                {task.due_date}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderColumn = (
    key: string,
    title: string,
    status: TaskStatus,
    color: string,
  ) => {
    const columnTasks = getTasksByStatus(status);
    return (
      <View key={key} style={styles.column}>
        <View style={[styles.columnHeader, {backgroundColor: color + '20'}]}>
          <Text style={[styles.columnTitle, {color}]}>{title}</Text>
          <View style={[styles.columnBadge, {backgroundColor: color}]}>
            <Text style={styles.columnBadgeText}>{columnTasks.length}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnContentContainer}>
          {columnTasks.length > 0 ? (
            columnTasks.map(renderTask)
          ) : (
            <View style={styles.emptyColumn}>
              <Text style={styles.emptyColumnText}>{t('tasks.noTasks')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const hasFamily = !!getCurrentFamilyId();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('tasks.familyTasks')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('tasks.activeTasks', {count: activeCount})}
          </Text>
        </View>
      </View>

      {!hasFamily ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>{t('tasks.noFamilyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('tasks.noFamilyBody')}</Text>
        </View>
      ) : isLoading && tasks.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error && tasks.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>{t('tasks.couldntLoad')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadTasks()}>
            <Text style={styles.retryText}>{t('tasks.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTasks(true)}
              tintColor={colors.primary[500]}
            />
          }>
          {/* Stats */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}>
            {COLUMNS.map((col) => (
              <Card key={col.status} style={styles.statCard}>
                <Text style={[styles.statNumber, {color: col.color}]}>
                  {getTasksByStatus(col.status).length}
                </Text>
                <Text style={styles.statLabel}>{t(col.titleKey)}</Text>
              </Card>
            ))}
          </ScrollView>

          {/* Hint */}
          <Text style={styles.boardHint}>{t('tasks.cardHint')}</Text>

          {/* Kanban Board */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boardContainer}>
            {COLUMNS.map((col) =>
              renderColumn(col.status, t(col.titleKey), col.status, col.color),
            )}
          </ScrollView>
        </ScrollView>
      )}

      {/* Add Task FAB */}
      {hasFamily && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            try {
              navigation.navigate('AddTask' as never);
            } catch {
              /* route not registered yet */
            }
          }}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            style={styles.fabGradient}>
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Long-press action sheet: Move + Reassign */}
      <Modal
        visible={!!activeTask}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTask(null)}>
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setActiveTask(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {activeTask?.title}
            </Text>

            <Text style={styles.sheetSectionLabel}>{t('tasks.moveTo')}</Text>
            {MOVE_TARGETS.map((target) => {
              const isCurrent = activeTask?.status === target.status;
              return (
                <TouchableOpacity
                  key={target.status}
                  disabled={isCurrent}
                  style={[styles.sheetItem, isCurrent && styles.sheetItemDisabled]}
                  onPress={() => activeTask && moveTask(activeTask, target.status)}>
                  <Text
                    style={[
                      styles.sheetItemText,
                      isCurrent && styles.sheetItemTextDisabled,
                    ]}>
                    {t(target.labelKey)}
                  </Text>
                  {isCurrent && <Text style={styles.sheetCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                const task = activeTask;
                setActiveTask(null);
                ensureMembers();
                setPickerTask(task);
              }}>
              <Text style={styles.sheetItemText}>{t('tasks.reassign')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetCancel]}
              onPress={() => setActiveTask(null)}>
              <Text style={styles.sheetCancelText}>{t('tasks.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reassign member picker */}
      <Modal
        visible={!!pickerTask}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTask(null)}>
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setPickerTask(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('tasks.assignToMember')}</Text>

            <ScrollView style={styles.pickerScroll}>
              {members.map((member) => {
                const selected =
                  pickerTask?.assigned_to?.public_id === member.user.public_id;
                return (
                  <TouchableOpacity
                    key={member.public_id}
                    style={styles.memberRow}
                    onPress={() =>
                      pickerTask && reassignTask(pickerTask, member)
                    }>
                    <Avatar name={member.user.full_name} size="small" />
                    <Text style={styles.memberRowName} numberOfLines={1}>
                      {member.user.full_name}
                    </Text>
                    {selected && <Text style={styles.sheetCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => pickerTask && reassignTask(pickerTask, null)}>
              <Text style={styles.sheetItemText}>{t('tasks.unassign')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetCancel]}
              onPress={() => setPickerTask(null)}>
              <Text style={styles.sheetCancelText}>{t('tasks.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    minWidth: 100,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  boardHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  boardContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[24],
    gap: spacing[4],
  },
  column: {
    width: 280,
    height: 480,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  columnTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  columnBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  columnBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  columnContent: {
    flex: 1,
  },
  columnContentContainer: {
    padding: spacing[3],
    gap: spacing[3],
  },
  emptyColumn: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyColumnText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  taskCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  taskCardMine: {
    borderColor: colors.primary[500],
    borderWidth: 1.5,
  },
  taskCardPressed: {
    opacity: 0.85,
    transform: [{scale: 0.98}],
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing[1],
  },
  taskTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  taskDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    lineHeight: 18,
  },
  mineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginBottom: spacing[2],
  },
  mineBadgeText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
    fontSize: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexShrink: 1,
  },
  taskAssignedText: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  dueDateBadge: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dueDateBadgeUrgent: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  dueDateText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  dueDateTextUrgent: {
    color: colors.error,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    ...shadows.xl,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
  // Action sheet / picker
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[1],
  },
  sheetTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  sheetSectionLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
  },
  sheetItemDisabled: {
    opacity: 0.5,
  },
  sheetItemText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  sheetItemTextDisabled: {
    color: colors.text.tertiary,
  },
  sheetCheck: {
    color: colors.primary[500],
    fontWeight: '700',
    fontSize: 16,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing[2],
  },
  sheetCancel: {
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  sheetCancelText: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '600',
  },
  pickerScroll: {
    maxHeight: 280,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  memberRowName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
});
