/**
 * Add Event Screen (modal)
 * Creates a real event in the active family via /calendar/events/create/.
 */

import React, {useState} from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DateField from '../../components/ui/DateField';
import calendarService, {EventType} from '../../services/api/calendar.service';
import {getCurrentFamilyId} from '../../store/authStore';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius} from '../../theme';

/** Default categories map to backend event_type + a display color. */
const CATEGORIES: Array<{
  type: EventType;
  labelKey: string;
  color: string;
  icon: string;
}> = [
  {type: 'general', labelKey: 'calendar.typeGeneral', color: colors.primary[500], icon: 'calendar'},
  {type: 'birthday', labelKey: 'calendar.typeBirthday', color: colors.islamic.love, icon: 'cake-variant'},
  {type: 'anniversary', labelKey: 'calendar.typeAnniversary', color: colors.islamic.barakallah, icon: 'heart'},
  {type: 'islamic', labelKey: 'calendar.typeIslamic', color: colors.gold[600], icon: 'star-crescent'},
  {type: 'school', labelKey: 'calendar.typeSchool', color: colors.skyBlue[500], icon: 'school'},
  {type: 'medical', labelKey: 'calendar.typeMedical', color: colors.error, icon: 'medical-bag'},
  {type: 'travel', labelKey: 'calendar.typeTravel', color: colors.islamic.haha, icon: 'airplane'},
  {type: 'work', labelKey: 'calendar.typeWork', color: colors.slate[600], icon: 'briefcase'},
  {type: 'prayer', labelKey: 'calendar.typePrayer', color: colors.primary[700], icon: 'hands-pray'},
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const todayYmd = (): string => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Validate that a YYYY-MM-DD string is a real calendar date. */
const isRealDate = (s: string): boolean => {
  if (!DATE_RE.test(s)) {
    return false;
  }
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
};

export default function AddEventScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayYmd());
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventType>('general');
  const [loading, setLoading] = useState(false);

  const selectedColor =
    CATEGORIES.find((c) => c.type === category)?.color ?? colors.primary[500];

  const handleSave = async () => {
    if (!title.trim()) {
      void showAlert({title: t('calendar.titleRequiredTitle'), message: t('calendar.titleRequiredBody')});
      return;
    }
    if (!date.trim()) {
      void showAlert({title: t('calendar.dateRequiredTitle'), message: t('calendar.dateRequiredBody')});
      return;
    }
    if (!isRealDate(date.trim())) {
      void showAlert({title: t('calendar.invalidDateTitle'), message: t('calendar.invalidDateBody')});
      return;
    }
    const trimmedTime = time.trim();
    if (trimmedTime && !TIME_RE.test(trimmedTime)) {
      void showAlert({title: t('calendar.invalidTimeTitle'), message: t('calendar.invalidTimeBody')});
      return;
    }
    if (!getCurrentFamilyId()) {
      void showAlert({title: t('calendar.noFamilyAlertTitle'), message: t('calendar.noFamilyAlertBody')});
      return;
    }

    setLoading(true);
    try {
      await calendarService.createEvent({
        title: title.trim(),
        start_date: date.trim(),
        start_time: trimmedTime ? `${trimmedTime}:00` : null,
        all_day: !trimmedTime,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        event_type: category,
        color: selectedColor,
      });
      navigation.goBack();
    } catch (e) {
      void showAlert({
        title: t('calendar.couldNotCreateTitle'),
        message: e instanceof Error ? e.message : t('calendar.couldNotCreateBody'),
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
              <Icon name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('calendar.addEvent')}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.titleLabel')} *</Text>
              <Input
                placeholder={t('calendar.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.dateLabel')} *</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <DateField mode="date" value={date} onChange={setDate} />
                </View>
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => setDate(todayYmd())}>
                  <Text style={styles.todayButtonText}>{t('calendar.today_btn')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time (optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.timeLabel')}</Text>
              <DateField
                mode="time"
                value={time}
                onChange={setTime}
                placeholder={t('calendar.timePlaceholder')}
                clearable
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.categoryLabel')}</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = category === cat.type;
                  return (
                    <TouchableOpacity
                      key={cat.type}
                      style={[
                        styles.categoryChip,
                        selected && {
                          backgroundColor: cat.color + '20',
                          borderColor: cat.color,
                        },
                      ]}
                      onPress={() => setCategory(cat.type)}>
                      <Icon
                        name={cat.icon}
                        size={16}
                        color={selected ? cat.color : colors.text.tertiary}
                      />
                      <Text
                        style={[
                          styles.categoryLabel,
                          selected && {color: cat.color, fontWeight: '600'},
                        ]}>
                        {t(cat.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description (optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.descriptionLabel')}</Text>
              <Input
                placeholder={t('calendar.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </View>

            {/* Location (optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('calendar.locationLabel')}</Text>
              <Input
                placeholder={t('calendar.locationPlaceholder')}
                value={location}
                onChangeText={setLocation}
                style={styles.input}
              />
            </View>

            {/* Create */}
            <Button
              title={t('calendar.createEvent')}
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              style={styles.createButton}
            />
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dateInput: {
    flex: 1,
  },
  todayButton: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  todayButtonText: {
    ...typography.label,
    color: colors.primary[700],
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  createButton: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
});
