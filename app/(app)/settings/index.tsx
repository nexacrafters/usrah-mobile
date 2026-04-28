/**
 * Settings Screen - Premium Design
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  LogOut,
  Info,
  Star,
  Share2,
  MessageCircle,
  Users,
  Settings,
  Sparkles,
  Palette,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useLanguageStore } from '../../../store/languageStore';
import { useAuthStore } from '../../../store/authStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

const { width } = Dimensions.get('window');

interface SettingsItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  theme: typeof LightTheme;
  isRTL: boolean;
  delay?: number;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
  theme,
  isRTL,
  delay = 0,
}) => {
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(delay)}>
      <TouchableOpacity
        style={[styles.settingsItem, { borderBottomColor: theme.divider }, isRTL && styles.settingsItemRTL]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.settingsItemLeft, isRTL && styles.settingsItemLeftRTL]}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={[styles.settingsItemText, isRTL && styles.settingsItemTextRTL]}>
            <Text style={[styles.settingsItemTitle, { color: theme.text, fontFamily: getFont('semibold') }, isRTL && styles.textRTL]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.settingsItemSubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }, isRTL && styles.textRTL]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightElement || (showChevron && onPress && (
          <ChevronIcon size={20} color={theme.textTertiary} />
        ))}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme, mode, setMode } = useThemeStore();
  const { language } = useLanguageStore();
  const { logout, user } = useAuthStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = checkRTL();

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm') || 'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light': return t('settings.lightMode');
      case 'dark': return t('settings.darkMode');
      default: return t('settings.systemDefault');
    }
  };

  const getLanguageLabel = () => {
    return language === 'ar' ? 'العربية' : 'English';
  };

  const cycleTheme = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('system');
    else setMode('light');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
            <View style={styles.headerIcon}>
              <Settings size={24} color={Colors.white} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {t('settings.title')}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {isRTL ? 'تخصيص تجربتك' : 'Customize your experience'}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: getFont('semibold') }, isRTL && styles.textRTL]}>
            {t('settings.account')}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <SettingsItem
              icon={<User size={20} color={Colors.primary[600]} />}
              iconBg={Colors.primary[100]}
              title={t('settings.editProfile')}
              subtitle={user?.email}
              onPress={() => router.push('/(app)/settings/profile')}
              theme={theme}
              isRTL={isRTL}
              delay={150}
            />
            <SettingsItem
              icon={<Users size={20} color={Colors.gold[600]} />}
              iconBg={Colors.gold[100]}
              title={t('settings.family') || 'Family'}
              onPress={() => router.push('/(app)/settings/family')}
              theme={theme}
              isRTL={isRTL}
              delay={200}
            />
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: getFont('semibold') }, isRTL && styles.textRTL]}>
            {t('settings.preferences') || 'Preferences'}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <SettingsItem
              icon={<Globe size={20} color={Colors.accent[600]} />}
              iconBg={Colors.accent[100]}
              title={t('settings.language')}
              subtitle={getLanguageLabel()}
              onPress={() => router.push('/(app)/settings/language')}
              theme={theme}
              isRTL={isRTL}
              delay={250}
            />
            <SettingsItem
              icon={isDark ? <Moon size={20} color={Colors.primary[400]} /> : <Sun size={20} color={Colors.gold[500]} />}
              iconBg={isDark ? Colors.primary[900] : Colors.gold[100]}
              title={t('settings.theme')}
              subtitle={getThemeLabel()}
              onPress={cycleTheme}
              theme={theme}
              isRTL={isRTL}
              delay={300}
              rightElement={
                <View style={[styles.themeBadge, { backgroundColor: isDark ? Colors.primary[100] : Colors.gold[100] }]}>
                  <Palette size={14} color={isDark ? Colors.primary[600] : Colors.gold[600]} />
                </View>
              }
            />
            <SettingsItem
              icon={<Bell size={20} color={Colors.sisters[600]} />}
              iconBg={Colors.sisters[100]}
              title={t('settings.notifications')}
              onPress={() => router.push('/(app)/settings/notifications')}
              theme={theme}
              isRTL={isRTL}
              delay={350}
            />
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: getFont('semibold') }, isRTL && styles.textRTL]}>
            {t('settings.security')}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <SettingsItem
              icon={<Shield size={20} color={Colors.success} />}
              iconBg={Colors.success + '20'}
              title={t('settings.privacy')}
              onPress={() => router.push('/(app)/settings/privacy')}
              theme={theme}
              isRTL={isRTL}
              delay={400}
            />
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(250)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: getFont('semibold') }, isRTL && styles.textRTL]}>
            {t('settings.about')}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <SettingsItem
              icon={<Star size={20} color={Colors.gold[500]} />}
              iconBg={Colors.gold[100]}
              title={t('settings.rateApp')}
              onPress={() => {}}
              theme={theme}
              isRTL={isRTL}
              delay={450}
            />
            <SettingsItem
              icon={<Share2 size={20} color={Colors.accent[500]} />}
              iconBg={Colors.accent[100]}
              title={t('settings.shareApp')}
              onPress={() => {}}
              theme={theme}
              isRTL={isRTL}
              delay={500}
            />
            <SettingsItem
              icon={<MessageCircle size={20} color={Colors.primary[500]} />}
              iconBg={Colors.primary[100]}
              title={t('settings.contactUs')}
              onPress={() => {}}
              theme={theme}
              isRTL={isRTL}
              delay={550}
            />
            <SettingsItem
              icon={<Info size={20} color={Colors.slate[500]} />}
              iconBg={Colors.slate[100]}
              title={t('settings.version')}
              subtitle="1.0.0"
              showChevron={false}
              theme={theme}
              isRTL={isRTL}
              delay={600}
            />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.error + 'DD', Colors.error]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
              <LogOut size={20} color={Colors.white} />
              <Text style={[styles.logoutText, { fontFamily: getFont('semibold') }]}>{t('auth.logout')}</Text>
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

  // Header
  headerGradient: {
    paddingVertical: 24,
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
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 10,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textRTL: {
    textAlign: 'right',
  },
  sectionContent: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingsItemRTL: {
    flexDirection: 'row-reverse',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemLeftRTL: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    marginLeft: 14,
    flex: 1,
  },
  settingsItemTextRTL: {
    marginLeft: 0,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  settingsItemTitle: {
    fontSize: 16,
  },
  settingsItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.white,
  },
});
