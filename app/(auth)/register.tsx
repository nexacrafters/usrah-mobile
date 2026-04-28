/**
 * Register Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Phone, Lock, User, Mail, ChevronLeft, ChevronRight, UserPlus, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useRegister, useSendOtp } from '../../hooks/queries/useAuth';
import { getFont, getTextAlign, getWritingDirection, isRTL as checkRTL } from '../../utils/fonts';
import { DEMO_MODE, DEMO_USER, DEMO_TOKENS } from '../../services/demoMode';
import { tokenStorage } from '../../services/auth/tokenStorage';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = useRegister();
  const sendOtpMutation = useSendOtp();
  const [demoLoading, setDemoLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const isLoading = registerMutation.isPending || sendOtpMutation.isPending || demoLoading;

  const handleRegister = async () => {
    // Validation
    if (!fullName || !phone || !password || !confirmPassword || !gender) {
      setError(rtl ? 'يرجى إدخال جميع البيانات' : 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError(rtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError(rtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setError('');

    // Demo Mode - Skip API and use mock data
    if (DEMO_MODE) {
      setDemoLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Store demo tokens
      await tokenStorage.saveTokens(DEMO_TOKENS.access, DEMO_TOKENS.refresh);

      // Set auth state with user's entered data
      const demoUserWithName = {
        ...DEMO_USER,
        full_name: fullName,
        phone: phone,
        email: email || DEMO_USER.email,
        gender: gender,
      };
      setAuth(demoUserWithName as any, DEMO_TOKENS.access, DEMO_TOKENS.refresh);

      setDemoLoading(false);
      // Navigate to main app (skip verify in demo)
      router.replace('/(app)/(tabs)');
      return;
    }

    // First register, then send OTP
    registerMutation.mutate(
      {
        phone,
        password,
        name: fullName,
        email: email || undefined,
      },
      {
        onSuccess: () => {
          // Send OTP for verification
          sendOtpMutation.mutate(
            { phone, purpose: 'register' },
            {
              onSuccess: () => {
                router.push({
                  pathname: '/(auth)/verify',
                  params: { phone, name: fullName, gender },
                });
              },
              onError: (err: any) => {
                // Even if OTP fails, still navigate (user can resend)
                router.push({
                  pathname: '/(auth)/verify',
                  params: { phone, name: fullName, gender },
                });
              },
            }
          );
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          let message: string;
          if (status === 400) {
            message = rtl ? 'رقم الهاتف مسجل بالفعل' : 'Phone number already registered';
          } else if (status === 429) {
            message = rtl ? 'محاولات كثيرة. حاول لاحقاً' : 'Too many attempts. Try again later';
          } else {
            message = rtl ? 'حدث خطأ. حاول مرة أخرى' : 'Something went wrong. Please try again';
          }
          setError(message);
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.headerRTL]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.card }]}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Icon */}
          <Animated.View entering={ZoomIn.duration(500).delay(100)} style={styles.heroSection}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.primary[700]]}
                style={styles.iconGradient}
              >
                <UserPlus size={40} color={Colors.white} />
              </LinearGradient>
              <Sparkles size={18} color={Colors.gold[400]} style={styles.sparkle} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {t('auth.createAccount')}
            </Text>
            <Text style={[styles.titleAr, { color: Colors.primary[500], fontFamily: 'Tajawal_700Bold', textAlign: getTextAlign() }]}>
              {t('auth.createAccountAr')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {t('auth.joinUsrah')}
            </Text>
          </Animated.View>

          {/* Error Message */}
          {error ? (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorContainer, { backgroundColor: Colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: Colors.error, fontFamily: getFont('medium') }]}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('auth.fullName')} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
                  <User size={18} color={Colors.primary[600]} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular') }]}
                  placeholder={t('auth.enterFullName')}
                  placeholderTextColor={theme.placeholder}
                  value={fullName}
                  onChangeText={setFullName}
                  textAlign={getTextAlign()}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Gender Selection */}
            <Animated.View entering={FadeInUp.duration(400).delay(350)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('profileSetup.gender')} *
              </Text>
              <View style={[styles.genderContainer, rtl && styles.genderContainerRTL]}>
                <TouchableOpacity
                  style={[styles.genderButton, { borderColor: theme.cardBorder }]}
                  onPress={() => setGender('male')}
                  disabled={isLoading}
                >
                  {gender === 'male' ? (
                    <LinearGradient
                      colors={[Colors.primary[500], Colors.primary[600]]}
                      style={styles.genderGradient}
                    >
                      <Text style={[styles.genderText, styles.genderTextActive, { fontFamily: getFont('semibold') }]}>
                        👨 {t('profileSetup.male')}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.genderInner, { backgroundColor: theme.card }]}>
                      <Text style={[styles.genderText, { color: theme.text, fontFamily: getFont('medium') }]}>
                        👨 {t('profileSetup.male')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderButton, { borderColor: theme.cardBorder }]}
                  onPress={() => setGender('female')}
                  disabled={isLoading}
                >
                  {gender === 'female' ? (
                    <LinearGradient
                      colors={[Colors.sisters[500], Colors.sisters[600]]}
                      style={styles.genderGradient}
                    >
                      <Text style={[styles.genderText, styles.genderTextActive, { fontFamily: getFont('semibold') }]}>
                        👩 {t('profileSetup.female')}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.genderInner, { backgroundColor: theme.card }]}>
                      <Text style={[styles.genderText, { color: theme.text, fontFamily: getFont('medium') }]}>
                        👩 {t('profileSetup.female')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Phone */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('profileSetup.phoneNumber')} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Phone size={18} color={Colors.success} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular') }]}
                  placeholder="+216 XX XXX XXX"
                  placeholderTextColor={theme.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textAlign={getTextAlign()}
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View entering={FadeInUp.duration(400).delay(450)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('auth.email')} ({t('common.optional')})
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.warning + '20' }]}>
                  <Mail size={18} color={Colors.warning} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular') }]}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign={getTextAlign()}
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Password */}
            <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('auth.password')} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.error + '20' }]}>
                  <Lock size={18} color={Colors.error} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular') }]}
                  placeholder={t('auth.minCharacters')}
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign={getTextAlign()}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Confirm Password */}
            <Animated.View entering={FadeInUp.duration(400).delay(550)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('auth.confirmPassword')} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.error + '20' }]}>
                  <Lock size={18} color={Colors.error} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular') }]}
                  placeholder={t('auth.confirmYourPassword')}
                  placeholderTextColor={theme.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textAlign={getTextAlign()}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Register Button */}
            <Animated.View entering={FadeInUp.duration(400).delay(600)}>
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <UserPlus size={22} color={Colors.white} />
                      <Text style={[styles.registerButtonText, { fontFamily: getFont('semibold') }]}>
                        {t('auth.createAccount')}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Login Link */}
          <Animated.View entering={FadeInUp.duration(400).delay(700)} style={[styles.loginContainer, rtl && styles.loginContainerRTL]}>
            <Text style={[styles.loginText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: Colors.primary[500], fontFamily: getFont('bold') }]}>
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    position: 'relative',
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },

  // Title
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
  },
  titleAr: {
    fontSize: 22,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
  },

  // Error
  errorContainer: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Form
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  inputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },

  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderContainerRTL: {
    flexDirection: 'row-reverse',
  },
  genderButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  genderGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  genderInner: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 16,
  },
  genderTextActive: {
    color: Colors.white,
  },

  // Register Button
  registerButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  registerButtonText: {
    fontSize: 18,
    color: Colors.white,
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 24,
  },
  loginContainerRTL: {
    flexDirection: 'row-reverse',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
  },
});
