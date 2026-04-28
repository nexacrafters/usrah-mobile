/**
 * Family Recipes Screen - Premium Design
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  I18nManager,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Clock,
  Users,
  Heart,
  ChefHat,
  Filter,
  Star,
  Sparkles,
  Flame,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useRecipes, useRecipeCategories, useRateRecipe } from '../../../hooks/queries/useRecipes';
import type { Recipe } from '../../../types/models';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

// Default categories (used when API categories not loaded)
const defaultCategories = [
  { id: 'all', name: 'All', nameAr: 'الكل', emoji: '🍽️' },
  { id: 'tunisian', name: 'Tunisian', nameAr: 'تونسي', emoji: '🇹🇳' },
  { id: 'breakfast', name: 'Breakfast', nameAr: 'فطور', emoji: '🌅' },
  { id: 'lunch', name: 'Lunch', nameAr: 'غداء', emoji: '🍲' },
  { id: 'dinner', name: 'Dinner', nameAr: 'عشاء', emoji: '🌙' },
  { id: 'dessert', name: 'Dessert', nameAr: 'حلويات', emoji: '🍰' },
  { id: 'ramadan', name: 'Ramadan', nameAr: 'رمضان', emoji: '🌙' },
];

export default function RecipesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const isRTL = I18nManager.isRTL;
  const { family } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ChevronBack = isRTL ? ChevronRight : ChevronLeft;

  // Build filters
  const filters = useMemo(() => ({
    family_id: family?.id || '',
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery.length >= 2 ? searchQuery : undefined,
  }), [family?.id, selectedCategory, searchQuery]);

  // Fetch recipes
  const {
    data: recipesData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useRecipes(filters);

  // Fetch categories
  const { data: apiCategories } = useRecipeCategories(family?.id || '');

  // Rate recipe mutation (for likes)
  const rateRecipe = useRateRecipe();

  // Flatten paginated recipes
  const recipes = recipesData?.pages.flatMap((page) => page.results) || [];

  // Use API categories or default
  const categories = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return [
        { id: 'all', name: 'All', nameAr: 'الكل', emoji: '🍽️' },
        ...apiCategories.map((c: any) => ({
          id: c.id || c.name,
          name: c.name,
          nameAr: c.name_ar || c.name,
          emoji: c.emoji || '🍴',
        })),
      ];
    }
    return defaultCategories;
  }, [apiCategories]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Toggle like (using rate recipe)
  const toggleLike = useCallback((recipeId: string, currentRating: number) => {
    const newRating = currentRating > 0 ? 0 : 5;
    rateRecipe.mutate({ recipeId, rating: newRating });
  }, [rateRecipe]);

  // Get difficulty color and gradient
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { color: Colors.success, gradient: [Colors.success, '#10b981'] as const };
      case 'medium': return { color: Colors.gold[500], gradient: [Colors.gold[400], Colors.gold[600]] as const };
      case 'hard': return { color: Colors.error, gradient: [Colors.error, '#dc2626'] as const };
      default: return { color: Colors.slate[500], gradient: [Colors.slate[400], Colors.slate[600]] as const };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header with Gradient */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={isDark ? [Colors.gold[600], Colors.gold[800]] : [Colors.gold[400], Colors.gold[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>

          <View style={[styles.header, isRTL && styles.rowReverse]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronBack size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                {isRTL ? 'وصفات العائلة' : 'Family Recipes'}
              </Text>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {recipes.length} {isRTL ? 'وصفة' : 'recipes'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/recipes/add' as any)}
            >
              <Plus size={22} color={Colors.gold[600]} />
            </TouchableOpacity>
          </View>

          {/* Hero Icon */}
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconRing}>
              <ChefHat size={32} color={Colors.white} />
            </View>
            <Sparkles size={16} color={Colors.gold[300]} style={styles.heroSparkle} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }, isRTL && styles.rowReverse]}>
          <View style={[styles.searchIconBox, { backgroundColor: Colors.gold[100] }]}>
            <Search size={18} color={Colors.gold[600]} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            placeholder={isRTL ? 'ابحث عن وصفة...' : 'Search recipes...'}
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: Colors.gold[100] }]}>
            <Filter size={18} color={Colors.gold[600]} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Categories */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {(isRTL ? [...categories].reverse() : categories).map((category, index) => {
            const isSelected = selectedCategory === category.id;
            return (
              <Animated.View key={category.id} entering={FadeInDown.duration(300).delay(200 + index * 50)}>
                <TouchableOpacity
                  style={[styles.categoryChip, { borderColor: isSelected ? Colors.gold[500] : theme.cardBorder }]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[Colors.gold[400], Colors.gold[600]]}
                      style={styles.categoryGradient}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[styles.categoryTextActive, { fontFamily: getFont('semibold') }]}>
                        {isRTL ? category.nameAr : category.name}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.categoryInner, { backgroundColor: theme.card }]}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[styles.categoryText, { color: theme.text, fontFamily: getFont('medium') }]}>
                        {isRTL ? category.nameAr : category.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Recipes Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold[500]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading recipes...'}
          </Text>
        </View>
      ) : recipes.length === 0 ? (
        <Animated.View entering={ZoomIn.duration(400)} style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: Colors.gold[100] }]}>
            <ChefHat size={48} color={Colors.gold[500]} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
            {isRTL ? 'لا توجد وصفات' : 'No recipes yet'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
            {isRTL ? 'أضف وصفتك الأولى للعائلة' : 'Add your first family recipe'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(app)/recipes/add' as any)}
          >
            <LinearGradient
              colors={[Colors.gold[400], Colors.gold[600]]}
              style={styles.emptyButtonGradient}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={[styles.emptyButtonText, { fontFamily: getFont('semibold') }]}>
                {isRTL ? 'أضف وصفة' : 'Add Recipe'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={recipes}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipesGrid}
          columnWrapperStyle={[styles.columnWrapper, isRTL && styles.rowReverse]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              colors={[Colors.gold[500]]}
              tintColor={Colors.gold[500]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ padding: 16 }} color={Colors.gold[500]} />
            ) : <View style={{ height: 100 }} />
          }
          renderItem={({ item: recipe, index }) => {
            const diffStyle = getDifficultyStyle(recipe.difficulty);
            return (
              <Animated.View entering={FadeInUp.duration(400).delay(index * 50)}>
                <TouchableOpacity
                  style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => router.push(`/(app)/recipes/${recipe.id}` as any)}
                  activeOpacity={0.9}
                >
                  {/* Recipe Image */}
                  <View style={styles.recipeImageContainer}>
                    <LinearGradient
                      colors={[Colors.gold[100], Colors.gold[200]]}
                      style={styles.recipeImage}
                    >
                      <ChefHat size={36} color={Colors.gold[500]} />
                    </LinearGradient>

                    {/* Difficulty Badge */}
                    <View style={[styles.difficultyBadge, { backgroundColor: diffStyle.color + '20' }]}>
                      <Flame size={10} color={diffStyle.color} />
                      <Text style={[styles.difficultyText, { color: diffStyle.color, fontFamily: getFont('semibold') }]}>
                        {recipe.difficulty === 'easy' ? (isRTL ? 'سهل' : 'Easy') :
                         recipe.difficulty === 'hard' ? (isRTL ? 'صعب' : 'Hard') :
                         (isRTL ? 'متوسط' : 'Medium')}
                      </Text>
                    </View>

                    {/* Like Button */}
                    <TouchableOpacity
                      style={[styles.likeButton, { backgroundColor: theme.card }]}
                      onPress={() => toggleLike(recipe.id, recipe.is_favorite ? 5 : 0)}
                    >
                      <Heart
                        size={16}
                        color={recipe.is_favorite ? Colors.error : theme.textSecondary}
                        fill={recipe.is_favorite ? Colors.error : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Recipe Info */}
                  <View style={[styles.recipeInfo, isRTL && styles.alignEnd]}>
                    <Text
                      style={[styles.recipeName, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}
                      numberOfLines={2}
                    >
                      {recipe.title}
                    </Text>

                    <Text style={[styles.recipeAuthor, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                      {recipe.created_by?.full_name || (isRTL ? 'العائلة' : 'Family')}
                    </Text>

                    {/* Rating */}
                    {recipe.cooked_history && recipe.cooked_history.length > 0 && (
                      <View style={[styles.ratingRow, isRTL && styles.rowReverse]}>
                        <Star size={12} color={Colors.gold[500]} fill={Colors.gold[500]} />
                        <Text style={[styles.ratingText, { color: theme.text, fontFamily: getFont('bold') }]}>
                          {(recipe.cooked_history.reduce((acc, h) => acc + (h.rating || 0), 0) / recipe.cooked_history.length).toFixed(1)}
                        </Text>
                        <Text style={[styles.reviewsText, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                          ({recipe.cooked_history.length})
                        </Text>
                      </View>
                    )}

                    {/* Meta Info */}
                    <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
                      <View style={[styles.metaItem, { backgroundColor: Colors.primary[100] }, isRTL && styles.rowReverse]}>
                        <Clock size={11} color={Colors.primary[600]} />
                        <Text style={[styles.metaText, { color: Colors.primary[600], fontFamily: getFont('medium') }]}>
                          {recipe.cook_time_minutes}m
                        </Text>
                      </View>
                      <View style={[styles.metaItem, { backgroundColor: Colors.gold[100] }, isRTL && styles.rowReverse]}>
                        <Users size={11} color={Colors.gold[600]} />
                        <Text style={[styles.metaText, { color: Colors.gold[600], fontFamily: getFont('medium') }]}>
                          {recipe.servings}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse' as const,
  },
  alignEnd: {
    alignItems: 'flex-end' as const,
  },

  // Header
  headerGradient: {
    paddingBottom: 24,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: 40,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  heroIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSparkle: {
    position: 'absolute',
    top: 0,
    right: width / 2 - 48,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginTop: -12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  categoryChip: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 10,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  categoryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
  },
  categoryTextActive: {
    fontSize: 13,
    color: Colors.white,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    color: Colors.white,
  },

  // Recipes Grid
  recipesGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // Recipe Card
  recipeCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  difficultyText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeAuthor: {
    fontSize: 11,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  reviewsText: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },
});
