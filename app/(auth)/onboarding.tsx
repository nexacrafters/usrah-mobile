/**
 * Onboarding Screen - Premium Animated Design
 */
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Users,
  MessageCircle,
  Wallet,
  Moon,
  ChefHat,
  Lock,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../constants/colors';
import { useAuthStore } from '../../store';
import { useThemeStore } from '../../store/themeStore';
import { getFont, isRTL as checkRTL } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

const getOnboardingSlides = (rtl: boolean) => [
  {
    id: '1',
    icon: Users,
    title: rtl ? 'مرحباً بكم في أسرة' : 'Welcome to Usrah',
    titleAr: 'أُسرة',
    description: rtl
      ? 'عالم عائلتك الخاص. تواصل وأدر وانمو معاً في مساحة آمنة ومحمية.'
      : "Your family's private universe. Connect, manage, and grow together in a secure space.",
    gradient: [Colors.primary[500], Colors.primary[700]],
    accentColor: Colors.primary[400],
  },
  {
    id: '2',
    icon: MessageCircle,
    title: rtl ? 'تواصل آمن' : 'Secure Messaging',
    titleAr: rtl ? 'Secure Messaging' : 'تواصل آمن',
    description: rtl
      ? 'رسائل مشفرة من طرف إلى طرف. شارك اللحظات والصور والملاحظات الصوتية بأمان تام.'
      : 'End-to-end encrypted messaging. Share moments, photos, and voice notes with complete privacy.',
    gradient: [Colors.accent[500], Colors.accent[700]],
    accentColor: Colors.accent[400],
  },
  {
    id: '3',
    icon: Lock,
    title: rtl ? 'دائرة الأخوات' : 'Sisters Circle',
    titleAr: rtl ? 'Sisters Circle' : 'دائرة الأخوات',
    description: rtl
      ? 'مساحة خاصة وآمنة حصرياً للنساء في عائلتك. محادثات ومشاركات بخصوصية كاملة.'
      : 'A private, secure space exclusively for the women in your family. Complete privacy guaranteed.',
    gradient: [Colors.sisters[500], Colors.sisters[700]],
    accentColor: Colors.sisters[400],
  },
  {
    id: '4',
    icon: Wallet,
    title: rtl ? 'إدارة المالية' : 'Family Finance',
    titleAr: rtl ? 'Family Finance' : 'إدارة المالية',
    description: rtl
      ? 'تتبع النفقات، حدد الميزانيات، واحسب الزكاة معاً كعائلة. إدارة مالية ذكية.'
      : 'Track expenses, set budgets, and calculate Zakat together. Smart family financial management.',
    gradient: [Colors.gold[500], Colors.gold[700]],
    accentColor: Colors.gold[400],
  },
  {
    id: '5',
    icon: Moon,
    title: rtl ? 'ميزات إسلامية' : 'Islamic Features',
    titleAr: rtl ? 'Islamic Features' : 'ميزات إسلامية',
    description: rtl
      ? 'مواقيت الصلاة، بوصلة القبلة، الأذكار اليومية، وتلاوة القرآن. كل ما تحتاجه في مكان واحد.'
      : 'Prayer times, Qibla compass, daily Adhkar, and Quran recitation. Everything you need in one place.',
    gradient: ['#1e3a5f', '#0f2744'],
    accentColor: Colors.gold[400],
  },
  {
    id: '6',
    icon: ChefHat,
    title: rtl ? 'وصفات العائلة' : 'Family Recipes',
    titleAr: rtl ? 'Family Recipes' : 'وصفات العائلة',
    description: rtl
      ? 'احفظ وشارك وصفات عائلتك الخاصة. توارث التقاليد من جيل إلى جيل.'
      : "Preserve and share your family's special recipes. Pass down traditions for generations.",
    gradient: [Colors.gold[600], Colors.gold[800]],
    accentColor: Colors.gold[400],
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const rtl = checkRTL();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { setIsOnboarded } = useAuthStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const onboardingSlides = getOnboardingSlides(rtl);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const handleGetStarted = () => {
    setIsOnboarded(true);
    router.replace('/(auth)/login');
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const currentSlide = onboardingSlides[currentIndex];

  const renderSlide = ({ item, index }: { item: typeof onboardingSlides[0]; index: number }) => {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slideGradient}
        >
          {/* Decorative elements */}
          <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: item.accentColor + '15' }]} />
          <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: item.accentColor + '10' }]} />
          <View style={[styles.decorCircle, styles.decorCircle3, { backgroundColor: item.accentColor + '08' }]} />

          {/* Icon Container */}
          <View style={styles.iconWrapper}>
            <View style={[styles.iconRing, { borderColor: item.accentColor + '30' }]}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Icon size={56} color={Colors.white} />
              </View>
            </View>
            <Sparkles size={24} color={item.accentColor} style={styles.sparkle} />
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={[styles.title, { fontFamily: getFont('bold') }]}>{item.title}</Text>
            <Text style={[styles.titleAr, { fontFamily: 'Tajawal_700Bold', color: item.accentColor }]}>
              {item.titleAr}
            </Text>
            <Text style={[styles.description, { fontFamily: getFont('regular') }]}>
              {item.description}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <View style={[styles.pagination, rtl && styles.paginationRTL]}>
        {onboardingSlides.map((slide, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => flatListRef.current?.scrollToIndex({ index })}
          >
            <View
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex
                    ? Colors.white
                    : 'rgba(255,255,255,0.3)',
                  width: index === currentIndex ? 28 : 10,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.slideCounter}>
        {currentIndex + 1} / {onboardingSlides.length}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        inverted={rtl}
        scrollEventThrottle={16}
      />

      {/* Bottom Section */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        {/* Pagination */}
        {renderPagination()}

        {/* Navigation Buttons */}
        <View style={[styles.bottomActions, rtl && styles.bottomActionsRTL]}>
          {/* Skip / Previous */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={currentIndex === 0 ? handleSkip : handlePrev}
          >
            {currentIndex === 0 ? (
              <Text style={[styles.secondaryButtonText, { fontFamily: getFont('medium') }]}>
                {rtl ? 'تخطي' : 'Skip'}
              </Text>
            ) : (
              <View style={[styles.navArrow, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                {rtl ? (
                  <ChevronRight size={22} color={Colors.white} />
                ) : (
                  <ChevronLeft size={22} color={Colors.white} />
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Next / Get Started */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
              style={styles.primaryButtonGradient}
            >
              {currentIndex === onboardingSlides.length - 1 ? (
                <View style={styles.getStartedContent}>
                  <Heart size={20} color={Colors.white} />
                  <Text style={[styles.primaryButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'ابدأ الآن' : 'Get Started'}
                  </Text>
                </View>
              ) : (
                <View style={styles.nextContent}>
                  <Text style={[styles.primaryButtonText, { fontFamily: getFont('semibold') }]}>
                    {rtl ? 'التالي' : 'Next'}
                  </Text>
                  {rtl ? (
                    <ChevronLeft size={22} color={Colors.white} />
                  ) : (
                    <ChevronRight size={22} color={Colors.white} />
                  )}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height: height,
  },
  slideGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative circles
  decorCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  decorCircle1: {
    width: 400,
    height: 400,
    top: -150,
    left: -100,
  },
  decorCircle2: {
    width: 300,
    height: 300,
    bottom: 100,
    right: -100,
  },
  decorCircle3: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
  },

  // Icon
  iconWrapper: {
    position: 'relative',
    marginBottom: 48,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Text
  textContent: {
    alignItems: 'center',
    paddingBottom: 180,
  },
  title: {
    fontSize: 30,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleAr: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },

  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // Pagination
  paginationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paginationRTL: {
    flexDirection: 'row-reverse',
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
  },
  slideCounter: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Tajawal_400Regular',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  bottomActionsRTL: {
    flexDirection: 'row-reverse',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  navArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    maxWidth: 200,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  primaryButtonText: {
    fontSize: 17,
    color: Colors.white,
  },
  getStartedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
