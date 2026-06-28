/**
 * OTP Verification Screen
 * 6-digit phone verification wired to authService.verifyOTP / sendOTP.
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AuthStackScreenProps} from '../../navigation/types';
import Button from '../../components/ui/Button';
import authService from '../../services/api/auth.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

type OTPScreenProps = AuthStackScreenProps<'OTP'>;

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<OTPScreenProps['navigation']>();
  const route = useRoute<OTPScreenProps['route']>();
  const {phone} = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    inputRefs.current[0]?.focus();

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {toValue: 10, duration: 80, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: -10, duration: 80, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 10, duration: 80, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 0, duration: 80, useNativeDriver: true}),
    ]).start();
  };

  const handleOtpChange = (value: string, index: number) => {
    // Allow pasting the full code into any box.
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      if (digits.length) {
        const next = Array(OTP_LENGTH).fill('');
        digits.forEach((d, i) => (next[i] = d));
        setOtp(next);
        setError(null);
        const lastIndex = Math.min(digits.length, OTP_LENGTH) - 1;
        inputRefs.current[lastIndex]?.focus();
        if (digits.length === OTP_LENGTH) handleVerify(next);
      }
      return;
    }

    const sanitized = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = sanitized;
    setOtp(newOtp);
    if (error) setError(null);

    if (sanitized && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === OTP_LENGTH - 1 && sanitized) {
      handleVerify(newOtp);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = otp) => {
    if (loading) return;
    const code = otpCode.join('');
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setLoading(true);
    try {
      await authService.verifyOTP({phone, code});
      // Phone verified — return to the previous screen (the user is already
      // authenticated after register). goBack is safe whether arriving from
      // register or elsewhere in the auth stack.
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('auth.invalidOrExpiredCode'),
      );
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      shakeInputs();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setError(null);
    setResending(true);
    try {
      await authService.sendOTP(phone);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.couldNotResend'));
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.join('').length === OTP_LENGTH;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primary[50], colors.cream[100], colors.background.default]}
        style={styles.gradient}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            disabled={loading}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📱</Text>
            </View>
            <Text style={styles.title}>{t('auth.verifyPhoneNumber')}</Text>
            <Text style={styles.subtitle}>{t('auth.otpSentTo')}</Text>
            <Text style={styles.phone}>{phone}</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* OTP Inputs */}
          <Animated.View
            style={[
              styles.otpContainer,
              {transform: [{translateX: shakeAnimation}]},
            ]}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <TextInput
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={({nativeEvent}) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  editable={!loading}
                  selectTextOnFocus
                />
              </View>
            ))}
          </Animated.View>

          {/* Timer / Resend */}
          <View style={styles.timerContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendText}>
                  {resending ? t('auth.sending') : t('auth.resendCode')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                {t('auth.resendCodeIn')}{' '}
                <Text style={styles.timerNumber}>
                  {Math.floor(timer / 60)}:
                  {(timer % 60).toString().padStart(2, '0')}
                </Text>
              </Text>
            )}
          </View>

          <Button
            title={t('auth.verifyAndContinue')}
            onPress={() => handleVerify()}
            loading={loading}
            disabled={!isComplete || loading}
            fullWidth
            variant="primary"
            size="large"
            style={styles.verifyButton}
          />

          {/* Islamic Quote */}
          <View style={styles.quote}>
            <Text style={styles.quoteArabic}>اللَّهُمَّ بَارِكْ لَنَا</Text>
            <Text style={styles.quoteTranslation}>"O Allah, bless us"</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  backButton: {
    padding: spacing[2],
    marginBottom: spacing[4],
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 28,
    color: colors.primary[500],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  phone: {
    ...typography.bodyMedium,
    color: colors.primary[500],
    fontWeight: '600',
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
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
    paddingHorizontal: spacing[2],
  },
  otpInputWrapper: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  otpInput: {
    backgroundColor: colors.background.paper,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    height: 56,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  timerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  timerNumber: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  resendText: {
    ...typography.bodyMedium,
    color: colors.primary[500],
    fontWeight: '600',
  },
  verifyButton: {
    marginBottom: spacing[4],
  },
  quote: {
    alignItems: 'center',
    marginTop: 'auto',
    padding: spacing[6],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    marginBottom: spacing[6],
  },
  quoteArabic: {
    fontSize: 20,
    color: colors.primary[700],
    marginBottom: spacing[1],
  },
  quoteTranslation: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
