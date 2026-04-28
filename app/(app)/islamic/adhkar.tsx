/**
 * Adhkar & Dhikr Screen - Arabic Only - Enhanced UI
 */
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Vibration, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Sun, Moon, Bed, Hand, RefreshCw, ChevronRight, Sparkles, Award, RotateCcw } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';

const { width } = Dimensions.get('window');

const adhkarCategories = [
  { id: 'morning', title: 'أذكار الصباح', icon: Sun, color: Colors.gold[500], bgColor: Colors.gold[100], count: 33 },
  { id: 'evening', title: 'أذكار المساء', icon: Moon, color: Colors.primary[500], bgColor: Colors.primary[100], count: 33 },
  { id: 'sleep', title: 'أذكار النوم', icon: Bed, color: Colors.sisters[500], bgColor: Colors.sisters[100], count: 15 },
  { id: 'prayer', title: 'أذكار بعد الصلاة', icon: Hand, color: Colors.accent[500], bgColor: Colors.accent[100], count: 12 },
];

const tasbihOptions = [
  { arabic: 'سبحان الله', target: 33 },
  { arabic: 'الحمد لله', target: 33 },
  { arabic: 'الله أكبر', target: 34 },
  { arabic: 'لا إله إلا الله', target: 100 },
];

export default function AdhkarScreen() {
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const fontFamily = 'Tajawal_500Medium';
  const fontBold = 'Tajawal_700Bold';

  const [selectedTasbih, setSelectedTasbih] = useState(0);
  const [count, setCount] = useState(0);
  const currentTasbih = tasbihOptions[selectedTasbih];

  const handleTap = () => {
    if (count < currentTasbih.target) {
      setCount(count + 1);
      Vibration.vibrate(10);
    }
    if (count + 1 >= currentTasbih.target) Vibration.vibrate([0, 100, 50, 100]);
  };

  const isComplete = count >= currentTasbih.target;
  const progress = (count / currentTasbih.target) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={[styles.title, { color: theme.text, fontFamily: fontBold }]}>الأذكار والتسبيح</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Tasbih Counter Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={isComplete ? [Colors.gold[500], Colors.gold[600]] : isDark ? [Colors.primary[600], Colors.primary[800]] : [Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tasbihCard}
          >
            {/* Header with Badge */}
            <View style={styles.tasbihHeader}>
              {isComplete && (
                <View style={styles.completeBadge}>
                  <Award size={14} color={Colors.gold[100]} />
                  <Text style={[styles.completeBadgeText, { fontFamily }]}>تم!</Text>
                </View>
              )}
              <Sparkles size={20} color="rgba(255,255,255,0.5)" />
            </View>

            {/* Arabic Text */}
            <Text style={[styles.tasbihArabic, { fontFamily: fontBold }]}>{currentTasbih.arabic}</Text>

            {/* Counter Button */}
            <TouchableOpacity style={styles.counterButton} onPress={handleTap} activeOpacity={0.8}>
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                style={styles.counterInner}
              >
                <Text style={[styles.counterNumber, { fontFamily: fontBold }]}>{count}</Text>
                <Text style={[styles.counterTarget, { fontFamily }]}>من {currentTasbih.target}</Text>
              </LinearGradient>
              {/* Progress Ring */}
              <View style={styles.progressRing}>
                <View style={[styles.progressRingFill, { width: `${progress}%` }]} />
              </View>
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={[styles.progressText, { fontFamily }]}>{Math.round(progress)}%</Text>
            </View>

            {/* Actions */}
            <View style={styles.tasbihActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => { setSelectedTasbih((prev) => (prev + 1) % tasbihOptions.length); setCount(0); }}>
                <ChevronRight size={18} color={Colors.white} />
                <Text style={[styles.actionText, { fontFamily }]}>التالي</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setCount(0)}>
                <Text style={[styles.actionText, { fontFamily }]}>إعادة</Text>
                <RotateCcw size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tasbih Selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.tasbihSelector}>
          {tasbihOptions.map((option, index) => {
            const isSelected = selectedTasbih === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tasbihOption,
                  {
                    backgroundColor: isSelected ? Colors.primary[100] : theme.card,
                    borderColor: isSelected ? Colors.primary[500] : theme.cardBorder,
                    borderWidth: isSelected ? 2 : 1
                  }
                ]}
                onPress={() => { setSelectedTasbih(index); setCount(0); }}
              >
                <Text style={[styles.tasbihOptionText, { color: isSelected ? Colors.primary[600] : theme.textSecondary, fontFamily: isSelected ? fontBold : fontFamily }]}>{option.arabic}</Text>
                {isSelected && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Categories Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: fontBold }]}>فئات الأذكار</Text>
          {adhkarCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Animated.View key={category.id} entering={FadeInUp.delay(350 + index * 50).duration(400)}>
                <TouchableOpacity
                  style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => router.push(`/islamic/adhkar/${category.id}`)}
                >
                  <ChevronRight size={20} color={theme.textTertiary} style={{ transform: [{ scaleX: -1 }] }} />
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryTitle, { color: theme.text, fontFamily: fontBold }]}>{category.title}</Text>
                    <View style={styles.categoryMeta}>
                      <View style={[styles.countBadge, { backgroundColor: category.bgColor }]}>
                        <Text style={[styles.categoryCount, { color: category.color, fontFamily }]}>{category.count} ذكر</Text>
                      </View>
                    </View>
                  </View>
                  <LinearGradient
                    colors={[category.bgColor, `${category.color}30`]}
                    style={styles.categoryIcon}
                  >
                    <Icon size={24} color={category.color} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 20 },

  // Tasbih Card
  tasbihCard: { borderRadius: 28, padding: 28, alignItems: 'center', marginBottom: 20 },
  tasbihHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  completeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  completeBadgeText: { fontSize: 12, color: Colors.white },
  tasbihArabic: { fontSize: 38, color: Colors.white, marginBottom: 28, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  counterButton: { width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2, justifyContent: 'center', alignItems: 'center', marginBottom: 24, position: 'relative' },
  counterInner: { width: '100%', height: '100%', borderRadius: width * 0.2, justifyContent: 'center', alignItems: 'center' },
  counterNumber: { fontSize: 56, color: Colors.white },
  counterTarget: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  progressRing: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressRingFill: { height: '100%', backgroundColor: Colors.gold[400], borderRadius: 3 },
  progressContainer: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', gap: 12, marginBottom: 24 },
  progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold[400], borderRadius: 4 },
  progressText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', minWidth: 40, textAlign: 'left' },
  tasbihActions: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16 },
  actionText: { fontSize: 15, color: Colors.white },

  // Tasbih Selector
  tasbihSelector: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  tasbihOption: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16, position: 'relative' },
  tasbihOptionText: { fontSize: 16 },
  selectedDot: { position: 'absolute', top: 6, left: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary[500] },

  // Categories Section
  categoriesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 16, textAlign: 'right' },
  categoryCard: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12, gap: 14 },
  categoryIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, alignItems: 'flex-end' },
  categoryTitle: { fontSize: 16, marginBottom: 6, textAlign: 'right' },
  categoryMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryCount: { fontSize: 12 },
});
