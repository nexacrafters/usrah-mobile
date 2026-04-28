/**
 * Add Calendar Event Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  Repeat,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  FileText,
  Palette,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useCreateEvent } from '../../../hooks/queries/useCalendar';

const eventColors = [
  { id: 'primary', color: Colors.primary[500], label: 'Blue' },
  { id: 'gold', color: Colors.gold[500], label: 'Gold' },
  { id: 'sisters', color: Colors.sisters[500], label: 'Pink' },
  { id: 'success', color: Colors.success, label: 'Green' },
  { id: 'warning', color: Colors.warning, label: 'Orange' },
  { id: 'error', color: Colors.error, label: 'Red' },
];

const reminderOptions = [
  { id: 0, label: 'At time', labelAr: 'في الوقت', icon: '🔔' },
  { id: 15, label: '15 min', labelAr: '15 دقيقة', icon: '⏰' },
  { id: 30, label: '30 min', labelAr: '30 دقيقة', icon: '⏰' },
  { id: 60, label: '1 hour', labelAr: 'ساعة', icon: '🕐' },
  { id: 1440, label: '1 day', labelAr: 'يوم', icon: '📅' },
];

const recurrencePatterns = [
  { id: 'DAILY', label: 'Daily', labelAr: 'يومي', icon: '📆' },
  { id: 'WEEKLY', label: 'Weekly', labelAr: 'أسبوعي', icon: '📅' },
  { id: 'MONTHLY', label: 'Monthly', labelAr: 'شهري', icon: '🗓️' },
] as const;

export default function AddEventScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const { family } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000));
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(Colors.primary[500]);
  const [reminder, setReminder] = useState(15);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string>('DAILY');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const createEvent = useCreateEvent();

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'يرجى إدخال عنوان الحدث' : 'Please enter an event title'
      );
      return;
    }

    if (!family?.id) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'لا توجد عائلة محددة' : 'No family selected'
      );
      return;
    }

    if (endDate < startDate) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'وقت الانتهاء يجب أن يكون بعد وقت البداية' : 'End time must be after start time'
      );
      return;
    }

    try {
      await createEvent.mutateAsync({
        family_id: family.id,
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        all_day: allDay,
        location: location.trim() || undefined,
        color,
        reminder_minutes: reminder,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : undefined,
      });

      Alert.alert(
        rtl ? 'نجاح' : 'Success',
        rtl ? 'تم إنشاء الحدث بنجاح' : 'Event created successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        error.message || (rtl ? 'فشل في إنشاء الحدث' : 'Failed to create event')
      );
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newStart = new Date(startDate);
      newStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setStartDate(newStart);
      if (endDate < newStart) {
        setEndDate(new Date(newStart.getTime() + 3600000));
      }
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      const newStart = new Date(startDate);
      newStart.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setStartDate(newStart);
      if (endDate <= newStart) {
        setEndDate(new Date(newStart.getTime() + 3600000));
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const newEnd = new Date(endDate);
      newEnd.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setEndDate(newEnd);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      const newEnd = new Date(endDate);
      newEnd.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setEndDate(newEnd);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(rtl ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(rtl ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'إضافة حدث' : 'Add Event'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={createEvent.isPending}>
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            style={styles.saveButton}
          >
            {createEvent.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Check size={20} color={Colors.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
              <CalendarDays size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'عنوان الحدث' : 'Event Title'} *
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={title}
            onChangeText={setTitle}
            placeholder={rtl ? 'ما هو الحدث؟' : 'What is the event?'}
            placeholderTextColor={theme.placeholder}
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.gold[100] }]}>
              <FileText size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'الوصف' : 'Description'}
            </Text>
          </View>
          <TextInput
            style={[styles.textArea, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={description}
            onChangeText={setDescription}
            placeholder={rtl ? 'أضف تفاصيل الحدث...' : 'Add event details...'}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* All Day Toggle */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <TouchableOpacity
            style={[styles.allDayToggle, { backgroundColor: allDay ? Colors.primary[100] : theme.card, borderColor: allDay ? Colors.primary[500] : theme.cardBorder }]}
            onPress={() => setAllDay(!allDay)}
          >
            <View style={[styles.checkbox, { borderColor: theme.inputBorder, backgroundColor: allDay ? Colors.primary[500] : 'transparent' }]}>
              {allDay && <Check size={14} color={Colors.white} />}
            </View>
            <Text style={[styles.allDayText, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'طوال اليوم' : 'All Day'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Date & Time Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.dateTimeSection}>
          {/* Start */}
          <View style={[styles.dateTimeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dateTimeLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl ? 'يبدأ' : 'Starts'}
            </Text>
            <View style={[styles.dateTimeRow, rtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={18} color={Colors.primary[500]} />
                <Text style={[styles.dateButtonText, { color: theme.text, fontFamily: getFont('medium') }]}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
              {!allDay && (
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: Colors.primary[500] }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Clock size={18} color={Colors.white} />
                  <Text style={[styles.timeButtonText, { fontFamily: getFont('bold') }]}>
                    {formatTime(startDate)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* End */}
          <View style={[styles.dateTimeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dateTimeLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
              {rtl ? 'ينتهي' : 'Ends'}
            </Text>
            <View style={[styles.dateTimeRow, rtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={18} color={Colors.slate[500]} />
                <Text style={[styles.dateButtonText, { color: theme.text, fontFamily: getFont('medium') }]}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
              {!allDay && (
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: Colors.slate[500] }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Clock size={18} color={Colors.white} />
                  <Text style={[styles.timeButtonText, { fontFamily: getFont('bold') }]}>
                    {formatTime(endDate)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Date/Time Pickers */}
        {showStartDatePicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} />}
        {showStartTimePicker && <DateTimePicker value={startDate} mode="time" display="default" onChange={handleStartTimeChange} />}
        {showEndDatePicker && <DateTimePicker value={endDate} mode="date" display="default" minimumDate={startDate} onChange={handleEndDateChange} />}
        {showEndTimePicker && <DateTimePicker value={endDate} mode="time" display="default" onChange={handleEndTimeChange} />}

        {/* Location */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.sisters[100] }]}>
              <MapPin size={18} color={Colors.sisters[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'الموقع' : 'Location'}
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={location}
            onChangeText={setLocation}
            placeholder={rtl ? 'أضف موقع الحدث' : 'Add event location'}
            placeholderTextColor={theme.placeholder}
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Color Selection */}
        <Animated.View entering={FadeInUp.duration(500).delay(350)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: color + '20' }]}>
              <Palette size={18} color={color} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'اللون' : 'Color'}
            </Text>
          </View>
          <View style={[styles.colorRow, rtl && styles.rowReverse]}>
            {eventColors.map((c, index) => (
              <Animated.View key={c.id} entering={ZoomIn.duration(200).delay(350 + index * 40)}>
                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    { backgroundColor: c.color },
                    color === c.color && styles.colorSelected,
                  ]}
                  onPress={() => setColor(c.color)}
                >
                  {color === c.color && <Check size={20} color={Colors.white} />}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Reminder Selection */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.gold[100] }]}>
              <Bell size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'التذكير' : 'Reminder'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.reminderRow, rtl && styles.rowReverse]}>
              {reminderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.reminderButton,
                    {
                      backgroundColor: reminder === opt.id ? Colors.gold[500] : theme.card,
                      borderColor: reminder === opt.id ? Colors.gold[500] : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setReminder(opt.id)}
                >
                  <Text style={styles.reminderEmoji}>{opt.icon}</Text>
                  <Text style={[styles.reminderText, { color: reminder === opt.id ? Colors.white : theme.text, fontFamily: getFont('medium') }]}>
                    {rtl ? opt.labelAr : opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Recurring Toggle */}
        <Animated.View entering={FadeInUp.duration(500).delay(450)} style={styles.inputGroup}>
          <TouchableOpacity
            style={[styles.recurringToggle, { backgroundColor: isRecurring ? Colors.primary[100] : theme.card, borderColor: isRecurring ? Colors.primary[500] : theme.cardBorder }]}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.checkbox, { borderColor: theme.inputBorder, backgroundColor: isRecurring ? Colors.primary[500] : 'transparent' }]}>
              {isRecurring && <Repeat size={14} color={Colors.white} />}
            </View>
            <View style={styles.recurringTextWrapper}>
              <Text style={[styles.recurringTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                {rtl ? 'حدث متكرر' : 'Recurring Event'}
              </Text>
              <Text style={[styles.recurringSubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'سيتكرر هذا الحدث تلقائياً' : 'This event will repeat automatically'}
              </Text>
            </View>
            <Sparkles size={20} color={isRecurring ? Colors.primary[500] : theme.textSecondary} />
          </TouchableOpacity>

          {isRecurring && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.recurrenceRow, rtl && styles.rowReverse]}>
              {recurrencePatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.recurrenceButton,
                    {
                      backgroundColor: recurrenceRule === pattern.id ? Colors.primary[500] : theme.card,
                      borderColor: recurrenceRule === pattern.id ? Colors.primary[500] : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setRecurrenceRule(pattern.id)}
                >
                  <Text style={styles.recurrenceEmoji}>{pattern.icon}</Text>
                  <Text style={[styles.recurrenceText, { color: recurrenceRule === pattern.id ? Colors.white : theme.text, fontFamily: getFont('medium') }]}>
                    {rtl ? pattern.labelAr : pattern.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* Create Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(500)}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createEvent.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.createButton, createEvent.isPending && { opacity: 0.7 }]}
            >
              {createEvent.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <CalendarDays size={22} color={Colors.white} />
                  <Text style={[styles.createButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'إنشاء الحدث' : 'Create Event'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
  },

  // All Day
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
    marginBottom: 24,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allDayText: {
    fontSize: 16,
  },

  // Date Time
  dateTimeSection: {
    gap: 14,
    marginBottom: 24,
  },
  dateTimeCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  dateTimeLabel: {
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 10,
  },
  dateButtonText: {
    fontSize: 15,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
    gap: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: Colors.white,
  },

  // Color
  colorRow: {
    flexDirection: 'row',
    gap: 14,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  // Reminder
  reminderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  reminderEmoji: {
    fontSize: 16,
  },
  reminderText: {
    fontSize: 14,
  },

  // Recurring
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  recurringTextWrapper: {
    flex: 1,
  },
  recurringTitle: {
    fontSize: 16,
    marginBottom: 3,
  },
  recurringSubtitle: {
    fontSize: 13,
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  recurrenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  recurrenceEmoji: {
    fontSize: 18,
  },
  recurrenceText: {
    fontSize: 14,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
});
