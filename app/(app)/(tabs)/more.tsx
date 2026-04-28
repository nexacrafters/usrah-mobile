/**
 * More Tab Screen - Arabic Only - Enhanced UI
 */
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChefHat, Calendar, Moon, Sun, Compass, Calculator, BookOpen, Hand, Sparkles, Settings, Users, Bell, Shield, HelpCircle, LogOut, ChevronLeft, Target, FileText, MessageSquare, Heart, Home, BookOpenCheck, AlertTriangle, Wallet, TrendingUp, PiggyBank, HandCoins, Receipt, Crown, Star,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';

// Base menu sections - items with femaleOnly will be filtered by gender
const baseMenuSections = [
  {
    title: 'القرية',
    items: [
      { id: 'village', name: 'شبكة القرية', icon: Home, color: Colors.primary[600], bgColor: Colors.primary[100], href: '/(app)/village', badge: 'جديد' },
      { id: 'emergency', name: 'الطوارئ', icon: AlertTriangle, color: '#ef4444', bgColor: '#fef2f2', href: '/(app)/emergency' },
      { id: 'halaqat', name: 'الحلقات', icon: BookOpenCheck, color: Colors.gold[600], bgColor: Colors.gold[100], href: '/(app)/halaqat', badge: 'جديد' },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'debts', name: 'الديون والسلف', icon: HandCoins, color: '#dc2626', bgColor: '#fef2f2', href: '/(app)/finance/debts' },
      { id: 'investments', name: 'الاستثمارات', icon: TrendingUp, color: '#059669', bgColor: '#ecfdf5', href: '/(app)/finance/investments' },
      { id: 'emergency', name: 'صندوق الطوارئ', icon: PiggyBank, color: '#7c3aed', bgColor: '#f5f3ff', href: '/(app)/finance/emergency-fund' },
      { id: 'budgets', name: 'الميزانيات', icon: Wallet, color: Colors.gold[600], bgColor: Colors.gold[100], href: '/(app)/finance/budgets' },
      { id: 'reports', name: 'التقارير المالية', icon: Receipt, color: '#0891b2', bgColor: '#ecfeff', href: '/(app)/finance/reports' },
    ],
  },
  {
    title: 'الميزات',
    items: [
      { id: 'recipes', name: 'الوصفات', icon: ChefHat, color: Colors.gold[500], bgColor: Colors.gold[100], href: '/(app)/recipes' },
      { id: 'calendar', name: 'التقويم', icon: Calendar, color: Colors.primary[500], bgColor: Colors.primary[100], href: '/(app)/calendar' },
      { id: 'forum', name: 'منتدى المجتمع', icon: MessageSquare, color: Colors.sisters[600], bgColor: Colors.sisters[100], href: '/(app)/forum' },
      { id: 'knowledge', name: 'مركز المعرفة', icon: Heart, color: '#ef4444', bgColor: '#fef2f2', href: '/(app)/knowledge' },
      { id: 'sisters-circle', name: 'دائرة الأخوات', icon: Sparkles, color: Colors.sisters[500], bgColor: Colors.sisters[100], href: '/(app)/sisters-circle', femaleOnly: true },
      { id: 'brothers-circle', name: 'حلقة الإخوة', icon: Users, color: Colors.primary[600], bgColor: Colors.primary[100], href: '/(app)/brothers-circle', maleOnly: true },
      { id: 'goals', name: 'أهداف الأسرة', icon: Target, color: '#8b5cf6', bgColor: '#f5f3ff', href: '/(app)/goals' },
      { id: 'documents', name: 'المستندات', icon: FileText, color: Colors.slate[600], bgColor: Colors.slate[100], href: '/(app)/documents' },
    ],
  },
  {
    title: 'إسلاميات',
    items: [
      { id: 'prayer', name: 'مواقيت الصلاة', icon: Moon, color: Colors.primary[600], bgColor: Colors.primary[100], href: '/(app)/islamic/prayer-times' },
      { id: 'qibla', name: 'اتجاه القبلة', icon: Compass, color: Colors.primary[500], bgColor: Colors.primary[100], href: '/(app)/islamic/qibla' },
      { id: 'zakat', name: 'حاسبة الزكاة', icon: Calculator, color: Colors.gold[600], bgColor: Colors.gold[100], href: '/(app)/islamic/zakat' },
      { id: 'quran', name: 'متابعة القرآن', icon: BookOpen, color: Colors.primary[700], bgColor: Colors.primary[100], href: '/(app)/islamic/quran' },
      { id: 'adhkar', name: 'الأذكار والتسبيح', icon: Hand, color: Colors.gold[500], bgColor: Colors.gold[100], href: '/(app)/islamic/adhkar' },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      { id: 'family', name: 'إعدادات الأسرة', icon: Users, color: Colors.slate[600], bgColor: Colors.slate[100], href: '/(app)/settings/family' },
      { id: 'notifications', name: 'الإشعارات', icon: Bell, color: Colors.slate[600], bgColor: Colors.slate[100], href: '/(app)/settings/notifications' },
      { id: 'privacy', name: 'الخصوصية والأمان', icon: Shield, color: Colors.slate[600], bgColor: Colors.slate[100], href: '/(app)/settings/privacy' },
      { id: 'settings', name: 'إعدادات التطبيق', icon: Settings, color: Colors.slate[600], bgColor: Colors.slate[100], href: '/(app)/settings' },
    ],
  },
];

