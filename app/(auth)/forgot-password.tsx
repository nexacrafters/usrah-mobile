import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useThemeStore } from '../../store/themeStore';
import { useRequestPasswordReset, useResetPassword, useSendOtp } from '../../hooks/queries/useAuth';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../utils/fonts';

type Step = 'phone' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const sendOtpMutation = useSendOtp();
  const resetPasswordMutation = useResetPassword();

  const isLoading = sendOtpMutation.isPending || resetPasswordMutation.isPending;

  const handleSendOtp = async () => {
    if (!phone) {
      setError(rtl ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number');
      return;
    }

    setError('');

    sendOtpMutation.mutate(
      { phone, purpose: 'reset_password' },
      {
        onSuccess: () => {
          setStep('otp');
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            (rtl ? 'فشل إرسال الرمز' : 'Failed to send code');
          setError(message);
        },
      }
    );
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      setError(rtl ? 'يرجى إدخال الرمز الكامل' : 'Please enter the complete code');
      return;
    }

    setError('');
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(rtl ? 'يرجى إدخال كلمة المرور' : 'Please enter the password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(rtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError(rtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setError('');

    resetPasswordMutation.mutate(
      { phone, code: otp, newPassword },
      {
        onSuccess: () => {
          router.replace('/(auth)/login');
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            (rtl ? 'فشل تغيير كلمة المرور' : 'Failed to reset password');
          setError(message);
        },
      }
    );
  };

  const handleBack = () => {
    setError('');
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'newPassword') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      router.back();
    }
  };

  const renderPhoneStep = () => (
    <>
      <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
        {rtl ? 'نسيت كلمة المرور' : 'Forgot Password'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
        {rtl ? 'أدخل رقم هاتفك وسنرسل لك رمز التحقق.' : "Enter your phone number and we'll send you a verification code."}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
          {rtl ? 'رقم الهاتف' : 'Phone Number'}
        </Text>
        <View style={[styles.inputWrapper, rtl && styles.inputWrapperRTL, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Phone size={20} color={theme.placeholder} />
          <TextInput
            style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder="+216 XX XXX XXX"
            placeholderTextColor={theme.placeholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            writingDirection={getWritingDirection()}
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.primary[500] }, isLoading && { opacity: 0.7 }]}
        onPress={handleSendOtp}
        disabled={isLoading || !phone}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.buttonText, { fontFamily: getFont('bold') }]}>
            {rtl ? 'إرسال الرمز' : 'Send Code'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
        {rtl ? 'أدخل رمز التحقق' : 'Enter Verification Code'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
        {rtl ? 'لقد أرسلنا رمز التحقق إلى' : "We've sent a verification code to"}{'\n'}
        <Text style={{ color: Colors.primary[500] }}>{phone}</Text>
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
          {rtl ? 'رمز التحقق' : 'Verification Code'}
        </Text>
        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <TextInput
            style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: 'center', letterSpacing: 8 }]}
            placeholder="000000"
            placeholderTextColor={theme.placeholder}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.primary[500] }]}
        onPress={handleVerifyOtp}
        disabled={otp.length < 6}
      >
        <Text style={[styles.buttonText, { fontFamily: getFont('bold') }]}>
          {rtl ? 'تحقق' : 'Verify'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOtp}
        disabled={sendOtpMutation.isPending}
      >
        <Text style={[styles.resendText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
          {sendOtpMutation.isPending ? (rtl ? 'جاري الإرسال...' : 'Sending...') : (rtl ? 'إعادة إرسال الرمز' : 'Resend Code')}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <Text style={[styles.title, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
        {rtl ? 'كلمة مرور جديدة' : 'New Password'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
        {rtl ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
          {rtl ? 'كلمة المرور الجديدة' : 'New Password'}
        </Text>
        <View style={[styles.inputWrapper, rtl && styles.inputWrapperRTL, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Lock size={20} color={theme.placeholder} />
          <TextInput
            style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder={rtl ? '8 أحرف على الأقل' : 'At least 8 characters'}
            placeholderTextColor={theme.placeholder}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            writingDirection={getWritingDirection()}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} color={theme.placeholder} /> : <Eye size={20} color={theme.placeholder} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
          {rtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
        </Text>
        <View style={[styles.inputWrapper, rtl && styles.inputWrapperRTL, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Lock size={20} color={theme.placeholder} />
          <TextInput
            style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder={rtl ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
            placeholderTextColor={theme.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            writingDirection={getWritingDirection()}
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.primary[500] }, isLoading && { opacity: 0.7 }]}
        onPress={handleResetPassword}
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.buttonText, { fontFamily: getFont('bold') }]}>
            {rtl ? 'تغيير كلمة المرور' : 'Reset Password'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, rtl && styles.headerRTL]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: Colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: Colors.error, fontFamily: getFont('medium') }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'newPassword' && renderNewPasswordStep()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row' },
  headerRTL: { flexDirection: 'row-reverse' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
  errorContainer: { padding: 16, borderRadius: 12, marginBottom: 20 },
  errorText: { fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  inputWrapperRTL: { flexDirection: 'row-reverse' },
  input: { flex: 1, fontSize: 16 },
  button: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 18, color: Colors.white },
  resendButton: { alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14 },
});
