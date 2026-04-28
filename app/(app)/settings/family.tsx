/**
 * Family Settings Screen - Premium Design
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import {
  Users,
  UserPlus,
  Copy,
  Share2,
  Settings,
  LogOut,
  Crown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Shield,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useFamily, useFamilyMembers, useLeaveFamily } from '../../../hooks/queries/useFamilies';

const roles: Record<string, { label: string; labelAr: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', labelAr: 'مدير', color: Colors.gold[600], bgColor: Colors.gold[100] },
  parent: { label: 'Parent', labelAr: 'والد', color: Colors.primary[600], bgColor: Colors.primary[100] },
  child: { label: 'Child', labelAr: 'طفل', color: Colors.sisters[600], bgColor: Colors.sisters[100] },
  member: { label: 'Member', labelAr: 'عضو', color: Colors.accent[600], bgColor: Colors.accent[100] },
};

export default function FamilySettingsScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { family: authFamily, logout } = useAuthStore();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [refreshing, setRefreshing] = useState(false);

  // Fetch family data
  const { data: family, isLoading: familyLoading, refetch: refetchFamily } = useFamily(authFamily?.id || '');
  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useFamilyMembers(authFamily?.id || '');

  // Leave family mutation
  const leaveFamily = useLeaveFamily();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFamily(), refetchMembers()]);
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    const code = family?.invite_code || authFamily?.invite_code;
    if (code) {
      await Clipboard.setStringAsync(code);
      Alert.alert(
        rtl ? 'تم النسخ' : 'Copied',
        rtl ? 'تم نسخ رمز العائلة' : 'Family code copied to clipboard'
      );
    }
  };

  const handleInvite = () => {
    const code = family?.invite_code || authFamily?.invite_code;
    Alert.alert(
      rtl ? 'دعوة أعضاء' : 'Invite Members',
      rtl
        ? `شارك هذا الرمز مع أفراد العائلة للانضمام: ${code}`
        : `Share this code with family members to join: ${code}`
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      rtl ? 'مغادرة العائلة' : 'Leave Family',
      rtl ? 'هل أنت متأكد من مغادرة هذه العائلة؟' : 'Are you sure you want to leave this family?',
      [
        { text: rtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: rtl ? 'مغادرة' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily.mutateAsync(authFamily?.id || '');
              logout();
            } catch (error: any) {
              Alert.alert(
                rtl ? 'خطأ' : 'Error',
                error.message || (rtl ? 'فشل في مغادرة العائلة' : 'Failed to leave family')
              );
            }
          },
        },
      ]
    );
  };

  const displayName = family?.name || authFamily?.name || '';
  const inviteCode = family?.invite_code || authFamily?.invite_code || '';
  const memberCount = members.length || authFamily?.member_count || 0;

  if (familyLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.gold[600], Colors.gold[800]] : [Colors.gold[400], Colors.gold[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.headerNav, rtl && styles.headerNavRTL]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronIcon size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.familyInfoCenter}>
            <Animated.View entering={ZoomIn.duration(500).delay(200)} style={styles.familyIconLarge}>
              <Users size={36} color={Colors.white} />
            </Animated.View>
            <Text style={[styles.familyName, { fontFamily: getFont('bold') }]}>
              {displayName}
            </Text>
            <View style={styles.memberBadge}>
              <Heart size={14} color={Colors.gold[100]} />
              <Text style={[styles.memberCount, { fontFamily: getFont('medium') }]}>
                {memberCount} {rtl ? 'أعضاء' : 'members'}
              </Text>
            </View>
          </View>

          <Sparkles size={18} color={Colors.white} style={styles.headerSparkle} />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Family Code Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary[100] }]}>
              <Shield size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'رمز العائلة' : 'Family Code'}
            </Text>
          </View>

          <View style={[styles.codeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.codeContainer, { backgroundColor: isDark ? Colors.slate[800] : Colors.slate[100] }, rtl && styles.rowReverse]}>
              <Text style={[styles.codeText, { color: theme.text, fontFamily: getFont('bold') }]}>
                {inviteCode || '---'}
              </Text>
              <TouchableOpacity onPress={handleCopyCode}>
                <LinearGradient
                  colors={[Colors.primary[400], Colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.copyButton}
                >
                  <Copy size={18} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleInvite} activeOpacity={0.9}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.primary[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.inviteButton, rtl && styles.rowReverse]}
              >
                <Share2 size={20} color={Colors.white} />
                <Text style={[styles.inviteButtonText, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'دعوة أعضاء' : 'Invite Members'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Members Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.section}>
          <View style={[styles.sectionHeader, rtl && styles.sectionHeaderRTL]}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
              <Users size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
              {rtl ? 'الأعضاء' : 'Members'}
            </Text>
            <TouchableOpacity style={styles.addMemberButton}>
              <UserPlus size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.membersCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {membersLoading ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} style={{ padding: 24 }} />
            ) : members.map((member, index) => {
              const role = roles[member.role] || roles.member;
              const memberName = member.full_name || member.user_id?.slice(0, 8) || 'Unknown';
              return (
                <TouchableOpacity
                  key={member.user_id || index}
                  style={[
                    styles.memberItem,
                    rtl && styles.rowReverse,
                    index !== members.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                  ]}
                >
                  <View style={styles.memberAvatarContainer}>
                    <LinearGradient
                      colors={member.role === 'admin' ? [Colors.gold[400], Colors.gold[600]] : [Colors.primary[400], Colors.primary[600]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.memberAvatar}
                    >
                      <Text style={[styles.memberAvatarText, { fontFamily: getFont('bold') }]}>
                        {memberName.charAt(0)}
                      </Text>
                    </LinearGradient>
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Crown size={10} color={Colors.gold[600]} />
                      </View>
                    )}
                  </View>
                  <View style={[styles.memberInfo, rtl && styles.memberInfoRTL]}>
                    <Text style={[styles.memberName, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                      {memberName}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: role.bgColor }]}>
                      <Text style={[styles.roleText, { color: role.color, fontFamily: getFont('medium') }]}>
                        {rtl ? role.labelAr : role.label}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.memberAction, { backgroundColor: theme.inputBackground }]}>
                    <Settings size={16} color={theme.icon} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
          <TouchableOpacity
            onPress={handleLeaveFamily}
            activeOpacity={0.9}
            style={styles.dangerCard}
          >
            <LinearGradient
              colors={[Colors.error + 'DD', Colors.error]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.dangerContent, rtl && styles.rowReverse]}
            >
              <View style={styles.dangerIcon}>
                <LogOut size={22} color={Colors.white} />
              </View>
              <Text style={[styles.dangerText, { fontFamily: getFont('semibold') }]}>
                {rtl ? 'مغادرة العائلة' : 'Leave Family'}
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: 20,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerNavRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyInfoCenter: {
    alignItems: 'center',
  },
  familyIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  familyName: {
    fontSize: 24,
    color: Colors.white,
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.white,
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
    flex: 1,
  },
  addMemberButton: {
    padding: 8,
  },

  // Code Card
  codeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  codeText: {
    fontSize: 18,
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  inviteButtonText: {
    fontSize: 16,
    color: Colors.white,
  },

  // Members
  membersCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    color: Colors.white,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gold[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberInfoRTL: {
    alignItems: 'flex-end',
  },
  memberName: {
    fontSize: 16,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
  },
  memberAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Danger
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
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 16,
    color: Colors.white,
  },
});
