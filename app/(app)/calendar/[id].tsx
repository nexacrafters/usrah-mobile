/**
 * Calendar Event Detail Screen - Premium Design
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  MapPin,
  Bell,
  Repeat,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useEvent, useDeleteEvent } from '../../../hooks/queries/useCalendar';
import { useAuthStore } from '../../../store';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);

  const { data: event, isLoading, refetch } = useEvent(id || '');
  const deleteEvent = useDeleteEvent();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      rtl ? 'حذف الحدث' : 'Delete Event',
      rtl ? 'هل أنت متأكد من حذف هذا الحدث؟' : 'Are you sure you want to delete this event?',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent.mutateAsync(id || '');
              router.back();
            } catch (error: any) {
              Alert.alert(
                rtl ? 'خطأ' : 'Error',
                error.message || (rtl ? 'فشل في حذف الحدث' : 'Failed to delete event')
              );
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateStr: string, includeTime: boolean = true) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return date.toLocaleDateString(rtl ? 'ar-SA' : 'en-US', options);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(rtl ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReminderText = (minutes?: number) => {
    if (!minutes || minutes === 0) return rtl ? 'في الوقت' : 'At time';
    if (minutes === 5) return rtl ? '5 دقائق قبل' : '5 minutes before';
    if (minutes === 15) return rtl ? '15 دقيقة قبل' : '15 minutes before';
    if (minutes === 30) return rtl ? '30 دقيقة قبل' : '30 minutes before';
    if (minutes === 60) return rtl ? 'ساعة قبل' : '1 hour before';
    if (minutes === 1440) return rtl ? 'يوم قبل' : '1 day before';
    return rtl ? `${minutes} دقيقة قبل` : `${minutes} minutes before`;
  };

  const getRecurrenceText = (rule?: string) => {
    if (!rule) return null;
    if (rule === 'DAILY') return rtl ? 'يومي' : 'Daily';
    if (rule === 'WEEKLY') return rtl ? 'أسبوعي' : 'Weekly';
    if (rule === 'MONTHLY') return rtl ? 'شهري' : 'Monthly';
    return rule;
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

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, rtl && styles.rowReverse]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {rtl ? 'الحدث' : 'Event'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: Colors.primary[100] }]}>
            <Calendar size={48} color={Colors.primary[500]} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {rtl ? 'لم يتم العثور على الحدث' : 'Event not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const eventColor = event.color || Colors.primary[500];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'تفاصيل الحدث' : 'Event Details'}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteHeaderBtn}
          disabled={deleteEvent.isPending}
        >
          {deleteEvent.isPending ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Trash2 size={22} color={Colors.error} />
          )}
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
        {/* Event Color Banner */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <LinearGradient
            colors={[eventColor, adjustColor(eventColor, -30)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.colorBanner}
          >
            <View style={styles.bannerContent}>
              <Animated.View entering={ZoomIn.duration(400).delay(200)} style={styles.bannerIcon}>
                <CalendarDays size={32} color={Colors.white} />
              </Animated.View>
              {event.is_recurring && (
                <View style={styles.recurringBadge}>
                  <Repeat size={14} color={Colors.white} />
                  <Text style={[styles.recurringBadgeText, { fontFamily: getFont('medium') }]}>
                    {getRecurrenceText(event.recurrence_rule)}
                  </Text>
                </View>
              )}
            </View>
            <Sparkles size={24} color="rgba(255,255,255,0.4)" style={styles.sparkle} />
          </LinearGradient>
        </Animated.View>

        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.titleSection}>
          <Text style={[styles.eventTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {event.title}
          </Text>
        </Animated.View>

        {/* Date & Time Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.sectionRow, rtl && styles.rowReverse]}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary[100] }]}>
                <Calendar size={22} color={Colors.primary[600]} />
              </View>
              <View style={[styles.sectionContent, rtl && styles.alignEnd]}>
                {event.all_day ? (
                  <>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                      {rtl ? 'طوال اليوم' : 'All Day Event'}
                    </Text>
                    <Text style={[styles.sectionValue, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                      {formatDateTime(event.start_date, false)}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.timeRow}>
                      <View style={[styles.timeBadge, { backgroundColor: Colors.primary[500] }]}>
                        <Clock size={14} color={Colors.white} />
                        <Text style={[styles.timeBadgeText, { fontFamily: getFont('bold') }]}>
                          {formatTime(event.start_date)}
                        </Text>
                      </View>
                      <Text style={[styles.timeArrow, { color: theme.textSecondary }]}>→</Text>
                      <View style={[styles.timeBadge, { backgroundColor: Colors.slate[500] }]}>
                        <Clock size={14} color={Colors.white} />
                        <Text style={[styles.timeBadgeText, { fontFamily: getFont('bold') }]}>
                          {formatTime(event.end_date || event.start_date)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.dateText, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                      {formatDateTime(event.start_date, false)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Location */}
        {event.location && (
          <Animated.View entering={FadeInUp.duration(500).delay(350)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.sectionRow, rtl && styles.rowReverse]}>
                <View style={[styles.iconBox, { backgroundColor: Colors.sisters[100] }]}>
                  <MapPin size={22} color={Colors.sisters[600]} />
                </View>
                <View style={[styles.sectionContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'الموقع' : 'Location'}
                  </Text>
                  <Text style={[styles.sectionValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {event.location}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Reminder */}
        {event.reminder_minutes !== undefined && (
          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.sectionRow, rtl && styles.rowReverse]}>
                <View style={[styles.iconBox, { backgroundColor: Colors.gold[100] }]}>
                  <Bell size={22} color={Colors.gold[600]} />
                </View>
                <View style={[styles.sectionContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'التذكير' : 'Reminder'}
                  </Text>
                  <Text style={[styles.sectionValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {getReminderText(event.reminder_minutes)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Description */}
        {event.description && (
          <Animated.View entering={FadeInUp.duration(500).delay(450)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.descriptionLabel, { color: theme.textSecondary, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {rtl ? 'الوصف' : 'Description'}
              </Text>
              <Text style={[styles.description, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign(), writingDirection: getWritingDirection() }]}>
                {event.description}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Created By */}
        {event.created_by && (
          <Animated.View entering={FadeInUp.duration(500).delay(500)}>
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.sectionRow, rtl && styles.rowReverse]}>
                <View style={[styles.iconBox, { backgroundColor: theme.surfaceVariant || Colors.slate[100] }]}>
                  <Users size={22} color={theme.icon} />
                </View>
                <View style={[styles.sectionContent, rtl && styles.alignEnd]}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'تم الإنشاء بواسطة' : 'Created by'}
                  </Text>
                  <Text style={[styles.sectionValue, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                    {event.created_by.full_name || (rtl ? 'مستخدم' : 'User')}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Delete Button */}
      <Animated.View entering={FadeInUp.duration(500).delay(550)} style={[styles.bottomActions, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: Colors.error }]}
          onPress={handleDelete}
          disabled={deleteEvent.isPending}
        >
          {deleteEvent.isPending ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <Trash2 size={20} color={Colors.error} />
              <Text style={[styles.deleteBtnText, { color: Colors.error, fontFamily: getFont('bold') }]}>
                {rtl ? 'حذف الحدث' : 'Delete Event'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// Helper function to darken color
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
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
  deleteHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Color Banner
  colorBanner: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recurringBadgeText: {
    fontSize: 14,
    color: Colors.white,
  },
  sparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Title
  titleSection: {
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 26,
    lineHeight: 36,
  },

  // Section
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 17,
  },

  // Time
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 15,
    color: Colors.white,
  },
  timeArrow: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 15,
  },

  // Description
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
  },

  // Bottom Actions
  bottomActions: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  deleteBtnText: {
    fontSize: 17,
  },
});
