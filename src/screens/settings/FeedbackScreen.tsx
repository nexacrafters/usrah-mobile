/**
 * Send Feedback Screen
 *
 * A category picker (Bug / Suggestion / Other) plus a multiline message field.
 * Since there is no feedback API, "Send" composes a pre-filled mailto: link and
 * hands off to the device email client via Linking. The message is validated to
 * be non-empty before sending, and the user gets a confirmation.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Card from '../../components/ui/Card';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius} from '../../theme';

const SUPPORT_EMAIL = 'support@nexacrafters.com';

type CategoryId = 'bug' | 'suggestion' | 'other';

interface CategoryDef {
  id: CategoryId;
  icon: string;
  labelKey: string;
}

const CATEGORIES: CategoryDef[] = [
  {id: 'bug', icon: 'bug-outline', labelKey: 'settings.feedbackBug'},
  {
    id: 'suggestion',
    icon: 'lightbulb-on-outline',
    labelKey: 'settings.feedbackSuggestion',
  },
  {id: 'other', icon: 'dots-horizontal', labelKey: 'settings.feedbackOther'},
];

export default function FeedbackScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [category, setCategory] = useState<CategoryId>('bug');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      void showAlert({
        title: t('settings.feedbackEmptyTitle'),
        message: t('settings.feedbackEmptyMessage'),
      });
      return;
    }

    const categoryLabel = t(
      CATEGORIES.find((c) => c.id === category)?.labelKey ??
        'settings.feedbackOther',
    );
    const subject = `Usrah Feedback — ${categoryLabel}`;
    const url =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(trimmed)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('mailto not supported');
      }
      await Linking.openURL(url);
      await showAlert({
        title: t('settings.feedbackSentTitle'),
        message: t('settings.feedbackSentMessage'),
        confirmText: t('common.ok'),
      });
      navigation.goBack();
    } catch {
      void showAlert({
        title: t('settings.feedbackErrorTitle'),
        message: t('settings.feedbackErrorMessage'),
      });
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
        <Text style={styles.headerTitle}>{t('settings.feedbackTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>{t('settings.feedbackIntro')}</Text>

          <Text style={styles.sectionTitle}>
            {t('settings.feedbackCategory')}
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const selected = cat.id === category;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.8}>
                  <Icon
                    name={cat.icon}
                    size={22}
                    color={selected ? colors.white : colors.primary[600]}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      selected && styles.categoryLabelActive,
                    ]}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            {t('settings.feedbackMessage')}
          </Text>
          <Card variant="outlined" style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder={t('settings.feedbackPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              textAlignVertical="top"
            />
          </Card>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.85}>
            <Icon name="send" size={20} color={colors.white} />
            <Text style={styles.sendButtonText}>
              {t('settings.feedbackSend')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  flex: {
    flex: 1,
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
  categoryRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryLabel: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.white,
  },
  inputCard: {
    padding: spacing[2],
    marginBottom: spacing[6],
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 140,
    padding: spacing[2],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
