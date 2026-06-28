/**
 * Help & Support Screen
 *
 * An expandable FAQ with accurate, app-specific answers (family invite codes,
 * offline-first storage, IP-based prayer times, TND currency) plus a
 * "Contact us" row that opens the device email client via Linking.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Card from '../../components/ui/Card';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius} from '../../theme';

const SUPPORT_EMAIL = 'support@nexacrafters.com';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq {
  id: string;
  questionKey: string;
  answerKey: string;
}

const FAQS: Faq[] = [
  {
    id: 'addMember',
    questionKey: 'settings.faqAddMemberQ',
    answerKey: 'settings.faqAddMemberA',
  },
  {
    id: 'trackExpense',
    questionKey: 'settings.faqTrackExpenseQ',
    answerKey: 'settings.faqTrackExpenseA',
  },
  {
    id: 'prayerTimes',
    questionKey: 'settings.faqPrayerTimesQ',
    answerKey: 'settings.faqPrayerTimesA',
  },
  {
    id: 'offline',
    questionKey: 'settings.faqOfflineQ',
    answerKey: 'settings.faqOfflineA',
  },
];

export default function HelpScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleContact = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('mailto not supported');
      }
      await Linking.openURL(url);
    } catch {
      void showAlert({title: t('settings.contactUsRow'), message: SUPPORT_EMAIL});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('settings.back')}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.helpTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('settings.helpIntro')}</Text>

        <Text style={styles.sectionTitle}>{t('settings.faqTitle')}</Text>
        <Card variant="outlined" style={styles.groupCard}>
          {FAQS.map((faq, index) => {
            const open = openId === faq.id;
            const isLast = index === FAQS.length - 1;
            return (
              <View key={faq.id} style={!isLast && styles.itemBorder}>
                <TouchableOpacity
                  style={styles.questionRow}
                  onPress={() => toggle(faq.id)}
                  activeOpacity={0.7}>
                  <Text style={styles.questionText}>{t(faq.questionKey)}</Text>
                  <Icon
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
                {open && (
                  <Text style={styles.answerText}>{t(faq.answerKey)}</Text>
                )}
              </View>
            );
          })}
        </Card>

        <Text style={styles.sectionTitle}>{t('settings.contactSection')}</Text>
        <Card variant="outlined" style={styles.groupCard}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleContact}
            activeOpacity={0.7}>
            <View style={styles.contactIcon}>
              <Icon
                name="email-outline"
                size={22}
                color={colors.primary[600]}
              />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>
                {t('settings.contactUsRow')}
              </Text>
              <Text style={styles.contactDesc}>{SUPPORT_EMAIL}</Text>
            </View>
            <Icon
              name="chevron-right"
              size={22}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  intro: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  questionText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing[3],
  },
  answerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