export default function MoreScreen() {
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { user, family, logout } = useAuthStore();

  // Filter menu items based on user gender
  const isFemale = user?.gender === 'female';
  const isMale = user?.gender === 'male';
  const menuSections = baseMenuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if ((item as any).femaleOnly && !isFemale) return false;
      if ((item as any).maleOnly && !isMale) return false;
      return true;
    }),
  }));

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>المزيد</Text>
        </Animated.View>

        {/* Profile Card - Enhanced with Gradient */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isDark ? [Colors.primary[700], Colors.primary[900]] : [Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.profileContent}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.profileAvatar}
                >
                  <Text style={styles.profileAvatarText}>
                    {family?.name?.charAt(0) || user?.full_name?.charAt(0) || 'أ'}
                  </Text>
                </LinearGradient>
                <View style={styles.profileInfo}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName}>{family?.name || 'عائلتي'}</Text>
                    <View style={styles.premiumBadge}>
                      <Crown size={12} color={Colors.gold[500]} />
                    </View>
                  </View>
                  <Text style={styles.profilePhone}>{user?.phone || 'تعديل الملف الشخصي'}</Text>
                </View>
              </View>
              <View style={styles.profileArrow}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Dark Mode Toggle - Enhanced */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={[styles.toggleCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <LinearGradient
              colors={isDark ? [Colors.gold[100], Colors.gold[50]] : [Colors.slate[100], Colors.slate[50]]}
              style={styles.toggleIconBox}
            >
              {isDark ? <Moon size={20} color={Colors.gold[600]} /> : <Sun size={20} color={Colors.gold[600]} />}
            </LinearGradient>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>الوضع الليلي</Text>
              <Text style={[styles.toggleSubtext, { color: theme.textSecondary }]}>
                {isDark ? 'مفعّل' : 'غير مفعّل'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.slate[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
        </Animated.View>

        {/* Menu Sections - Enhanced with Animations */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View key={section.title} entering={FadeInUp.delay(200 + sectionIndex * 50).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === section.items.length - 1;
                const hasBadge = !!(item as any).badge;
                return (
                  <Link key={item.id} href={item.href as any} asChild>
                    <TouchableOpacity
                      style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}
                      activeOpacity={0.6}
                    >
                      <LinearGradient
                        colors={[item.bgColor, `${item.color}10`]}
                        style={styles.menuIconBox}
                      >
                        <Icon size={20} color={item.color} />
                      </LinearGradient>
                      <View style={styles.menuTextContainer}>
                        <Text style={[styles.menuName, { color: theme.text }]}>{item.name}</Text>
                        {hasBadge && (
                          <LinearGradient
                            colors={[Colors.primary[500], Colors.primary[600]]}
                            style={styles.badgeContainer}
                          >
                            <Sparkles size={10} color={Colors.white} />
                            <Text style={styles.badgeText}>{(item as any).badge}</Text>
                          </LinearGradient>
                        )}
                      </View>
                      <ChevronLeft size={18} color={theme.textTertiary} />
                    </TouchableOpacity>
                  </Link>
                );
              })}
            </View>
          </Animated.View>
        ))}

        {/* Help & Logout - Enhanced */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.section}>
          <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Link href="/(app)/help" asChild>
              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: theme.divider }]} activeOpacity={0.6}>
                <LinearGradient
                  colors={[Colors.slate[100], Colors.slate[50]]}
                  style={styles.menuIconBox}
                >
                  <HelpCircle size={20} color={Colors.slate[600]} />
                </LinearGradient>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuName, { color: theme.text }]}>المساعدة والدعم</Text>
                </View>
                <ChevronLeft size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.6}>
              <LinearGradient
                colors={['#fef2f2', '#fee2e2']}
                style={styles.menuIconBox}
              >
                <LogOut size={20} color="#ef4444" />
              </LinearGradient>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuName, { color: '#ef4444' }]}>تسجيل الخروج</Text>
              </View>
              <View style={{ width: 18 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Version Badge */}
        <Animated.View entering={FadeInUp.delay(550).duration(400)} style={styles.versionContainer}>
          <View style={[styles.versionBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Star size={14} color={Colors.gold[500]} />
            <Text style={[styles.version, { color: theme.textTertiary }]}>أسرة الإصدار ١.٠.٠</Text>
          </View>
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'right',
    marginVertical: 20,
  },
  profileCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  profileContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
  profileInfo: {
    flex: 1,
    marginRight: 16,
    alignItems: 'flex-end',
  },
  profileNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
  premiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhone: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'Tajawal_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  toggleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Tajawal_500Medium',
  },
  toggleSubtext: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Tajawal_700Bold',
    marginBottom: 10,
    textAlign: 'right',
    marginRight: 4,
  },
  sectionContent: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: 14,
    gap: 10,
  },
  menuName: {
    fontSize: 15,
    fontFamily: 'Tajawal_500Medium',
    textAlign: 'right',
  },
  badgeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.white,
    fontFamily: 'Tajawal_700Bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
  },
});
