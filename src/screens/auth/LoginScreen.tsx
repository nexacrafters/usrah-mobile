/**
 * Login Screen
 * Phone + password sign-in wired to the auth service and auth store.
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

type LoginScreenProps = AuthStackScreenProps<'Login'>;

export default function LoginScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<LoginScreenProps['navigation']>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (loading) return;
    setError(null);

    if (!phone.trim() || !password) {
      setError(t('auth.enterPhoneAndPassword'));
      return;
    }

    setLoading(true);
    try {
      const {user, tokens} = await authService.login({
        phone: phone.trim(),
        password,
      });
      // Persists tokens+user and resolves the active family. The root
      // navigator reacts to isAuthenticated and swaps to the App stack.
      await bootstrapSession(user, tokens.access, tokens.refresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.unableToSignIn'));
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
              <Text style={styles.logo}>أسرة</Text>
              <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
              <Text style={styles.subtitle}>{t('auth.signInToFamily')}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Input
                label={t('auth.phoneNumber')}
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  if (error) setError(null);
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
                returnKeyType="next"
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.enterPassword')}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                disabled={loading}
                onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <Button
                title={t('auth.signIn')}
                onPress={handleLogin}
                loading={loading}
                disabled={!canSubmit}
                fullWidth
                variant="primary"
                style={styles.loginButton}
              />
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.dontHaveAccount')}{' '}
              </Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>
                  {t('auth.createFamily')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Islamic Quote */}
            <View style={styles.quote}>
              <Text style={styles.quoteArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              <Text style={styles.quoteTranslation}>
                In the name of Allah, the Most Gracious, the Most Merciful
              </Text>
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
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: spacing[4],
    textShadowColor: colors.primary[200],
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 10,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing[8],
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
    marginTop: -spacing[2],
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.primary[500],
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: spacing[4],
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
  registerLink: {
    ...typography.bodyMedium,
    color: colors.primary[500],
    fontWeight: '600',
  },
  quote: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold[500],
  },
  quoteArabic: {
    fontSize: 20,
    color: colors.primary[700],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  quoteTranslation: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
