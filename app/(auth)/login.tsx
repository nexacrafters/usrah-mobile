/**
 * Login Screen - Premium Design
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
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Phone, Lock, Fingerprint, Users, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useLogin } from '../../hooks/queries/useAuth';
import { tokenStorage } from '../../services/auth/tokenStorage';
import { getFont, getTextAlign, getWritingDirection, isRTL as checkRTL } from '../../utils/fonts';
import { DEMO_MODE, DEMO_USER, DEMO_TOKENS } from '../../services/demoMode';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = useLogin();
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!phone || !password) {
      setError(rtl ? 'يرجى إدخال جميع البيانات' : 'Please fill in all fields');
      return;
    }

    setError('');

    // Demo Mode - Skip API and use mock data
    if (DEMO_MODE) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      await tokenStorage.saveTokens(DEMO_TOKENS.access, DEMO_TOKENS.refresh);
      setAuth(DEMO_USER as any, DEMO_TOKENS.access, DEMO_TOKENS.refresh);
      setIsLoading(false);
      router.replace('/(app)/(tabs)');
      return;
    }

    // Real API login
    loginMutation.mutate(
      { phone, password },
      {
        onSuccess: (data) => {
          if (data.user.families && data.user.families.length > 0) {
            router.replace('/(app)/(tabs)');
          } else {
            router.replace('/(auth)/family-setup');
          }
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          let message: string;
          if (status === 400 || status === 401) {
            message = rtl ? 'رقم الهاتف أو كلمة المرور غير صحيحة' : 'Invalid phone number or password';
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

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          rtl ? 'غير متاح' : 'Not Available',
          rtl
            ? 'المصادقة البيومترية غير متاحة على هذا الجهاز'
            : 'Biometric authentication is not available on this device'
        );
        return;
      }

      const storedPhone = await tokenStorage.getLastUsedPhone();
      if (!storedPhone) {
        Alert.alert(
          rtl ? 'تسجيل الدخول أولاً' : 'Login First',
          rtl
            ? 'يرجى تسجيل الدخول مرة واحدة على الأقل قبل استخدام المصادقة البيومترية'
            : 'Please login at least once before using biometric authentication'
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: rtl ? 'تأكيد الهوية' : 'Authenticate',
        cancelLabel: rtl ? 'إلغاء' : 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const tokens = await tokenStorage.getTokens();
        if (tokens?.refreshToken) {
          const isExpired = await tokenStorage.isAccessTokenExpired();
          if (!isExpired) {
            router.replace('/(app)/(tabs)');
          } else {
            Alert.alert(
              rtl ? 'جلسة منتهية' : 'Session Expired',
              rtl ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please login again'
            );
          }
        }
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section with Gradient */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <LinearGradient
              colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              {/* Decorative circles */}
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />

              <Animated.View entering={ZoomIn.duration(500).delay(200)} style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Users size={40} color={Colors.primary[600]} />
                </View>
                <Sparkles size={20} color={Colors.gold[400]} style={styles.sparkle} />
              </Animated.View>

              <Text style={[styles.appName, { fontFamily: 'Tajawal_700Bold' }]}>أُسرة</Text>
              <Text style={styles.appTagline}>
                {rtl ? 'عالم عائلتك الخاص' : 'Your Family Universe'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Welcome Text */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {t('auth.signInToContinue')}
            </Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorContainer, { backgroundColor: Colors.error + '15' }]}>
                <Text style={[styles.errorText, { color: Colors.error, fontFamily: getFont('medium') }]}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Phone Input */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('profileSetup.phoneNumber')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
                  <Phone size={18} color={Colors.primary[600]} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                  placeholder="+216 XX XXX XXX"
                  placeholderTextColor={theme.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  writingDirection={getWritingDirection()}
                  editable={!isLoading && !loginMutation.isPending}
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {t('auth.password')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  rtl && styles.inputWrapperRTL,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <View style={[styles.inputIcon, { backgroundColor: Colors.gold[100] }]}>
                  <Lock size={18} color={Colors.gold[600]} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                  placeholder={t('auth.enterPassword')}
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  writingDirection={getWritingDirection()}
                  editable={!isLoading && !loginMutation.isPending}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.placeholder} />
                  ) : (
                    <Eye size={20} color={theme.placeholder} />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Forgot Password */}
            <Animated.View entering={FadeInDown.duration(500).delay(450)}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={[styles.forgotPassword, rtl && styles.forgotPasswordRTL]}>
                  <Text style={[styles.forgotPasswordText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
                    {t('auth.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInUp.duration(500).delay(500)}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading || loginMutation.isPending}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, (isLoading || loginMutation.isPending) && styles.loginButtonDisabled]}
                >
                  {(isLoading || loginMutation.isPending) ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={[styles.loginButtonText, { fontFamily: getFont('bold') }]}>{t('auth.signIn')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Biometric Login */}
            <Animated.View entering={FadeInUp.duration(500).delay(550)}>
              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleBiometricLogin}
              >
                <View style={[styles.biometricIcon, { backgroundColor: Colors.sisters[100] }]}>
                  <Fingerprint size={22} color={Colors.sisters[600]} />
                </View>
                <Text style={[styles.biometricText, { color: theme.text, fontFamily: getFont('medium') }]}>
                  {t('auth.useBiometric')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Register Link */}
          <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
              {t('auth.dontHaveAccount')}{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.registerLink, { color: Colors.primary[500], fontFamily: getFont('bold') }]}>
                  {t('auth.signUp')}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  // Hero Section
  heroSection: {
    paddingTop: 40,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -60,
    left: -60,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -40,
    right: -40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  appName: {
    fontSize: 36,
    color: Colors.white,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Tajawal_400Regular',
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
  },

  // Form
  form: {
    paddingHorizontal: 24,
  },
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  inputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordRTL: {
    alignSelf: 'flex-start',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  biometricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricText: {
    fontSize: 15,
  },

  // Register
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  registerText: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
  },
});
