/**
 * Register Screen
 * Phone-based account creation wired to the auth service + auth store.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AuthStackScreenProps} from '../../navigation/types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authService from '../../services/api/auth.service';
import {bootstrapSession} from '../../services/api/session';
import {colors, spacing, typography, borderRadius} from '../../theme';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;
type Gender = 'male' | 'female';

interface FormData {
  fullName: string;
  phone: string;
  gender: Gender | '';
  password: string;
  passwordConfirm: string;
}

export default function RegisterScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<RegisterScreenProps['navigation']>();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    gender: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
    if (formError) setFormError(null);
  };

  const validate = (): boolean => {
    const next: {[key: string]: string} = {};
    if (!formData.fullName.trim()) next.fullName = t('auth.fullNameRequired');
    if (!formData.phone.trim()) next.phone = t('auth.phoneRequired');
    if (!formData.gender) next.gender = t('auth.selectGender');
    if (!formData.password) {
      next.password = t('auth.passwordRequired');
    } else if (formData.password.length < 8) {
      next.password = t('auth.passwordMinLength');
    }
    if (formData.passwordConfirm !== formData.password) {
      next.passwordConfirm = t('auth.passwordsNoMatch');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return;
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const {user, tokens} = await authService.register({
        phone: formData.phone.trim(),
        full_name: formData.fullName.trim(),
        gender: formData.gender as Gender,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      });
      // Persist tokens+user and resolve family context. The root navigator
      // reacts to isAuthenticated and routes into the App stack.
      await bootstrapSession(user, tokens.access, tokens.refresh);
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : t('auth.unableToCreateAccount'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.cream[100], colors.background.default]}
        style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                disabled={loading}
                onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.logo}>أسرة</Text>
              <Text style={styles.title}>{t('auth.createYourAccount')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.startFamilyJourney')}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {formError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              <Input
                label={t('auth.fullName')}
                placeholder={t('auth.yourFullName')}
                value={formData.fullName}
                onChangeText={value => updateField('fullName', value)}
                error={errors.fullName}
                autoCapitalize="words"
                textContentType="name"
                editable={!loading}
              />

              <Input
                label={t('auth.phoneNumber')}
                placeholder={t('auth.phonePlaceholder')}
                value={formData.phone}
                onChangeText={value => updateField('phone', value)}
                error={errors.phone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                editable={!loading}
              />

              {/* Gender selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('auth.gender')}</Text>
                <View style={styles.genderRow}>
                  {(['male', 'female'] as Gender[]).map(option => {
                    const selected = formData.gender === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        activeOpacity={0.8}
                        disabled={loading}
                        style={[
                          styles.genderOption,
                          selected && styles.genderOptionSelected,
                        ]}
                        onPress={() => updateField('gender', option)}>
                        <Text style={styles.genderEmoji}>
                          {option === 'male' ? '🧔' : '🧕'}
                        </Text>
                        <Text
                          style={[
                            styles.genderText,
                            selected && styles.genderTextSelected,
                          ]}>
                          {option === 'male'
                            ? t('auth.male')
                            : t('auth.female')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.gender ? (
                  <Text style={styles.fieldError}>{errors.gender}</Text>
                ) : null}
              </View>

              <Input
                label={t('auth.password')}
                placeholder={t('auth.createStrongPassword')}
                value={formData.password}
                onChangeText={value => updateField('password', value)}
                error={errors.password}
                helperText={t('auth.atLeast8Characters')}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
              />

              <Input
                label={t('auth.confirmPassword')}
                placeholder={t('auth.reEnterPassword')}
                value={formData.passwordConfirm}
                onChangeText={value => updateField('passwordConfirm', value)}
                error={errors.passwordConfirm}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  {t('auth.agreeToTermsPrefix')}{' '}
                  <Text style={styles.termsLink}>
                    {t('auth.termsOfService')}
                  </Text>{' '}
                  {t('auth.and')}{' '}
                  <Text style={styles.termsLink}>
                    {t('auth.privacyPolicy')}
                  </Text>
                </Text>
              </View>

              <Button
                title={t('auth.createAccount')}
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                fullWidth
                variant="gold"
                size="large"
                style={styles.registerButton}
              />
            </View>

            {/* Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.alreadyHaveAccount')}{' '}
              </Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>

            {/* Islamic Quote */}
            <View style={styles.quote}>
              <Text style={styles.quoteArabic}>
                وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا
              </Text>
              <Text style={styles.quoteTranslation}>
                "And among His signs is that He created for you mates from among yourselves"
              </Text>
              <Text style={styles.quoteReference}>Quran 30:21</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing[2],
  },
  backText: {
    fontSize: 28,
    color: colors.primary[500],
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: spacing[3],
    textShadowColor: colors.primary[200],
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 10,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing[6],
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  fieldGroup: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[4],
  },
  genderOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  genderEmoji: {
    fontSize: 20,
    marginRight: spacing[2],
  },
  genderText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  genderTextSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  fieldError: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing[1],
  },
  termsContainer: {
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  registerButton: {
    marginTop: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  footerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLink: {
    ...typography.bodyMedium,
    color: colors.primary[500],
    fontWeight: '600',
  },
  quote: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.gold[50],
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold[500],
  },
  quoteArabic: {
    fontSize: 18,
    color: colors.gold[700],
    marginBottom: spacing[2],
    textAlign: 'center',
    lineHeight: 28,
  },
  quoteTranslation: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  quoteReference: {
    ...typography.caption,
    color: colors.gold[600],
    fontWeight: '600',
  },
});
