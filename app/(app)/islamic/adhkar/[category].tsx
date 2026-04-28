/**
 * Adhkar Category Detail Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronRight,
  Check,
  RotateCcw,
  Moon,
  Sun,
  Bed,
  Heart,
  Plane,
  Sparkles,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../../constants/colors';
import { useThemeStore } from '../../../../store/themeStore';
import { useAdhkar } from '../../../../hooks/queries/useIslamic';
import { getFont } from '../../../../utils/fonts';
import type { Adhkar } from '../../../../types/models';

const categoryConfig: Record<string, { title: string; icon: any; gradient: string[]; bgColor: string }> = {
  morning: { title: 'أذكار الصباح', icon: Sun, gradient: ['#f59e0b', '#ea580c'], bgColor: '#fffbeb' },
  evening: { title: 'أذكار المساء', icon: Moon, gradient: [Colors.primary[500], Colors.primary[700]], bgColor: Colors.primary[50] },
  sleep: { title: 'أذكار النوم', icon: Bed, gradient: ['#8b5cf6', '#6d28d9'], bgColor: '#f5f3ff' },
  prayer: { title: 'أذكار بعد الصلاة', icon: Heart, gradient: [Colors.gold[500], Colors.gold[700]], bgColor: Colors.gold[50] },
  travel: { title: 'أذكار السفر', icon: Plane, gradient: ['#14b8a6', '#0d9488'], bgColor: '#f0fdfa' },
};

export default function AdhkarCategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  // Track completed adhkar
  const [completedAdhkar, setCompletedAdhkar] = useState<Record<string, number>>({});

  // Fetch adhkar from API
  const { data: adhkarList = [], isLoading } = useAdhkar(
    category as 'morning' | 'evening' | 'sleep' | 'prayer' | 'travel'
  );

  const config = categoryConfig[category || ''] || categoryConfig.morning;
  const Icon = config.icon;

  const handleAdhkarPress = (adhkar: Adhkar) => {
    const currentCount = completedAdhkar[adhkar.id] || 0;
    if (currentCount < adhkar.repeat_count) {
      Vibration.vibrate(30);
      setCompletedAdhkar((prev) => ({
        ...prev,
        [adhkar.id]: currentCount + 1,
      }));
    }
  };

  const resetProgress = () => {
    Vibration.vibrate(50);
    setCompletedAdhkar({});
  };

  const totalCompleted = adhkarList.filter(
    (a) => (completedAdhkar[a.id] || 0) >= a.repeat_count
  ).length;

  const overallProgress = adhkarList.length > 0 ? (totalCompleted / adhkarList.length) * 100 : 0;

  const renderAdhkar = ({ item, index }: { item: Adhkar; index: number }) => {
    const count = completedAdhkar[item.id] || 0;
    const isComplete = count >= item.repeat_count;
    const progress = (count / item.repeat_count) * 100;

    return (
      <Animated.View entering={FadeInUp.duration(400).delay(200 + index * 80)}>
        <TouchableOpacity
          style={[
            styles.adhkarCard,
            { backgroundColor: isDark ? Colors.slate[800] : Colors.white, borderColor: isDark ? Colors.slate[700] : Colors.slate[200] },
            isComplete && styles.adhkarCardComplete,
          ]}
          onPress={() => handleAdhkarPress(item)}
          activeOpacity={0.85}
        >
          {/* Progress Bar at top */}
          <View style={styles.cardProgress}>
            <LinearGradient
              colors={isComplete ? [Colors.success, '#15803d'] : config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cardProgressFill, { width: `${progress}%` }]}
            />
          </View>

          <View style={styles.adhkarHeader}>
            <View style={[styles.countBadge, { backgroundColor: isComplete ? Colors.success : config.gradient[0] }]}>
              {isComplete ? (
                <Check size={18} color={Colors.white} />
              ) : (
                <Text style={[styles.countText, { fontFamily: getFont('bold') }]}>
                  {count}/{item.repeat_count}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.adhkarArabic, { color: isDark ? Colors.white : Colors.slate[800], fontFamily: getFont('bold') }]}>
            {item.arabic_text}
          </Text>

          {item.transliteration && (
            <Text style={[styles.adhkarTranslit, { color: isDark ? Colors.slate[400] : Colors.slate[500], fontFamily: getFont('medium') }]}>
              {item.transliteration}
            </Text>
          )}

          {item.translation && (
            <Text style={[styles.adhkarTranslation, { color: isDark ? Colors.slate[300] : Colors.slate[600], fontFamily: getFont('regular') }]}>
              {item.translation}
            </Text>
          )}

          {item.source && (
            <View style={[styles.sourceBox, { backgroundColor: isDark ? config.gradient[0] + '20' : config.bgColor }]}>
              <Text style={[styles.adhkarReference, { color: config.gradient[0], fontFamily: getFont('medium') }]}>
                {item.source}
              </Text>
            </View>
          )}

          {item.reward && (
            <LinearGradient
              colors={isDark ? [config.gradient[0] + '30', config.gradient[1] + '20'] : [config.bgColor, config.bgColor]}
              style={styles.benefitBox}
            >
              <Sparkles size={16} color={config.gradient[0]} />
              <Text style={[styles.benefitText, { color: config.gradient[0], fontFamily: getFont('regular') }]}>
                {item.reward}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.slate[900] : config.bgColor }]} edges={['top']}>
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <Text style={[styles.title, { color: isDark ? Colors.white : Colors.slate[800], fontFamily: getFont('bold') }]}>
            {config.title}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronRight size={24} color={isDark ? Colors.white : Colors.slate[800]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.gradient[0]} />
          <Text style={[styles.loadingText, { color: isDark ? Colors.slate[400] : Colors.slate[600], fontFamily: getFont('medium') }]}>
            جاري تحميل الأذكار...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.slate[900] : theme.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
          <RotateCcw size={22} color={isDark ? Colors.white : Colors.slate[800]} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? Colors.white : Colors.slate[800], fontFamily: getFont('bold') }]}>
          {config.title}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronRight size={24} color={isDark ? Colors.white : Colors.slate[800]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Progress Card */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.progressSection}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          {/* Decorative Elements */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={styles.progressContent}>
            <Animated.View entering={ZoomIn.duration(400).delay(200)} style={styles.progressIconBox}>
              <Icon size={32} color={config.gradient[0]} />
            </Animated.View>

            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { fontFamily: getFont('medium') }]}>
                التقدم
              </Text>
              <Text style={[styles.progressValue, { fontFamily: getFont('bold') }]}>
                {totalCompleted} / {adhkarList.length}
              </Text>
            </View>

            <View style={styles.progressPercentBox}>
              <Text style={[styles.progressPercent, { fontFamily: getFont('bold') }]}>
                {overallProgress.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                entering={FadeInDown.duration(800).delay(400)}
                style={[styles.progressFill, { width: `${overallProgress}%` }]}
              />
            </View>
          </View>

          <Text style={[styles.encouragement, { fontFamily: getFont('medium') }]}>
            {overallProgress >= 100
              ? 'ما شاء الله! أكملت جميع الأذكار'
              : overallProgress >= 50
              ? 'أحسنت! استمر في الذكر'
              : 'اللهم أعنّي على ذكرك وشكرك'}
          </Text>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={adhkarList}
        renderItem={renderAdhkar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: config.bgColor }]}>
              <Icon size={48} color={config.gradient[0]} />
            </View>
            <Text style={[styles.emptyText, { color: isDark ? Colors.slate[400] : Colors.slate[600], fontFamily: getFont('medium') }]}>
              لا توجد أذكار في هذه الفئة
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  resetButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  loadingText: { fontSize: 16 },

  // Progress Section
  progressSection: { paddingHorizontal: 16, marginBottom: 16 },
  progressCard: { borderRadius: 24, padding: 24, overflow: 'hidden', position: 'relative' },
  decorCircle: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle1: { width: 120, height: 120, top: -40, left: -30 },
  decorCircle2: { width: 80, height: 80, bottom: -20, right: -20 },
  progressContent: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  progressIconBox: { width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginLeft: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  progressInfo: { flex: 1, alignItems: 'flex-end' },
  progressLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  progressValue: { fontSize: 28, color: Colors.white },
  progressPercentBox: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  progressPercent: { fontSize: 18, color: Colors.white },
  progressBarContainer: { padding: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, marginBottom: 16 },
  progressBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 8 },
  encouragement: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Adhkar Card
  adhkarCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  adhkarCardComplete: { opacity: 0.7 },
  cardProgress: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)' },
  cardProgressFill: { height: '100%' },
  adhkarHeader: { flexDirection: 'row-reverse', justifyContent: 'flex-start', paddingHorizontal: 20, paddingTop: 20 },
  countBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center',
  },
  countText: { color: Colors.white, fontSize: 14 },
  adhkarArabic: { fontSize: 24, lineHeight: 42, textAlign: 'right', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  adhkarTranslit: { fontSize: 14, textAlign: 'right', paddingHorizontal: 20, marginBottom: 8, fontStyle: 'italic' },
  adhkarTranslation: { fontSize: 15, lineHeight: 24, textAlign: 'right', paddingHorizontal: 20, marginBottom: 16 },
  sourceBox: { marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-end', marginBottom: 12 },
  adhkarReference: { fontSize: 12 },
  benefitBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, margin: 20, marginTop: 4, padding: 16, borderRadius: 14 },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 22, textAlign: 'right' },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 20 },
  emptyIcon: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 17 },
});
