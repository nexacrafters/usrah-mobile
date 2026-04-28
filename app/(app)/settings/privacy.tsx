/**
 * Privacy & Security Settings Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Lock,
  Eye,
  Fingerprint,
  Key,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [biometric, setBiometric] = useState(true);
  const [hideOnline, setHideOnline] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);

  const handleChangePassword = () => {
    Alert.alert(
      rtl ? 'تغيير كلمة المرور' : 'Change Password',
      rtl ? 'سيتم إرسال رابط إعادة تعيين كلمة المرور' : 'A password reset link will be sent'
    );
  };

  const handleExportData = () => {
    Alert.alert(
      rtl ? 'تصدير البيانات' : 'Export Data',
      rtl ? 'سيتم إرسال بياناتك إلى بريدك الإلكتروني' : 'Your data will be sent to your email'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      rtl ? 'حذف الحساب' : 'Delete Account',
      rtl ? 'هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Are you sure? This action cannot be undone.',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: rtl ? 'حذف' : 'Delete', style: 'destructive' },
      ]
    );
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
                {rtl ? 'الخصوصية والأمان' : 'Privacy & Security'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'حماية حسابك' : 'Protect your account'}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Protection Status */}
        <Animated.View entering={ZoomIn.duration(500).delay(200)}>
          <LinearGradient
            colors={[Colors.success + 'DD', Colors.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCard}
          >
            <View style={styles.statusIconBox}>
              <ShieldCheck size={32} color={Colors.white} />
            </View>
            <Text style={[styles.statusTitle, { fontFamily: getFont('bold') }]}>
              {rtl ? 'حسابك محمي' : 'Your Account is Protected'}
            </Text>
            <View style={styles.statusBadge}>
              <Lock size={12} color={Colors.success} />
              <Text style={[styles.statusBadgeText, { fontFamily: getFont('medium') }]}>
                {rtl ? 'التشفير من طرف إلى طرف مفعّل' : 'End-to-end encryption is enabled'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary[100] }]}>
              <Shield size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'الأمان' : 'Security'}
            </Text>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Biometric Login */}
            <View style={[styles.settingItem, rtl && styles.rowReverse]}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.primary[100] }]}>
                <Fingerprint size={22} color={Colors.primary[600]} />
              </View>
              <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تسجيل الدخول البيومتري' : 'Biometric Login'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'استخدم البصمة أو Face ID' : 'Use fingerprint or Face ID'}
                </Text>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: theme.inputBorder, true: Colors.primary[500] }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* Change Password */}
            <TouchableOpacity
              style={[styles.settingItem, rtl && styles.rowReverse]}
              onPress={handleChangePassword}
            >
              <View style={[styles.settingIcon, { backgroundColor: Colors.gold[100] }]}>
                <Key size={22} color={Colors.gold[600]} />
              </View>
              <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تغيير كلمة المرور' : 'Change Password'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تحديث كلمة المرور' : 'Update your password'}
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: theme.inputBackground }]}>
                {rtl ? <ChevronLeft size={18} color={theme.icon} /> : <ChevronRight size={18} color={theme.icon} />}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Privacy Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.sisters[100] }]}>
              <Eye size={18} color={Colors.sisters[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'الخصوصية' : 'Privacy'}
            </Text>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Hide Online Status */}
            <View style={[styles.settingItem, rtl && styles.rowReverse]}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.sisters[100] }]}>
                <Eye size={22} color={Colors.sisters[600]} />
              </View>
              <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'إخفاء حالة الاتصال' : 'Hide Online Status'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'لن يرى الآخرون متى تكون متصلاً' : "Others won't see when you're online"}
                </Text>
              </View>
              <Switch
                value={hideOnline}
                onValueChange={setHideOnline}
                trackColor={{ false: theme.inputBorder, true: Colors.primary[500] }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* Read Receipts */}
            <View style={[styles.settingItem, rtl && styles.rowReverse]}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.accent[100] }]}>
                <Lock size={22} color={Colors.accent[600]} />
              </View>
              <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'إيصالات القراءة' : 'Read Receipts'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'أظهر عندما تقرأ الرسائل' : "Show when you've read messages"}
                </Text>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={setReadReceipts}
                trackColor={{ false: theme.inputBorder, true: Colors.primary[500] }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </Animated.View>

        {/* Data Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
              <Download size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'البيانات' : 'Data'}
            </Text>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Export Data */}
            <TouchableOpacity
              style={[styles.settingItem, rtl && styles.rowReverse]}
              onPress={handleExportData}
            >
              <View style={[styles.settingIcon, { backgroundColor: Colors.primary[100] }]}>
                <Download size={22} color={Colors.primary[600]} />
              </View>
              <View style={[styles.settingInfo, rtl && styles.settingInfoRTL]}>
                <Text style={[styles.settingTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تصدير بياناتي' : 'Export My Data'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                  {rtl ? 'تنزيل نسخة من بياناتك' : 'Download a copy of your data'}
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: theme.inputBackground }]}>
                {rtl ? <ChevronLeft size={18} color={theme.icon} /> : <ChevronRight size={18} color={theme.icon} />}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.error + '20' }]}>
              <AlertTriangle size={18} color={Colors.error} />
            </View>
            <Text style={[styles.sectionTitle, { color: Colors.error, fontFamily: getFont('bold') }]}>
              {rtl ? 'منطقة الخطر' : 'Danger Zone'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.9}
            style={styles.dangerCard}
          >
            <LinearGradient
              colors={[Colors.error + 'DD', Colors.error]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.dangerContent, rtl && styles.rowReverse]}
            >
              <View style={styles.dangerIconBox}>
                <Trash2 size={22} color={Colors.white} />
              </View>
              <View style={[styles.dangerInfo, rtl && styles.dangerInfoRTL]}>
                <Text style={[styles.dangerTitle, { fontFamily: getFont('semibold') }]}>
                  {rtl ? 'حذف الحساب' : 'Delete Account'}
                </Text>
                <Text style={[styles.dangerDesc, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'حذف حسابك نهائياً' : 'Permanently delete your account'}
                </Text>
              </View>
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
  rowReverse: {
    flexDirection: 'row-reverse',
  },

  // Status Card
  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  statusIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    color: Colors.white,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    color: Colors.success,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
  },

  // Settings Card
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingInfoRTL: {
    alignItems: 'flex-end',
  },
  settingTitle: {
    fontSize: 15,
    marginBottom: 3,
  },
  settingDesc: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  actionArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Danger Card
  dangerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  dangerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerInfo: {
    flex: 1,
  },
  dangerInfoRTL: {
    alignItems: 'flex-end',
  },
  dangerTitle: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 2,
  },
  dangerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
});
