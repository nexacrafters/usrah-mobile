/**
 * Emergency Screen - Premium Design
 * Village Emergency Network
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Vibration,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Phone,
  Flame,
  Shield,
  Stethoscope,
  Siren,
  Car,
  Baby,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  HeartPulse,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { useVillageHelpers, useSendAlert } from '../../../hooks/queries/useVillage';

const { width } = Dimensions.get('window');

const emergencyContacts = [
  { id: '1', name: 'Village Emergency', nameAr: 'طوارئ القرية', phone: '199', icon: Siren, color: Colors.error, primary: true },
  { id: '2', name: 'Medical Emergency', nameAr: 'الطوارئ الطبية', phone: '190', icon: Stethoscope, color: Colors.error },
  { id: '3', name: 'Fire Department', nameAr: 'الإطفاء', phone: '198', icon: Flame, color: Colors.warning },
  { id: '4', name: 'Police', nameAr: 'الشرطة', phone: '197', icon: Shield, color: Colors.primary[600] },
];

const quickAlerts = [
  { id: 'medical', label: 'Medical', labelAr: 'طبي', icon: Stethoscope, color: Colors.error },
  { id: 'fire', label: 'Fire', labelAr: 'حريق', icon: Flame, color: Colors.warning },
  { id: 'security', label: 'Security', labelAr: 'أمني', icon: Shield, color: Colors.primary[600] },
  { id: 'baby', label: 'Baby Help', labelAr: 'مساعدة طفل', icon: Baby, color: Colors.sisters[500] },
  { id: 'car', label: 'Car Help', labelAr: 'مساعدة سيارة', icon: Car, color: Colors.slate[600] },
  { id: 'utility', label: 'Utility', labelAr: 'خدمات', icon: Zap, color: Colors.gold[600] },
];

export default function EmergencyScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [refreshing, setRefreshing] = useState(false);

  // Fetch village helpers from API
  const { data: villageHelpers = [], isLoading, refetch } = useVillageHelpers();
  const sendAlertMutation = useSendAlert();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEmergencyCall = (phone: string, name: string) => {
    Vibration.vibrate(100);
    Alert.alert(
      rtl ? 'اتصال طوارئ' : 'Emergency Call',
      rtl ? `هل تريد الاتصال بـ ${name}؟` : `Call ${name}?`,
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: rtl ? 'اتصل' : 'Call', style: 'destructive', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const handleVillageAlert = async (type: string, label: string) => {
    Vibration.vibrate([100, 50, 100]);
    Alert.alert(
      rtl ? 'إرسال تنبيه' : 'Send Alert',
      rtl ? `هل تريد إرسال تنبيه ${label} لجميع جيرانك؟` : `Send ${label} alert to all neighbors?`,
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'إرسال' : 'Send',
          style: 'destructive',
          onPress: async () => {
            try {
              await sendAlertMutation.mutateAsync({
                type: type as any,
                message: `${label} alert from neighbor`,
              });
              Vibration.vibrate(200);
              Alert.alert(
                rtl ? 'تم الإرسال' : 'Alert Sent',
                rtl ? 'تم إرسال التنبيه لجميع الجيران' : 'Alert sent to all neighbors'
              );
            } catch (error: any) {
              Alert.alert(rtl ? 'خطأ' : 'Error', error.message || (rtl ? 'فشل إرسال التنبيه' : 'Failed to send alert'));
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={[Colors.error + 'DD', Colors.error]}
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
                {rtl ? 'الطوارئ' : 'Emergency'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'شبكة طوارئ القرية' : 'Village Emergency Network'}
              </Text>
            </View>
          </View>
          <Sparkles size={18} color={Colors.gold[400]} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.error}
          />
        }
      >
        {/* Main Emergency Button */}
        <Animated.View entering={ZoomIn.duration(500).delay(200)}>
          <TouchableOpacity
            onPress={() => handleEmergencyCall('199', rtl ? 'طوارئ القرية' : 'Village Emergency')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.error, Colors.error + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainEmergencyButton}
            >
              <View style={styles.emergencyPulse} />
              <View style={styles.emergencyIconBox}>
                <HeartPulse size={48} color={Colors.white} />
              </View>
              <Text style={[styles.emergencyText, { fontFamily: getFont('bold') }]}>
                {rtl ? 'اتصال طوارئ' : 'EMERGENCY'}
              </Text>
              <Text style={[styles.emergencySubtext, { fontFamily: getFont('regular') }]}>
                {rtl ? 'اضغط للاتصال بطوارئ القرية' : 'Tap to call Village Emergency'}
              </Text>
              <View style={styles.emergencyBadge}>
                <Phone size={14} color={Colors.error} />
                <Text style={[styles.emergencyBadgeText, { fontFamily: getFont('bold') }]}>199</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Alert to Neighbors */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.warning + '20' }]}>
              <AlertTriangle size={18} color={Colors.warning} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'تنبيه سريع للجيران' : 'Quick Alert to Neighbors'}
            </Text>
          </View>

          <View style={[styles.alertGrid, rtl && styles.alertGridRTL]}>
            {quickAlerts.map((alert, index) => (
              <Animated.View
                key={alert.id}
                entering={FadeInUp.duration(300).delay(350 + index * 50)}
                style={styles.alertButtonWrapper}
              >
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => handleVillageAlert(alert.id, rtl ? alert.labelAr : alert.label)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[alert.color + '20', alert.color + '30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.alertButtonGradient, { borderColor: alert.color }]}
                  >
                    <alert.icon size={28} color={alert.color} />
                    <Text style={[styles.alertLabel, { color: alert.color, fontFamily: getFont('semibold') }]}>
                      {rtl ? alert.labelAr : alert.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Emergency Contacts */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.error + '20' }]}>
              <Phone size={18} color={Colors.error} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'أرقام الطوارئ' : 'Emergency Numbers'}
            </Text>
          </View>

          {emergencyContacts.map((contact, index) => (
            <Animated.View
              key={contact.id}
              entering={FadeInUp.duration(300).delay(550 + index * 50)}
            >
              <TouchableOpacity
                onPress={() => handleEmergencyCall(contact.phone, rtl ? contact.nameAr : contact.name)}
                activeOpacity={0.8}
              >
                {contact.primary ? (
                  <LinearGradient
                    colors={[contact.color, contact.color + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.contactCard, rtl && styles.rowReverse]}
                  >
                    <View style={styles.contactIconPrimary}>
                      <contact.icon size={24} color={Colors.white} />
                    </View>
                    <View style={[styles.contactInfo, rtl && styles.contactInfoRTL]}>
                      <Text style={[styles.contactNamePrimary, { fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                        {rtl ? contact.nameAr : contact.name}
                      </Text>
                      <Text style={[styles.contactPhonePrimary, { fontFamily: getFont('regular') }]}>
                        {contact.phone}
                      </Text>
                    </View>
                    <View style={styles.callButtonPrimary}>
                      <Phone size={20} color={Colors.white} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.contactCardNormal, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}>
                    <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                      <contact.icon size={22} color={contact.color} />
                    </View>
                    <View style={[styles.contactInfo, rtl && styles.contactInfoRTL]}>
                      <Text style={[styles.contactName, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                        {rtl ? contact.nameAr : contact.name}
                      </Text>
                      <Text style={[styles.contactPhone, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                        {contact.phone}
                      </Text>
                    </View>
                    <View style={[styles.callButton, { backgroundColor: Colors.success + '20' }]}>
                      <Phone size={18} color={Colors.success} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Village Helpers */}
        <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary[100] }]}>
              <Users size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'مساعدون في القرية' : 'Village Helpers'}
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
            {rtl ? 'جيران متخصصون يمكنهم المساعدة' : 'Skilled neighbors who can help'}
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : villageHelpers.length === 0 ? (
            <View style={[styles.emptyHelpers, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: Colors.primary[100] }]}>
                <Users size={32} color={Colors.primary[500]} />
              </View>
              <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                {rtl ? 'لا يوجد مساعدون مسجلون' : 'No helpers registered'}
              </Text>
            </View>
          ) : (
            villageHelpers.map((helper, index) => (
              <Animated.View
                key={helper.id}
                entering={FadeInUp.duration(300).delay(750 + index * 50)}
              >
                <TouchableOpacity
                  style={[styles.helperCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}
                  onPress={() => handleEmergencyCall(helper.phone || '', helper.name)}
                >
                  <View style={[styles.helperAvatar, { backgroundColor: helper.is_available ? Colors.success + '20' : Colors.slate[200] }]}>
                    <Text style={[styles.helperInitial, { color: helper.is_available ? Colors.success : Colors.slate[500], fontFamily: getFont('bold') }]}>
                      {helper.name.charAt(0)}
                    </Text>
                    {helper.is_available && <View style={styles.availableDot} />}
                  </View>
                  <View style={[styles.helperInfo, rtl && styles.helperInfoRTL]}>
                    <Text style={[styles.helperName, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                      {helper.name}
                    </Text>
                    <Text style={[styles.helperRole, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                      {helper.skill}
                    </Text>
                  </View>
                  <View style={[styles.helperStatus, { backgroundColor: helper.is_available ? Colors.success + '20' : Colors.slate[200] }]}>
                    <Text style={[styles.statusText, { color: helper.is_available ? Colors.success : Colors.slate[600], fontFamily: getFont('medium') }]}>
                      {helper.is_available ? (rtl ? 'متاح' : 'Available') : (rtl ? 'مشغول' : 'Busy')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Safety Tips */}
        <Animated.View entering={FadeInUp.duration(400).delay(900)}>
          <LinearGradient
            colors={[Colors.gold[100], Colors.gold[200]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipsCard}
          >
            <View style={[styles.tipsHeader, rtl && styles.rowReverse]}>
              <View style={[styles.tipsIconBox, { backgroundColor: Colors.gold[300] }]}>
                <AlertTriangle size={20} color={Colors.gold[700]} />
              </View>
              <Text style={[styles.tipsTitle, { color: Colors.gold[800], fontFamily: getFont('bold') }]}>
                {rtl ? 'نصائح السلامة' : 'Safety Tips'}
              </Text>
            </View>
            <Text style={[styles.tipsText, { color: Colors.gold[700], fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {rtl
                ? '• احفظ أرقام الطوارئ\n• تأكد من معرفة موقعك\n• ابقَ هادئاً في حالات الطوارئ\n• أبلغ جيرانك عند السفر'
                : '• Keep emergency numbers saved\n• Know your exact location\n• Stay calm in emergencies\n• Inform neighbors when traveling'}
            </Text>
          </LinearGradient>
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
  rowReverse: {
    flexDirection: 'row-reverse',
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

  // Emergency Button
  mainEmergencyButton: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emergencyPulse: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1000,
  },
  emergencyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyText: {
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 3,
    marginBottom: 6,
  },
  emergencySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emergencyBadgeText: {
    fontSize: 16,
    color: Colors.error,
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
    fontSize: 18,
    flex: 1,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 14,
    marginTop: -8,
  },

  // Alert Grid
  alertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  alertGridRTL: {
    flexDirection: 'row-reverse',
  },
  alertButtonWrapper: {
    width: '31%',
  },
  alertButton: {
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  alertButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 20,
  },
  alertLabel: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Contact Cards
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    gap: 14,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactCardNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  contactIconPrimary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactInfoRTL: {
    alignItems: 'flex-end',
  },
  contactNamePrimary: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 3,
  },
  contactPhonePrimary: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  contactName: {
    fontSize: 16,
    marginBottom: 3,
  },
  contactPhone: {
    fontSize: 15,
  },
  callButtonPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Helpers
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  helperAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  helperInitial: {
    fontSize: 20,
  },
  availableDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  helperInfo: {
    flex: 1,
  },
  helperInfoRTL: {
    alignItems: 'flex-end',
  },
  helperName: {
    fontSize: 16,
    marginBottom: 3,
  },
  helperRole: {
    fontSize: 13,
  },
  helperStatus: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyHelpers: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },

  // Tips Card
  tipsCard: {
    borderRadius: 20,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  tipsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 17,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 26,
  },
});
