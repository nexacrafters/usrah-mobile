/**
 * Forgot Password Screen
 * Two-step reset:
 *   1. Request a code  -> POST /auth/password/reset/
 *   2. Confirm reset    -> POST /auth/password/reset/confirm/ {phone, code, new_password}
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AuthStackScreenProps} from '../../navigation/types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import authService from '../../services/api/auth.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

type ForgotPasswordScreenProps = AuthStackScreenProps<'ForgotPassword'>;
type Step = 'phone' | 'confirm';

export default function ForgotPasswordScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<ForgotPasswordScreenProps['navigation']>();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (loading) return;
    setError(null);
    setInfo(null);
    if (!phone.trim()) {
      setError(t('auth.enterPhonePrompt'));
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(phone.trim());
      setStep('confirm');
      setInfo(t('auth.codeSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.couldNotSendCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    setError(null);
    if (code.trim().length !== 6) {
      setError(t('auth.enter6DigitCode'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }
    setLoading(true);
    try {
      await authService.confirmPasswordReset({
        phone: phone.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      navigation.navigate('Login');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('auth.couldNotResetPassword'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await authService.requestPasswordReset(phone.trim());
      setInfo(t('auth.newCodeSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.couldNotResend'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary[50], colors.cream[100], colors.background.default]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                disabled={loading}
                onPress={() =>
                  step === 'confirm' ? setStep('phone') : navigation.goBack()
                }>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Text style={styles.logo}>أسرة</Text>
              </View>

              <Text style={styles.title}>
                {step === 'phone'
                  ? t('auth.forgotPasswordTitle')
                  : t('auth.resetPassword')}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'phone'
                  ? t('auth.forgotPasswordSubtitle')
                  : t('auth.resetPasswordSubtitle')}
              </Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {info && (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoText}>{info}</Text>
                </View>
              )}
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {step === 'phone' ? (
                <>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>🔐</Text>
                  </View>

                  <Input
                    label={t('auth.phoneNumber')}
                    placeholder={t('auth.phonePlaceholder')}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    value={phone}
                    onChangeText={text => {
                      setPhone(text);
                      if (error) setError(null);
                    }}
                    editable={!loading}
                  />

                  <Button
                    title={t('auth.sendVerificationCode')}
                    onPress={handleSendCode}
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={loading}
                    disabled={loading || !phone.trim()}
                    style={styles.button}
                  />

                  <TouchableOpacity
                    style={styles.linkContainer}
                    disabled={loading}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>
                      {t('auth.rememberPassword')}{' '}
                      <Text style={styles.link}>{t('auth.signIn')}</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>🔑</Text>
                  </View>

                  <Input
                    label={t('auth.verificationCode')}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={text => {
                      setCode(text.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    editable={!loading}
                  />

                  <Input
                    label={t('auth.newPassword')}
                    placeholder={t('auth.enterNewPassword')}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    helperText={t('auth.atLeast8Characters')}
                    value={newPassword}
                    onChangeText={text => {
                      setNewPassword(text);
                      if (error) setError(null);
                    }}
                    editable={!loading}
                  />

                  <Input
                    label={t('auth.confirmPassword')}
                    placeholder={t('auth.reEnterNewPassword')}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    value={confirmPassword}
                    onChangeText={text => {
                      setConfirmPassword(text);
                      if (error) setError(null);
                    }}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />

                  <Button
                    title={t('auth.resetPassword')}
                    onPress={handleResetPassword}
                    variant="gold"
                    size="large"
                    fullWidth
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                  />

                  <TouchableOpacity
                    style={styles.linkContainer}
                    disabled={loading}
                    onPress={handleResend}>
                    <Text style={styles.linkText}>
                      {t('auth.didntReceiveCode')}{' '}
                      <Text style={styles.link}>{t('auth.resend')}</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Islamic Quote */}
              <Card variant="outlined" style={styles.quoteCard}>
                <Text style={styles.quoteArabic}>
                  وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا
                </Text>
                <Text style={styles.quoteTranslation}>
                  "And whoever fears Allah - He will make for him a way out"
                </Text>
                <Text style={styles.quoteReference}>Quran 65:2</Text>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  header: {
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  backIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary[700],
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.primary[700],
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[8],
  },
  iconEmoji: {
    fontSize: 64,
  },
  button: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  linkText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  link: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  quoteCard: {
    marginTop: spacing[4],
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  quoteArabic: {
    fontSize: 18,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: 28,
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
});
