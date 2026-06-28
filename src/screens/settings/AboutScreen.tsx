/**
 * About Usrah Screen
 *
 * App identity (name, tagline, version), a short description of what Usrah
 * does, a Bismillah, and legal / authorship links opened via Linking.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Card from '../../components/ui/Card';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius} from '../../theme';

const PRIVACY_URL = 'https://nexacrafters.com/usrah/privacy';
const TERMS_URL = 'https://nexacrafters.com/usrah/terms';
const SITE_URL = 'https://nexacrafters.com';

export default function AboutScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('url not supported');
      }
      await Linking.openURL(url);
    } catch {
      void showAlert({title: t('settings.aboutTitle'), message: url});
    }
  };

  const links: Array<{
    id: string;
    icon: string;
    label: string;
    onPress: () => void;
  }> = [
    {
      id: 'privacy',
      icon: 'shield-lock-outline',
      label: t('settings.privacyPolicy'),
      onPress: () => openUrl(PRIVACY_URL),
    },
    {
      id: 'terms',
      icon: 'file-document-outline',
      label: t('settings.termsOfService'),
      onPress: () => openUrl(TERMS_URL),
    },
  ];

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
        <Text style={styles.headerTitle}>{t('settings.aboutTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Card style={styles.heroCard}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.heroGradient}>
            <View style={styles.logoCircle}>
              <Icon
                name="home-heart"
                size={40}
                color={colors.white}
              />
            </View>
            <Text style={styles.appName}>Usrah</Text>
            <Text style={styles.tagline}>{t('settings.aboutTagline')}</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>
                {t('settings.aboutVersion')}
              </Text>
            </View>
          </LinearGradient>
        </Card>

        {/* Bismillah */}
        <Card variant="outlined" style={styles.bismillahCard}>
          <Text style={styles.bismillahArabic}>
            {t('settings.aboutBismillah')}
          </Text>
          <Text style={styles.bismillahTranslation}>
            {t('settings.aboutVerse')}
          </Text>
        </Card>

        {/* Description */}
        <Card variant="outlined" style={styles.descCard}>
          <Text style={styles.descText}>{t('settings.aboutDescription')}</Text>
        </Card>

        {/* Legal links */}
        <Text style={styles.sectionTitle}>
          {t('settings.aboutLinksSection')}
        </Text>
        <Card variant="outlined" style={styles.groupCard}>
          {links.map((link, index) => (
            <TouchableOpacity
              key={link.id}
              style={[
                styles.linkRow,
                index !== links.length - 1 && styles.itemBorder,
              ]}
              onPress={link.onPress}
              activeOpacity={0.7}>
              <Icon
                name={link.icon}
                size={22}
                color={colors.primary[600]}
                style={styles.linkIcon}
              />
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Icon
                name="open-in-new"
                size={18}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Made by Nexacrafters */}
        <TouchableOpacity
          style={styles.madeByRow}
          onPress={() => openUrl(SITE_URL)}
          activeOpacity={0.7}>
          <Text style={styles.madeByText}>{t('settings.aboutMadeBy')}</Text>
          <Text style={styles.madeByDesc}>{t('settings.aboutMadeByDesc')}</Text>
        </TouchableOpacity>
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
  heroCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  heroGradient: {
    padding: spacing[8],
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[1],
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  versionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  versionText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  bismillahCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  bismillahArabic: {
    fontSize: 22,
    lineHeight: 38,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  bismillahTranslation: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  descCard: {
    marginBottom: spacing[6],
  },
  descText: {
    ...typography.body,
    color: colors.text.secondary,
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  linkIcon: {
    marginRight: spacing[3],
  },
  linkLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  madeByRow: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  madeByText: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: 2,
  },
  madeByDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
