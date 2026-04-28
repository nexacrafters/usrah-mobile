/**
 * Edit Profile Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Save,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useUpdateProfile } from '../../../hooks/queries/useAuth';

const { width } = Dimensions.get('window');

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { user } = useAuthStore();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [fullName, setFullName] = useState(user?.full_name || user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender || 'male');

  // Update profile mutation
  const updateProfile = useUpdateProfile();

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى إدخال الاسم' : 'Please enter your name');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        gender,
      });

      Alert.alert(
        rtl ? 'نجاح' : 'Success',
        rtl ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        error.message || (rtl ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerContent, rtl && styles.headerContentRTL]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {rtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'قم بتحديث معلوماتك' : 'Update your information'}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <Animated.View entering={ZoomIn.duration(500).delay(200)} style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.primary[400], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={[styles.avatarText, { fontFamily: getFont('bold') }]}>
                {fullName.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.changePhotoButton}>
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.changePhotoGradient}
              >
                <Camera size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={[styles.changePhotoText, { color: Colors.primary[500], fontFamily: getFont('medium') }]}>
            {rtl ? 'تغيير الصورة' : 'Change Photo'}
          </Text>
        </Animated.View>

        {/* Form Fields */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputHeader, rtl && styles.inputHeaderRTL]}>
              <View style={[styles.inputIconBox, { backgroundColor: Colors.primary[100] }]}>
                <User size={16} color={Colors.primary[600]} />
              </View>
              <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold') }]}>
                {rtl ? 'الاسم الكامل' : 'Full Name'}
              </Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder={rtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                placeholderTextColor={theme.placeholder}
                writingDirection={getWritingDirection()}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputHeader, rtl && styles.inputHeaderRTL]}>
              <View style={[styles.inputIconBox, { backgroundColor: Colors.accent[100] }]}>
                <Phone size={16} color={Colors.accent[600]} />
              </View>
              <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold') }]}>
                {rtl ? 'رقم الهاتف' : 'Phone Number'}
              </Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+216 XX XXX XXX"
                placeholderTextColor={theme.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputHeader, rtl && styles.inputHeaderRTL]}>
              <View style={[styles.inputIconBox, { backgroundColor: Colors.gold[100] }]}>
                <Mail size={16} color={Colors.gold[600]} />
              </View>
              <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold') }]}>
                {rtl ? 'البريد الإلكتروني' : 'Email'} <Text style={{ color: theme.textSecondary, fontSize: 12 }}>({rtl ? 'اختياري' : 'Optional'})</Text>
              </Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={theme.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputHeader, rtl && styles.inputHeaderRTL]}>
              <View style={[styles.inputIconBox, { backgroundColor: Colors.sisters[100] }]}>
                <User size={16} color={Colors.sisters[600]} />
              </View>
              <Text style={[styles.label, { color: theme.text, fontFamily: getFont('semibold') }]}>
                {rtl ? 'الجنس' : 'Gender'}
              </Text>
            </View>
            <View style={[styles.genderRow, rtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                onPress={() => setGender('male')}
              >
                {gender === 'male' ? (
                  <LinearGradient
                    colors={[Colors.primary[500], Colors.primary[700]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.genderGradient}
                  >
                    <Check size={16} color={Colors.white} />
                    <Text style={[styles.genderTextActive, { fontFamily: getFont('semibold') }]}>
                      {rtl ? 'ذكر' : 'Male'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.genderInactive, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.genderText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                      {rtl ? 'ذكر' : 'Male'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                onPress={() => setGender('female')}
              >
                {gender === 'female' ? (
                  <LinearGradient
                    colors={[Colors.sisters[400], Colors.sisters[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.genderGradient}
                  >
                    <Check size={16} color={Colors.white} />
                    <Text style={[styles.genderTextActive, { fontFamily: getFont('semibold') }]}>
                      {rtl ? 'أنثى' : 'Female'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.genderInactive, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.genderText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                      {rtl ? 'أنثى' : 'Female'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.saveButtonContainer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateProfile.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={updateProfile.isPending
                ? [Colors.slate[400], Colors.slate[500]]
                : [Colors.primary[500], Colors.primary[700]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButton}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Save size={20} color={Colors.white} />
                  <Text style={[styles.saveButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'حفظ التغييرات' : 'Save Changes'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    bottom: -10,
    left: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerContentRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 44,
    color: Colors.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  changePhotoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: 14,
  },

  // Input
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  inputHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  genderButtonActive: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  genderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  genderInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  genderText: {
    fontSize: 16,
  },
  genderTextActive: {
    fontSize: 16,
    color: Colors.white,
  },

  // Save Button
  saveButtonContainer: {
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
});
