/**
 * Recipe Detail Screen - Premium Design
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Bookmark,
  Star,
  Check,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, isRTL as checkRTL } from '../../../utils/fonts';
import { useRecipe, useSaveRecipe, useUnsaveRecipe, useRateRecipe } from '../../../hooks/queries/useRecipes';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  const [currentStep, setCurrentStep] = useState(0);
  const [isCooking, setIsCooking] = useState(false);

  // API hooks
  const { data: recipe, isLoading } = useRecipe(id || '');
  const saveRecipe = useSaveRecipe();
  const unsaveRecipe = useUnsaveRecipe();
  const rateRecipe = useRateRecipe();

  const isSaved = recipe?.is_saved || false;
  const isLiked = recipe?.user_rating ? recipe.user_rating > 0 : false;

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: rtl
          ? `جرب وصفة ${recipe.title}: ${recipe.description || ''}`
          : `Try this recipe: ${recipe.title} - ${recipe.description || ''}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!recipe || !id) return;
    try {
      if (isSaved) {
        await unsaveRecipe.mutateAsync(id);
      } else {
        await saveRecipe.mutateAsync(id);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!recipe || !id) return;
    try {
      await rateRecipe.mutateAsync({
        recipeId: id,
        rating: isLiked ? 0 : 5,
      });
    } catch (error) {
      console.error('Rate error:', error);
    }
  };

  // Get difficulty style
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { color: Colors.success, label: rtl ? 'سهل' : 'Easy', emoji: '😊' };
      case 'hard': return { color: Colors.error, label: rtl ? 'صعب' : 'Hard', emoji: '💪' };
      default: return { color: Colors.warning, label: rtl ? 'متوسط' : 'Medium', emoji: '🤔' };
    }
  };

  if (isLoading || !recipe) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold[500]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {rtl ? 'جاري تحميل الوصفة...' : 'Loading recipe...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructionsList = Array.isArray(recipe.instructions) ? recipe.instructions :
    (typeof recipe.instructions === 'string' ? recipe.instructions.split('\n').filter(Boolean) : []);
  const diffStyle = getDifficultyStyle(recipe.difficulty);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[Colors.gold[300], Colors.gold[500]]}
              style={styles.heroImage}
            >
              <ChefHat size={64} color={Colors.white} />
            </LinearGradient>
          )}

          {/* Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <BackIcon size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color={Colors.white} />
          </TouchableOpacity>

          {/* Difficulty Badge */}
          <View style={[styles.difficultyBadge, { backgroundColor: diffStyle.color }]}>
            <Text style={styles.difficultyEmoji}>{diffStyle.emoji}</Text>
            <Text style={[styles.difficultyText, { fontFamily: getFont('semibold') }]}>{diffStyle.label}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Title Section */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.titleSection}>
            <Text style={[styles.recipeName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {recipe.title}
            </Text>
            {recipe.description && (
              <Text style={[styles.recipeDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                {recipe.description}
              </Text>
            )}

            {/* Author & Rating */}
            <View style={[styles.metaRow, rtl && styles.rowReverse]}>
              {recipe.created_by_name && (
                <View style={[styles.authorBadge, { backgroundColor: Colors.primary[100] }]}>
                  <ChefHat size={14} color={Colors.primary[600]} />
                  <Text style={[styles.authorText, { color: Colors.primary[600], fontFamily: getFont('medium') }]}>
                    {recipe.created_by_name}
                  </Text>
                </View>
              )}
              <View style={[styles.ratingBadge, { backgroundColor: Colors.gold[100] }, rtl && styles.rowReverse]}>
                <Star size={14} color={Colors.gold[600]} fill={Colors.gold[600]} />
                <Text style={[styles.ratingText, { color: Colors.gold[600], fontFamily: getFont('bold') }]}>
                  {recipe.average_rating?.toFixed(1) || '0.0'}
                </Text>
                <Text style={[styles.reviewsText, { color: Colors.gold[500], fontFamily: getFont('regular') }]}>
                  ({recipe.rating_count || 0})
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)} style={[styles.statsRow, rtl && styles.rowReverse]}>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <LinearGradient colors={[Colors.primary[100], Colors.primary[50]]} style={styles.statIconBox}>
                <Clock size={20} color={Colors.primary[600]} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
                {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'دقيقة' : 'min'}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <LinearGradient colors={[Colors.gold[100], Colors.gold[50]]} style={styles.statIconBox}>
                <Users size={20} color={Colors.gold[600]} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
                {recipe.servings || 4}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'حصص' : 'servings'}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <LinearGradient colors={[Colors.sisters[100], Colors.sisters[50]]} style={styles.statIconBox}>
                <Flame size={20} color={Colors.sisters[600]} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: theme.text, fontFamily: getFont('bold') }]}>
                {diffStyle.label}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'الصعوبة' : 'difficulty'}
              </Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[styles.actionsRow, rtl && styles.rowReverse]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isLiked ? Colors.error + '20' : theme.card, borderColor: isLiked ? Colors.error : theme.cardBorder }]}
              onPress={handleToggleLike}
              disabled={rateRecipe.isPending}
            >
              <Heart size={22} color={isLiked ? Colors.error : theme.textSecondary} fill={isLiked ? Colors.error : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isSaved ? Colors.gold[100] : theme.card, borderColor: isSaved ? Colors.gold[500] : theme.cardBorder }]}
              onPress={handleToggleSave}
              disabled={saveRecipe.isPending || unsaveRecipe.isPending}
            >
              <Bookmark size={22} color={isSaved ? Colors.gold[600] : theme.textSecondary} fill={isSaved ? Colors.gold[600] : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startCookingButton}
              onPress={() => setIsCooking(!isCooking)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.startCookingGradient, rtl && styles.rowReverse]}
              >
                {isCooking ? <Pause size={20} color={Colors.white} /> : <Play size={20} color={Colors.white} />}
                <Text style={[styles.startCookingText, { fontFamily: getFont('bold') }]}>
                  {isCooking ? (rtl ? 'إيقاف' : 'Pause') : (rtl ? 'ابدأ الطبخ' : 'Start Cooking')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Ingredients */}
          {ingredientsList.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(250)} style={styles.section}>
              <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
                <View style={[styles.sectionIconBox, { backgroundColor: Colors.success + '20' }]}>
                  <Sparkles size={18} color={Colors.success} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                  {rtl ? 'المكونات' : 'Ingredients'}
                </Text>
                <View style={[styles.sectionBadge, { backgroundColor: Colors.success + '15' }]}>
                  <Text style={[styles.sectionBadgeText, { color: Colors.success, fontFamily: getFont('semibold') }]}>
                    {ingredientsList.length}
                  </Text>
                </View>
              </View>
              <View style={[styles.ingredientsList, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {ingredientsList.map((ing, idx) => (
                  <View key={idx} style={[styles.ingredientItem, { borderBottomColor: theme.divider }, rtl && styles.rowReverse]}>
                    <View style={[styles.ingredientCheck, { backgroundColor: Colors.success + '15', borderColor: Colors.success }]}>
                      <Check size={12} color={Colors.success} />
                    </View>
                    <Text style={[styles.ingredientText, { color: theme.text, fontFamily: getFont('regular'), flex: 1, textAlign: getTextAlign() }]}>
                      {typeof ing === 'string' ? ing : (ing.name || ing.item || '')}
                    </Text>
                    {typeof ing !== 'string' && (ing.amount || ing.quantity) && (
                      <View style={[styles.ingredientAmount, { backgroundColor: Colors.primary[100] }]}>
                        <Text style={[styles.ingredientAmountText, { color: Colors.primary[600], fontFamily: getFont('semibold') }]}>
                          {ing.amount || ing.quantity}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Instructions */}
          {instructionsList.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.section}>
              <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
                <View style={[styles.sectionIconBox, { backgroundColor: Colors.gold[100] }]}>
                  <ChefHat size={18} color={Colors.gold[600]} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                  {rtl ? 'طريقة التحضير' : 'Instructions'}
                </Text>
                <View style={[styles.sectionBadge, { backgroundColor: Colors.gold[100] }]}>
                  <Text style={[styles.sectionBadgeText, { color: Colors.gold[600], fontFamily: getFont('semibold') }]}>
                    {instructionsList.length} {rtl ? 'خطوة' : 'steps'}
                  </Text>
                </View>
              </View>
              {instructionsList.map((inst, idx) => {
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.instructionCard,
                      { backgroundColor: isActive ? Colors.primary[50] : theme.card, borderColor: isActive ? Colors.primary[500] : theme.cardBorder },
                    ]}
                    onPress={() => setCurrentStep(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.stepNumber,
                      { backgroundColor: isCompleted ? Colors.success : isActive ? Colors.primary[500] : theme.cardBorder }
                    ]}>
                      {isCompleted ? (
                        <Check size={14} color={Colors.white} />
                      ) : (
                        <Text style={[styles.stepNumberText, { color: isActive ? Colors.white : theme.textSecondary, fontFamily: getFont('bold') }]}>
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <Text style={[
                      styles.stepText,
                      { color: isActive ? Colors.primary[700] : theme.text, fontFamily: getFont(isActive ? 'medium' : 'regular'), textAlign: getTextAlign() }
                    ]}>
                      {typeof inst === 'string' ? inst : (inst.step || inst.description || '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },

  // Hero
  heroSection: {
    position: 'relative',
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  difficultyEmoji: {
    fontSize: 14,
  },
  difficultyText: {
    fontSize: 13,
    color: Colors.white,
  },

  // Content
  content: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  recipeName: {
    fontSize: 26,
    marginBottom: 8,
  },
  recipeDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  authorText: {
    fontSize: 13,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  reviewsText: {
    fontSize: 12,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startCookingButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingGradient: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startCookingText: {
    fontSize: 16,
    color: Colors.white,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
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
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 12,
  },

  // Ingredients
  ingredientsList: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  ingredientCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientText: {
    fontSize: 15,
  },
  ingredientAmount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ingredientAmountText: {
    fontSize: 12,
  },

  // Instructions
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
