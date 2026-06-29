/**
 * More/Settings Screen
 * Real profile header (authStore), active family, and a working logout.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigation/types';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import {useAuthStore} from '../../store/authStore';
import {showConfirm} from '../../store/dialogStore';
import familyService from '../../services/api/family.service';
import {syncNow} from '../../sync/syncEngine';
import {colors, spacing, typography, borderRadius} from '../../theme';
import {
  changeLanguage,
  SUPPORTED_LANGUAGES,
  LanguageCode,
} from '../../../i18n';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  subtitle?: string;
  onPress?: () => void;
}

export default function MoreScreen() {
  const {t, i18n} = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const currentFamilyName = useAuthStore((s) => s.currentFamilyName);
  const currentFamilyId = useAuthStore((s) => s.currentFamilyId);
  const setCurrentFamily = useAuthStore((s) => s.setCurrentFamily);
  const [showLanguage, setShowLanguage] = useState(false);

  // The user's families/circles (parents', siblings', each spouse's household…).
  const [families, setFamilies] = useState<Array<{public_id: string; name: string}>>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      familyService
        .listFamilies()
        .then((list) => {
          if (alive) setFamilies(list);
        })
        .catch(() => {
          /* offline / not critical */
        });
      return () => {
        alive = false;
      };
    }, []),
  );

  const switchFamily = (id: string, name: string) => {
    if (id === currentFamilyId) return;
    setCurrentFamily(id, name);
    void syncNow();
  };

  const activeLang = (i18n.language as LanguageCode) || 'ar';

  const ISLAMIC_FEATURES: Array<MenuItem & {color: string}> = [
    {id: 'quran', title: t('settings.quran'), icon: 'book-open-page-variant', color: colors.islamic.mashallah, onPress: () => navigation.navigate('Quran')},
    {id: 'qibla', title: t('settings.qiblaCompass'), icon: 'compass-outline', color: colors.primary[500], onPress: () => navigation.navigate('Qibla')},
    {id: 'dhikr', title: t('settings.dhikrCounter'), icon: 'counter', color: colors.gold[500], onPress: () => navigation.navigate('Dhikr')},
    {id: 'zakat', title: t('settings.zakatCalculator'), icon: 'hand-coin', color: colors.islamic.alhamdulillah, onPress: () => navigation.navigate('Zakat')},
    {id: 'dua', title: t('settings.dailyDuas'), icon: 'hands-pray', color: colors.islamic.barakallah, onPress: () => navigation.navigate('Duas')},
    {id: 'hijri', title: t('settings.hijriCalendar'), icon: 'calendar-star', color: colors.skyBlue[500], onPress: () => navigation.navigate('Hijri')},
    {id: 'habits', title: t('habits.title', {defaultValue: 'Daily Habits'}), icon: 'sprout-outline', color: colors.islamic.mashallah, onPress: () => navigation.navigate('Habits')},
    {id: 'hifz', title: t('hifz.title', {defaultValue: 'Memorization'}), icon: 'book-clock-outline', color: colors.gold[600], onPress: () => navigation.navigate('Memorization')},
  ];

  const FAMILY_FEATURES: Array<MenuItem & {color: string}> = [
    {id: 'shopping', title: t('shopping.title', {defaultValue: 'Shopping List'}), icon: 'cart-outline', color: colors.primary[500], onPress: () => navigation.navigate('Shopping')},
    {id: 'mealplan', title: t('mealPlan.title', {defaultValue: 'Meal Plan'}), icon: 'food-fork-drink', color: colors.gold[600], onPress: () => navigation.navigate('MealPlan')},
    {id: 'pantry', title: t('pantry.title', {defaultValue: 'Kitchen Supplies'}), icon: 'fridge-outline', color: colors.islamic.alhamdulillah, onPress: () => navigation.navigate('Pantry')},
    {id: 'goals', title: t('goals.title', {defaultValue: 'Goals'}), icon: 'target', color: colors.gold[500], onPress: () => navigation.navigate('Goals')},
    {id: 'debts', title: t('debts.title', {defaultValue: 'Debts'}), icon: 'cash-multiple', color: colors.sand[600], onPress: () => navigation.navigate('Debts')},
    {id: 'masrouf', title: t('masrouf.title', {defaultValue: 'Masrouf'}), icon: 'gift-outline', color: colors.islamic.barakallah, onPress: () => navigation.navigate('Masrouf')},
    {id: 'recurring', title: t('recurring.title', {defaultValue: 'Recurring'}), icon: 'repeat', color: colors.skyBlue[600], onPress: () => navigation.navigate('Recurring')},
    {id: 'calendar', title: t('calendar.title', {defaultValue: 'Calendar'}), icon: 'calendar-month', color: colors.skyBlue[500], onPress: () => navigation.navigate('Calendar')},
    {id: 'circle', title: t('social.title', {defaultValue: 'Family Feed'}), icon: 'heart-multiple', color: colors.islamic.mashallah, onPress: () => navigation.navigate('Circle')},
    {id: 'notes', title: t('notes.title', {defaultValue: 'Notes'}), icon: 'note-text-outline', color: colors.gold[500], onPress: () => navigation.navigate('Notes')},
    {id: 'documents', title: t('documents.title', {defaultValue: 'Documents'}), icon: 'file-document-outline', color: colors.skyBlue[500], onPress: () => navigation.navigate('Documents')},
    {id: 'forum', title: t('forum.title', {defaultValue: 'Forum'}), icon: 'forum-outline', color: colors.islamic.alhamdulillah, onPress: () => navigation.navigate('Forum')},
    {id: 'halaqat', title: t('halaqat.title', {defaultValue: 'Halaqat'}), icon: 'book-education-outline', color: colors.primary[500], onPress: () => navigation.navigate('Halaqat')},
  ];

  const APP_SETTINGS: MenuItem[] = [
    {id: 'notifications', title: t('settings.notifications'), icon: '🔔', subtitle: t('settings.notificationsSubtitle'), onPress: () => navigation.navigate('NotificationSettings')},
    {id: 'prayer', title: t('settings.prayerSettings'), icon: '🕌', subtitle: t('settings.prayerSettingsSubtitle'), onPress: () => navigation.navigate('Prayer')},
    {
      id: 'language',
      title: t('settings.languageRow'),
      icon: '🌐',
      subtitle: SUPPORTED_LANGUAGES[activeLang].nativeName,
      onPress: () => setShowLanguage(true),
    },
  ];

  const OTHER_OPTIONS: MenuItem[] = [
    {id: 'help', title: t('settings.helpSupport'), icon: '❓', onPress: () => navigation.navigate('Help')},
    {id: 'about', title: t('settings.aboutUsrah'), icon: 'ℹ️', subtitle: t('settings.versionLabel'), onPress: () => navigation.navigate('About')},
    {id: 'feedback', title: t('settings.sendFeedback'), icon: '💬', onPress: () => navigation.navigate('Feedback')},
  ];

  const handleLogout = async () => {
    const ok = await showConfirm({
      title: t('settings.signOut'),
      message: t('settings.signOutConfirm'),
      confirmText: t('settings.signOut'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) {
      useAuthStore.getState().logout();
    }
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    setShowLanguage(false);
    if (code !== activeLang) {
      changeLanguage(code);
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={item.onPress ? 0.6 : 1}>
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{item.icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderIslamicFeature = (item: MenuItem & {color: string}) => (
    <TouchableOpacity
      key={item.id}
      style={styles.featureCard}
      onPress={item.onPress}
      activeOpacity={0.7}>
      <View style={[styles.featureIcon, {backgroundColor: item.color + '20'}]}>
        <Icon name={item.icon} size={26} color={item.color} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.more')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Card -> Family management */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Family')}>
          <Card style={styles.profileCard}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.profileGradient}>
            <Avatar
              name={user?.full_name ?? t('settings.guest')}
              source={user?.avatar ? {uri: user.avatar} : undefined}
              size="xlarge"
            />
            <Text style={styles.profileName}>
              {user?.full_name ?? t('settings.guest')}
            </Text>
            {!!(user?.email || user?.phone) && (
              <Text style={styles.profileEmail}>
                {user?.email || user?.phone}
              </Text>
            )}
            {!!currentFamilyName && (
              <Text style={styles.profileRole}>{currentFamilyName}</Text>
            )}
          </LinearGradient>
          </Card>
        </TouchableOpacity>

        {/* Circles switcher: tap any family/circle to make it active. A person
            belongs to several — parents', siblings', each spouse's household. */}
        {families.length > 1 && (
          <View style={styles.circlesSection}>
            <Text style={styles.circlesLabel}>
              {t('family.yourFamilies', {defaultValue: 'Your circles'})}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.circlesRow}>
              {families.map((fam) => {
                const active = fam.public_id === currentFamilyId;
                return (
                  <TouchableOpacity
                    key={fam.public_id}
                    activeOpacity={0.85}
                    style={[styles.circleChip, active && styles.circleChipActive]}
                    onPress={() => switchFamily(fam.public_id, fam.name)}>
                    <Icon
                      name={active ? 'check-circle' : 'account-group'}
                      size={16}
                      color={active ? colors.primary[600] : colors.text.tertiary}
                    />
                    <Text
                      style={[
                        styles.circleChipText,
                        active && styles.circleChipTextActive,
                      ]}
                      numberOfLines={1}>
                      {fam.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Islamic Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.islamicFeatures')}
          </Text>
          <View style={styles.featuresGrid}>
            {ISLAMIC_FEATURES.map(renderIslamicFeature)}
          </View>
        </View>

        {/* Family & Tools Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.familyTools', {defaultValue: 'Family & Tools'})}
          </Text>
          <View style={styles.featuresGrid}>
            {FAMILY_FEATURES.map(renderIslamicFeature)}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
          <Card variant="outlined" style={styles.menuCard}>
            {APP_SETTINGS.map(renderMenuItem)}
          </Card>
        </View>

        {/* Other Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.other')}</Text>
          <Card variant="outlined" style={styles.menuCard}>
            {OTHER_OPTIONS.map(renderMenuItem)}
          </Card>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>

        {/* Islamic Quote */}
        <Card variant="outlined" style={styles.quoteCard}>
          <Text style={styles.quoteArabic}>وَقُل رَّبِّ زِدْنِي عِلْمًا</Text>
          <Text style={styles.quoteTranslation}>
            "And say: My Lord, increase me in knowledge"
          </Text>
          <Text style={styles.quoteReference}>Quran 20:114</Text>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.madeWithLove')}</Text>
          <Text style={styles.footerCopyright}>{t('settings.copyright')}</Text>
        </View>
      </ScrollView>

      {/* Language selector */}
      <Modal
        visible={showLanguage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguage(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLanguage(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => {
              const selected = code === activeLang;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.langRow, selected && styles.langRowActive]}
                  onPress={() => handleSelectLanguage(code)}
                  activeOpacity={0.7}>
                  <Text style={styles.langName}>
                    {SUPPORTED_LANGUAGES[code].nativeName}
                  </Text>
                  {selected && <Text style={styles.langCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  profileCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  profileGradient: {
    padding: spacing[8],
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  profileEmail: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing[1],
  },
  profileRole: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginTop: spacing[2],
  },
  circlesSection: {
    marginTop: -spacing[2],
    marginBottom: spacing[5],
  },
  circlesLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  circlesRow: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  circleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  circleChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  circleChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    maxWidth: 140,
  },
  circleChipTextActive: {
    color: colors.primary[700],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.text.tertiary,
    fontWeight: '300',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '31.5%',
    alignItems: 'center',
    padding: spacing[4],
    marginBottom: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureTitle: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error,
    marginBottom: spacing[6],
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    marginBottom: spacing[6],
  },
  quoteArabic: {
    fontSize: 18,
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
  footer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  footerCopyright: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  modalTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  langRowActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  langName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  langCheck: {
    fontSize: 18,
    color: colors.primary[500],
    fontWeight: '700',
  },
});
