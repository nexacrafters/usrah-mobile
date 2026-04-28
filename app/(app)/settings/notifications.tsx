/**
 * Notification Settings Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import {
  Bell,
  MessageCircle,
  Calendar,
  CheckSquare,
  Moon,
  Users,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BellRing,
  Info,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

const notificationSettings = [
  {
    id: 'messages',
    title: 'Messages',
    titleAr: 'الرسائل',
    description: 'New messages and chat notifications',
    descriptionAr: 'الرسائل الجديدة وإشعارات المحادثات',
    icon: MessageCircle,
    color: Colors.primary[500],
    bgColor: Colors.primary[100],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    titleAr: 'المهام',
    description: 'Task assignments and reminders',
    descriptionAr: 'تعيينات المهام والتذكيرات',
    icon: CheckSquare,
    color: Colors.gold[600],
    bgColor: Colors.gold[100],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    titleAr: 'التقويم',
    description: 'Event reminders and updates',
    descriptionAr: 'تذكيرات الأحداث والتحديثات',
    icon: Calendar,
    color: Colors.sisters[500],
    bgColor: Colors.sisters[100],
  },
  {
    id: 'prayer',
    title: 'Prayer Times',
    titleAr: 'أوقات الصلاة',
    description: 'Prayer time notifications',
    descriptionAr: 'إشعارات أوقات الصلاة',
    icon: Moon,
    color: Colors.primary[700],
    bgColor: Colors.primary[100],
  },
  {
    id: 'family',
    title: 'Family Updates',
    titleAr: 'تحديثات العائلة',
    description: 'New posts and family activity',
    descriptionAr: 'المنشورات الجديدة ونشاط العائلة',
    icon: Users,
    color: Colors.accent[500],
    bgColor: Colors.accent[100],
  },
  {
    id: 'village',
    title: 'Village Announcements',
    titleAr: 'إعلانات القرية',
    description: 'Community announcements and events',
    descriptionAr: 'إعلانات وأحداث المجتمع',
    icon: Megaphone,
    color: Colors.warning,
    bgColor: Colors.gold[100],
  },
];

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [settings, setSettings] = useState<Record<string, boolean>>({
    messages: true,
    tasks: true,
    calendar: true,
    prayer: true,
    family: true,
    village: false,
  });

  const [masterSwitch, setMasterSwitch] = useState(true);

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMaster = (value: boolean) => {
    setMasterSwitch(value);
    const newSettings: Record<string, boolean> = {};
    Object.keys(settings).forEach((key) => {
      newSettings[key] = value;
    });
    setSettings(newSettings);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.sisters[600], Colors.sisters[800]] : [Colors.sisters[400], Colors.sisters[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerContent, rtl && styles.headerContentRTL]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {rtl ? 'الإشعارات' : 'Notifications'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'إدارة تنبيهاتك' : 'Manage your alerts'}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <Animated.View entering={ZoomIn.duration(500).delay(200)}>
          <LinearGradient
            colors={masterSwitch
              ? (isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]])
              : [Colors.slate[400], Colors.slate[500]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.masterCard}
          >
            <View style={[styles.masterContent, rtl && styles.rowReverse]}>
              <View style={styles.masterIconBox}>
                <BellRing size={28} color={masterSwitch ? Colors.gold[400] : Colors.white} />
              </View>
              <View style={[styles.masterInfo, rtl && styles.masterInfoRTL]}>
                <Text style={[styles.masterTitle, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'جميع الإشعارات' : 'All Notifications'}
                </Text>
                <Text style={[styles.masterDesc, { fontFamily: getFont('regular') }]}>
                  {masterSwitch
                    ? (rtl ? 'الإشعارات مفعّلة' : 'Notifications are enabled')
                    : (rtl ? 'الإشعارات متوقفة' : 'Notifications are disabled')}
                </Text>
              </View>
              <Switch
                value={masterSwitch}
                onValueChange={toggleMaster}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: Colors.gold[500] }}
                thumbColor={Colors.white}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Individual Settings */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary[100] }]}>
              <Bell size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'أنواع الإشعارات' : 'Notification Types'}
            </Text>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {notificationSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <Animated.View
                  key={setting.id}
                  entering={FadeInUp.duration(300).delay(350 + index * 50)}
                >
                  <View
                    style={[
                      styles.settingItem,
                      rtl && styles.rowReverse,
                      index !== notificationSettings.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                    ]}
                  >
                    <View style={[styles.settingIcon, { backgroundColor: setting.bgColor }]}>
                      <Icon size={22} color={setting.color} />
                    </View>
                    <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                      <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                        {rtl ? setting.titleAr : setting.title}
                      </Text>
                      <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                        {rtl ? setting.descriptionAr : setting.description}
                      </Text>
                    </View>
                    <Switch
                      value={settings[setting.id]}
                      onValueChange={() => toggleSetting(setting.id)}
                      trackColor={{ false: theme.inputBorder, true: Colors.primary[500] }}
                      thumbColor={Colors.white}
                      disabled={!masterSwitch}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)}>
          <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.primary[900] + '50' : Colors.primary[50] }]}>
            <View style={[styles.infoContent, rtl && styles.rowReverse]}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.primary[100] }]}>
                <Info size={18} color={Colors.primary[600]} />
              </View>
              <Text style={[styles.infoText, { color: Colors.primary[700], fontFamily: getFont('regular'), textAlign: getTextAlign(), flex: 1 }]}>
                {rtl
                  ? 'يمكنك تخصيص إشعارات الصلاة من إعدادات الصلاة.'
                  : 'You can customize prayer notifications from Prayer Settings.'}
              </Text>
            </View>
          </View>
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

  // Header
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    bottom: -10,
    left: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerContentRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },

  // Master Card
  masterCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  masterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  masterInfoRTL: {
    alignItems: 'flex-end',
  },
  masterTitle: {
    fontSize: 18,
    color: Colors.white,
    marginBottom: 4,
  },
  masterDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
  },

  // Settings Card
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingInfoRTL: {
    alignItems: 'flex-end',
  },
  settingTitle: {
    fontSize: 15,
    marginBottom: 3,
  },
  settingDesc: {
    fontSize: 12,
  },

  // Info Card
  infoCard: {
    padding: 16,
    borderRadius: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
