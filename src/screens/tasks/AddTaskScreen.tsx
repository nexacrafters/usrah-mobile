/**
 * Add Task Screen
 * Creates a real task in the active family via /tasks/create/.
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import DateField from '../../components/ui/DateField';
import {useTaskStore, TaskPriority} from '../../store/taskStore';
import {useFamilyStore, FamilyMember} from '../../store/familyStore';
import {getCurrentFamilyId} from '../../store/authStore';
import {showAlert} from '../../store/dialogStore';
import taskService from '../../services/api/task.service';
import familyService from '../../services/api/family.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

const PRIORITIES: Array<{id: TaskPriority; labelKey: string; color: string; icon: string}> = [
  {id: 'low', labelKey: 'tasks.low', color: colors.slate[400], icon: '⬇️'},
  {id: 'normal', labelKey: 'tasks.normal', color: colors.islamic.mashallah, icon: '➡️'},
  {id: 'high', labelKey: 'tasks.high', color: colors.gold[500], icon: '⬆️'},
  {id: 'urgent', labelKey: 'tasks.urgent', color: colors.error, icon: '🔴'},
];

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const addTask = useTaskStore((s) => s.addTask);
  const {members, setMembers} = useFamilyStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const familyId = getCurrentFamilyId();
    if (!familyId || members.length > 0) {
      return;
    }
    familyService
      .getMembers(familyId)
      .then(setMembers)
      .catch(() => {
        /* assignee picker is optional */
      });
  }, [members.length, setMembers]);

  const handleSave = async () => {
    if (!title.trim()) {
      void showAlert({title: t('tasks.titleRequiredTitle'), message: t('tasks.titleRequiredBody')});
      return;
    }
    if (!getCurrentFamilyId()) {
      void showAlert({title: t('tasks.noFamilyAlertTitle'), message: t('tasks.noFamilyAlertBody')});
      return;
    }

    setLoading(true);
    try {
      const task = await taskService.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority: selectedPriority,
        assigned_to_id: selectedAssignee,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        is_private: isPrivate,
      });
      addTask(task);
      navigation.goBack();
    } catch (e) {
      void showAlert({
        title: t('tasks.couldNotCreateTitle'),
        message: e instanceof Error ? e.message : t('tasks.couldNotCreateBody'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary[50], colors.background.default]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('tasks.newTask')}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Task Title */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('tasks.titleLabel')} *</Text>
              <Input
                placeholder={t('tasks.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('tasks.taskDescription')}</Text>
              <Input
                placeholder={t('tasks.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.input}
              />
            </View>

            {/* Assign To */}
            {members.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('tasks.assignTo')}</Text>
                <View style={styles.membersGrid}>
                  {members.map((member: FamilyMember) => {
                    const selected = selectedAssignee === member.user.public_id;
                    return (
                      <TouchableOpacity
                        key={member.public_id}
                        style={[
                          styles.memberChip,
                          selected && styles.memberChipSelected,
                        ]}
                        onPress={() =>
                          setSelectedAssignee(
                            selected ? null : member.user.public_id,
                          )
                        }>
                        <Avatar name={member.user.full_name} size="medium" />
                        <Text
                          style={[
                            styles.memberName,
                            selected && styles.memberNameSelected,
                          ]}
                          numberOfLines={1}>
                          {member.user.full_name}
                        </Text>
                        {selected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkIcon}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('tasks.priority')}</Text>
              <View style={styles.priorityGrid}>
                {PRIORITIES.map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityChip,
                      selectedPriority === priority.id && {
                        backgroundColor: priority.color + '20',
                        borderColor: priority.color,
                      },
                    ]}
                    onPress={() => setSelectedPriority(priority.id)}>
                    <Text style={styles.priorityIcon}>{priority.icon}</Text>
                    <Text
                      style={[
                        styles.priorityLabel,
                        selectedPriority === priority.id && {
                          color: priority.color,
                          fontWeight: '600',
                        },
                      ]}>
                      {t(priority.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due date & time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('tasks.dueDate')} & {t('tasks.pickTime')}</Text>
              <View style={styles.dueRow}>
                <View style={styles.dueCol}>
                  <DateField
                    mode="date"
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder={t('tasks.pickDate')}
                    minimumDate={new Date(2000, 0, 1)}
                    clearable
                  />
                </View>
                <View style={styles.dueCol}>
                  <DateField
                    mode="time"
                    value={dueTime}
                    onChange={setDueTime}
                    placeholder={t('tasks.pickTime')}
                    clearable
                  />
                </View>
              </View>
            </View>

            {/* Private toggle */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.privateRow}
                activeOpacity={0.8}
                onPress={() => setIsPrivate((v) => !v)}>
                <View style={styles.privateTextWrap}>
                  <Text style={styles.privateTitle}>
                    🔒 {t('tasks.privateTask')}
                  </Text>
                  <Text style={styles.privateHint}>
                    {t('tasks.privateTaskHint')}
                  </Text>
                </View>
                <View
                  style={[styles.toggle, isPrivate && styles.toggleOn]}>
                  <View
                    style={[styles.knob, isPrivate && styles.knobOn]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Create Button */}
            <Button
              title={t('tasks.createTask')}
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              style={styles.createButton}
            />

            {/* Islamic Quote */}
            <Card variant="outlined" style={styles.quoteCard}>
              <Text style={styles.quoteArabic}>{t('tasks.quoteArabic')}</Text>
              <Text style={styles.quoteTranslation}>
                {t('tasks.quoteTranslation')}
              </Text>
              <Text style={styles.quoteReference}>{t('tasks.quoteReference')}</Text>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.text.primary,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  input: {
    marginBottom: 0,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  memberChip: {
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    minWidth: 100,
    position: 'relative',
  },
  memberChipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  memberName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[2],
    maxWidth: 80,
  },
  memberNameSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  priorityChip: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    gap: spacing[2],
  },
  priorityIcon: {
    fontSize: 16,
  },
  priorityLabel: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  createButton: {
    marginBottom: spacing[6],
  },
  dueRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dueCol: {
    flex: 1,
  },
  privateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  privateTextWrap: {
    flex: 1,
    marginRight: spacing[3],
  },
  privateTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  privateHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.default,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.primary[500],
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  quoteCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  quoteArabic: {
    fontSize: 16,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  quoteTranslation: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  quoteReference: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
