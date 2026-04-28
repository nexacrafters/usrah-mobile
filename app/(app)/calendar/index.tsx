/**
 * Calendar Screen with Hijri/Gregorian Support - Enhanced UI
 * Full RTL Support for Arabic
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Moon,
  Users,
  Bell,
  Sparkles,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';
import { useMonthEvents, useDateEvents } from '../../../hooks/queries/useCalendar';
import type { CalendarEvent } from '../../../types/models';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 40) / 7;

const HIJRI_MONTHS = {
  ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah']
};

const GREGORIAN_MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

const WEEKDAYS = {
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

function getHijriDate(date: Date): { day: number; month: number; year: number } {
  const gregorianDate = date.getTime();
  const hijriEpoch = new Date(622, 6, 16).getTime();
  const daysSinceHijri = Math.floor((gregorianDate - hijriEpoch) / (1000 * 60 * 60 * 24));
  const hijriYear = Math.floor(daysSinceHijri / 354.36667);
  const daysInYear = daysSinceHijri - Math.floor(hijriYear * 354.36667);
  const hijriMonth = Math.floor(daysInYear / 29.5);
  const hijriDay = Math.floor(daysInYear - (hijriMonth * 29.5)) + 1;
  return { day: Math.max(1, Math.min(30, hijriDay)), month: Math.max(0, Math.min(11, hijriMonth)), year: 1446 + Math.floor((date.getFullYear() - 2024) * 1.03) };
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = I18nManager.isRTL;
  const lang = isRTL ? 'ar' : 'en';
  const { family } = useAuthStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHijri, setShowHijri] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events from API
  const {
    data: monthEvents = [],
    isLoading: monthEventsLoading,
    refetch: refetchMonthEvents,
  } = useMonthEvents(family?.id || '', currentDate.getFullYear(), currentDate.getMonth());

  const {
    data: selectedDateEvents = [],
    isLoading: dateEventsLoading,
    refetch: refetchDateEvents,
  } = useDateEvents(family?.id || '', selectedDate);

  const ChevronBack = isRTL ? ChevronRight : ChevronLeft;
  const ChevronForward = isRTL ? ChevronLeft : ChevronRight;

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const hasEvents = (day: number) => {
    return monthEvents.some((event: CalendarEvent) => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => { const today = new Date(); setCurrentDate(today); setSelectedDate(today); };
  const isSelected = (day: number) => day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
  const isToday = (day: number) => { const today = new Date(); return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear(); };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMonthEvents(), refetchDateEvents()]);
    setRefreshing(false);
  };

  const hijriDate = getHijriDate(selectedDate);
  const hijriMonthName = HIJRI_MONTHS[lang][hijriDate.month];

  // Format event time
  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.rowReverse]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronBack size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: 'center' }]}>
            {t('calendar.title')}
          </Text>
          <TouchableOpacity onPress={() => setShowHijri(!showHijri)} style={[styles.hijriToggle, { backgroundColor: showHijri ? Colors.gold[100] : theme.card }]}>
            <Moon size={20} color={showHijri ? Colors.gold[600] : theme.icon} />
          </TouchableOpacity>
        </View>

        {/* Month Navigation - Enhanced */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={isDark ? [Colors.primary[700], Colors.primary[800]] : [Colors.primary[500], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.monthNav}
          >
            <TouchableOpacity onPress={isRTL ? goToNextMonth : goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.monthInfo}>
              <Text style={[styles.monthName, { fontFamily: getFont('bold') }]}>
                {GREGORIAN_MONTHS[lang][currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              {showHijri && (
                <View style={styles.hijriContainer}>
                  <Moon size={14} color={Colors.gold[400]} />
                  <Text style={[styles.hijriMonth, { fontFamily: getFont('medium') }]}>
                    {hijriMonthName} {hijriDate.year}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={isRTL ? goToPreviousMonth : goToNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.quickActionsBar}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: Colors.primary[100] }]} onPress={goToToday}>
            <CalendarIcon size={16} color={Colors.primary[600]} />
            <Text style={[styles.quickActionText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>{t('calendar.today')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: showHijri ? Colors.gold[100] : theme.card, borderColor: theme.cardBorder, borderWidth: showHijri ? 0 : 1 }]} onPress={() => setShowHijri(!showHijri)}>
            <Moon size={16} color={showHijri ? Colors.gold[600] : theme.icon} />
            <Text style={[styles.quickActionText, { color: showHijri ? Colors.gold[600] : theme.textSecondary, fontFamily: getFont('medium') }]}>هجري</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Calendar Grid - Enhanced */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.calendarContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.weekdayRow, isRTL && styles.rowReverse]}>
              {WEEKDAYS[lang].map((day, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: index === 5 ? Colors.gold[600] : theme.textSecondary, fontFamily: getFont('bold') }]}>{day}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.daysGrid, isRTL && styles.rowReverse]}>
              {calendarData.map((day, index) => {
                const selected = day && isSelected(day);
                const today = day && isToday(day);
                const hasEvent = day && hasEvents(day);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayCell}
                    onPress={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    disabled={!day}
                  >
                    {day && (
                      <>
                        {selected ? (
                          <LinearGradient
                            colors={[Colors.primary[500], Colors.primary[600]]}
                            style={styles.selectedDayBg}
                          >
                            <Text style={[styles.dayText, { color: Colors.white, fontFamily: getFont('bold') }]}>{day}</Text>
                          </LinearGradient>
                        ) : (
                          <View style={[today && styles.todayDay]}>
                            <Text style={[styles.dayText, { color: today ? Colors.primary[600] : theme.text, fontFamily: today ? getFont('bold') : getFont('medium') }]}>{day}</Text>
                          </View>
                        )}
                        {hasEvent && !selected && (
                          <View style={styles.eventDotContainer}>
                            <View style={[styles.eventDot, { backgroundColor: Colors.sisters[500] }]} />
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Selected Date Info - Enhanced */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={[styles.dateInfo, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.dateInfoContent}>
              <View style={[styles.dateInfoIcon, { backgroundColor: Colors.primary[100] }]}>
                <CalendarIcon size={18} color={Colors.primary[600]} />
              </View>
              <View style={styles.dateInfoText}>
                <Text style={[styles.selectedDateText, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign(), writingDirection: getWritingDirection() }]}>
                  {selectedDate.toLocaleDateString(isRTL ? 'ar-TN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                {showHijri && (
                  <View style={styles.hijriDateRow}>
                    <Moon size={12} color={Colors.gold[600]} />
                    <Text style={[styles.hijriDateText, { color: Colors.gold[600], fontFamily: getFont('medium') }]}>
                      {hijriDate.day} {hijriMonthName} {hijriDate.year} {isRTL ? 'هـ' : 'AH'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Events Section - Enhanced */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.eventsSection}>
          <View style={[styles.eventsSectionHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.eventsTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>{t('calendar.upcomingEvents')}</Text>
            <TouchableOpacity onPress={() => router.push('/calendar/add')}>
              <LinearGradient
                colors={[Colors.gold[500], Colors.gold[600]]}
                style={styles.addEventButton}
              >
                <Plus size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {dateEventsLoading ? (
            <View style={[styles.noEvents, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event: CalendarEvent, index: number) => (
              <Animated.View key={event.id} entering={FadeInUp.delay(350 + index * 50).duration(300)}>
                <TouchableOpacity
                  style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => router.push(`/calendar/${event.id}`)}
                >
                  <View style={[styles.eventAccent, { backgroundColor: event.color || Colors.primary[500] }]} />
                  <View style={[styles.eventContent, isRTL && styles.alignEnd]}>
                    <Text style={[styles.eventTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                      {event.title}
                    </Text>
                    <View style={[styles.eventDetails, isRTL && styles.rowReverse]}>
                      <View style={[styles.eventDetail, isRTL && styles.rowReverse]}>
                        <View style={[styles.eventDetailIcon, { backgroundColor: Colors.primary[100] }]}>
                          <Clock size={12} color={Colors.primary[600]} />
                        </View>
                        <Text style={[styles.eventDetailText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                          {event.all_day ? (isRTL ? 'طوال اليوم' : 'All day') : formatEventTime(event.start_date)}
                        </Text>
                      </View>
                      {event.location && (
                        <View style={[styles.eventDetail, isRTL && styles.rowReverse]}>
                          <View style={[styles.eventDetailIcon, { backgroundColor: Colors.gold[100] }]}>
                            <MapPin size={12} color={Colors.gold[600]} />
                          </View>
                          <Text style={[styles.eventDetailText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={[styles.noEvents, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.noEventsIcon, { backgroundColor: Colors.primary[100] }]}>
                <CalendarIcon size={28} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.noEventsText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>{t('calendar.noEvents')}</Text>
              <TouchableOpacity
                style={[styles.addFirstEvent, { backgroundColor: Colors.primary[50] }]}
                onPress={() => router.push('/calendar/add')}
              >
                <Plus size={16} color={Colors.primary[600]} />
                <Text style={[styles.addFirstEventText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
                  {isRTL ? 'إضافة حدث' : 'Add Event'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, marginHorizontal: 12 },
  hijriToggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // Month Navigation
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 20 },
  navButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  monthInfo: { alignItems: 'center' },
  monthName: { fontSize: 18, color: Colors.white },
  hijriContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4 },
  hijriMonth: { fontSize: 14, color: Colors.gold[400] },

  // Quick Actions
  quickActionsBar: { flexDirection: 'row-reverse', marginHorizontal: 20, marginTop: 14, gap: 10 },
  quickAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  quickActionText: { fontSize: 13 },

  // Calendar Grid
  calendarContainer: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, padding: 14 },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayCell: { width: DAY_WIDTH, alignItems: 'center', paddingVertical: 10 },
  weekdayText: { fontSize: 12 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: DAY_WIDTH, height: DAY_WIDTH, alignItems: 'center', justifyContent: 'center' },
  selectedDayBg: { width: DAY_WIDTH - 8, height: DAY_WIDTH - 8, borderRadius: (DAY_WIDTH - 8) / 2, alignItems: 'center', justifyContent: 'center' },
  todayDay: { borderWidth: 2, borderColor: Colors.primary[500], borderRadius: (DAY_WIDTH - 8) / 2, width: DAY_WIDTH - 8, height: DAY_WIDTH - 8, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15 },
  eventDotContainer: { position: 'absolute', bottom: 4 },
  eventDot: { width: 5, height: 5, borderRadius: 3 },

  // Date Info
  dateInfo: { marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 20, borderWidth: 1 },
  dateInfoContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  dateInfoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dateInfoText: { flex: 1, alignItems: 'flex-end' },
  selectedDateText: { fontSize: 15, marginBottom: 4 },
  hijriDateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  hijriDateText: { fontSize: 13 },

  // Events Section
  eventsSection: { marginTop: 24, paddingHorizontal: 20 },
  eventsSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  eventsTitle: { fontSize: 18 },
  addEventButton: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  eventCard: { flexDirection: 'row-reverse', borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  eventAccent: { width: 5 },
  eventContent: { flex: 1, padding: 16 },
  eventTitle: { fontSize: 16, marginBottom: 10 },
  eventDetails: { flexDirection: 'row', gap: 14 },
  eventDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventDetailIcon: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  eventDetailText: { fontSize: 13 },
  noEvents: { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 20, borderWidth: 1 },
  noEventsIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  noEventsText: { fontSize: 14, marginBottom: 16 },
  addFirstEvent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addFirstEventText: { fontSize: 14 },
});
