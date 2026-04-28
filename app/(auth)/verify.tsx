/**
 * OTP Verification Screen - Premium Design
 */
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Shield, Mail, RefreshCw, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useVerifyOtp, useSendOtp } from '../../hooks/queries/useAuth';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../utils/fonts';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

export default function VerifyScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { phone, name, gender } = useLocalSearchParams<{
    phone: string;
    name?: string;
    gender?: string;
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const verifyOtpMutation = useVerifyOtp();
  const sendOtpMutation = useSendOtp();

  // Animation for shield icon
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    if (!phone) {
      setError(rtl ? 'رقم الهاتف مفقود' : 'Phone number missing');
      return;
    }

    verifyOtpMutation.mutate(
      { phone, code },
      {
        onSuccess: (data) => {
          if (!data.user.families || data.user.families.length === 0) {
            router.replace('/(auth)/family-setup');
          } else {
            router.replace('/(app)/(tabs)');
          }
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            (rtl ? 'رمز التحقق غير صالح' : 'Invalid verification code');
          setError(message);
          setOtp(['', '', '', '', '', '']);
          inputs.current[0]?.focus();
        },
      }
    );
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;

    setCanResend(false);
    setCountdown(60);
    setError('');

    sendOtpMutation.mutate(
      { phone, purpose: 'register' },
      {
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              (rtl ? 'فشل إعادة الإرسال' : 'Failed to resend')
          );
          setCanResend(true);
        },
      }
    );
  };

  const isLoading = verifyOtpMutation.isPending;

  // Format phone for display
  const formatPhone = (phoneNum: string) => {
    if (!phoneNum) return '+216 XX XXX XXX';
    return phoneNum.replace(/(\+?\d{3})(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.headerRTL]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </Animated.View>

      <View style={styles.content}>
        {/* Hero Icon */}
        <Animated.View entering={ZoomIn.duration(500).delay(100)} style={styles.heroSection}>
          <Animated.View style={[styles.iconWrapper, pulseStyle]}>
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[700]]}
              style={styles.iconGradient}
            >
              <Shield size={48} color={Colors.white} />
            </LinearGradient>
            <Sparkles size={20} color={Colors.gold[400]} style={styles.sparkle} />
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {rtl ? 'تأكيد الهاتف' : 'Verify Phone'}
          </Text>
          <Text style={[styles.titleAr, { color: Colors.primary[500], fontFamily: 'Tajawal_700Bold', textAlign: getTextAlign() }]}>
            {rtl ? 'Verify Phone' : 'تأكيد الهاتف'}
          </Text>
        </Animated.View>

        {/* Subtitle with phone */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
            {rtl ? 'لقد أرسلنا رمز التحقق إلى' : "We've sent a verification code to"}
          </Text>
          <View style={[styles.phoneContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.phoneIcon, { backgroundColor: Colors.primary[100] }]}>
              <Mail size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.phoneText, { color: Colors.primary[600], fontFamily: getFont('bold') }]}>
              {formatPhone(phone || '')}
            </Text>
          </View>
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorContainer, { backgroundColor: Colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: Colors.error, fontFamily: getFont('medium') }]}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        {/* OTP Inputs */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[styles.otpContainer, rtl && styles.otpContainerRTL]}>
          {otp.map((digit, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.duration(300).delay(400 + index * 50)}
            >
              <TextInput
                ref={(ref) => (inputs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: digit ? Colors.primary[50] : theme.inputBackground,
                    borderColor: digit ? Colors.primary[500] : theme.inputBorder,
                    color: theme.text,
                    fontFamily: getFont('bold'),
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Loading */}
        {isLoading && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
              {rtl ? 'جاري التحقق...' : 'Verifying...'}
            </Text>
          </Animated.View>
        )}

        {/* Resend Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(500)}>
          <TouchableOpacity
            style={[
              styles.resendButton,
              { backgroundColor: canResend ? Colors.primary[100] : theme.card },
              !canResend && { opacity: 0.7 },
            ]}
            onPress={handleResend}
            disabled={!canResend || sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.primary[600]} />
            ) : (
              <RefreshCw size={18} color={canResend ? Colors.primary[600] : theme.textSecondary} />
            )}
            <Text
              style={[
                styles.resendText,
                {
                  color: canResend ? Colors.primary[600] : theme.textSecondary,
                  fontFamily: getFont('medium'),
                },
              ]}
            >
              {canResend
                ? (rtl ? 'إعادة إرسال الرمز' : 'Resend Code')
                : rtl
                ? `إعادة الإرسال خلال ${countdown} ثانية`
                : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress indicator */}
        <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: Colors.primary[500],
                  width: `${((60 - countdown) / 60) * 100}%`,
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    position: 'relative',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  title: {
    fontSize: 28,
    marginBottom: 4,
    textAlign: 'center',
  },
  titleAr: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Phone Display
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
    alignSelf: 'center',
  },
  phoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 17,
    letterSpacing: 1,
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

  // OTP Inputs
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpContainerRTL: {
    flexDirection: 'row-reverse',
  },
  otpInput: {
    width: (width - 48 - 50) / 6,
    maxWidth: 52,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 26,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 15,
  },

  // Resend
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 15,
  },

  // Progress
  progressSection: {
    paddingHorizontal: 40,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
