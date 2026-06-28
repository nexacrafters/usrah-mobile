/**
 * Recipes Screen
 * Pinterest-style grid backed by the real /recipes API.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Avatar from '../../components/ui/Avatar';
import {useRecipeStore, Recipe} from '../../store/recipeStore';
import {getCurrentFamilyId} from '../../store/authStore';
import recipeService from '../../services/api/recipe.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing[4] * 3) / 2;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: colors.islamic.mashallah,
  medium: colors.gold[500],
  hard: colors.error,
};

const CATEGORY_EMOJI: Record<string, string> = {
  'Main Course': '🍛',
  Dessert: '🍰',
  Snacks: '🥙',
  Soup: '🍲',
  Appetizer: '🥗',
  Drinks: '🥤',
};

export default function RecipesScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const formatTime = (minutes?: number) =>
    minutes ? t('recipes.minutesShort', {count: minutes}) : '—';
  const {
    recipes,
    isLoading,
    error,
    selectedCategory,
    setRecipes,
    setLoading,
    setError,
    setSelectedCategory,
  } = useRecipeStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipes = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setRecipes([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await recipeService.getRecipes();
        setRecipes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('recipes.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setRecipes, setLoading, setError, t],
  );

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes]),
  );

  // Build category chips from loaded data.
  const categories = [
    'All',
    ...Array.from(
      new Set(
        recipes
          .map((r) => r.category_name)
          .filter((c): c is string => !!c),
      ),
    ),
  ];

  const filteredRecipes =
    selectedCategory === 'All'
      ? recipes
      : recipes.filter((r) => r.category_name === selectedCategory);

  const difficultyLabel = (difficulty?: string) => {
    const d = (difficulty ?? '').toLowerCase();
    if (d === 'easy') return t('recipes.easy');
    if (d === 'medium') return t('recipes.mediumDiff');
    if (d === 'hard') return t('recipes.hard');
    return difficulty ?? '';
  };

  const renderRecipeCard = ({item}: {item: Recipe}) => {
    const difficultyColor =
      DIFFICULTY_COLORS[(item.difficulty ?? '').toLowerCase()] ??
      colors.slate[400];
    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => {
          try {
            navigation.navigate(
              'RecipeDetail' as never,
              {recipeId: item.public_id} as never,
            );
          } catch {
            /* route not registered yet */
          }
        }}>
        <View style={styles.recipeImage}>
          {item.cover_image ? (
            <Image
              source={{uri: item.cover_image}}
              style={styles.imagePlaceholder}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary[300], colors.primary[600]]}
              style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>
                {CATEGORY_EMOJI[item.category_name ?? ''] ?? '🍽️'}
              </Text>
            </LinearGradient>
          )}

          {item.is_halal && (
            <View style={styles.halalBadge}>
              <Text style={styles.halalText}>حلال</Text>
            </View>
          )}

          {!!item.difficulty && (
            <View
              style={[styles.difficultyBadge, {backgroundColor: difficultyColor}]}>
              <Text style={styles.difficultyText}>
                {difficultyLabel(item.difficulty)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {!!item.created_by_name && (
            <View style={styles.recipeAuthor}>
              <Avatar name={item.created_by_name} size="small" />
              <Text style={styles.authorName} numberOfLines={1}>
                {item.created_by_name}
              </Text>
            </View>
          )}

          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statText}>
                {formatTime(item.total_time_minutes)}
              </Text>
            </View>
            {!!item.servings && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statText}>{item.servings}</Text>
              </View>
            )}
          </View>

          <View style={styles.recipeFooter}>
            <View style={styles.rating}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {item.average_rating ?? '—'}
              </Text>
            </View>
            <Text style={styles.savesText}>
              {t('recipes.ratingCount', {count: item.ratings_count ?? 0})}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const hasFamily = !!getCurrentFamilyId();

  const renderEmpty = () => {
    if (!hasFamily) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyText}>{t('recipes.noFamilyTitle')}</Text>
          <Text style={styles.emptySubtext}>{t('recipes.noFamilyBody')}</Text>
        </View>
      );
    }
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyText}>{t('recipes.couldntLoad')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={styles.emptyText}>{t('recipes.noRecipesTitle')}</Text>
        <Text style={styles.emptySubtext}>{t('recipes.noRecipesBody')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('recipes.familyRecipes')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('recipes.recipeCount', {count: recipes.length})}
          </Text>
        </View>
      </View>

      {/* Categories */}
      {categories.length > 1 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item && styles.categoryTextActive,
                  ]}>
                  {item === 'All' ? t('recipes.all') : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Recipes Grid */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.public_id}
        numColumns={2}
        contentContainerStyle={styles.recipesGrid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          hasFamily ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRecipes(true)}
              tintColor={colors.primary[500]}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  categoriesContainer: {
    backgroundColor: colors.background.paper,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoriesList: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  categoryChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  recipesGrid: {
    padding: spacing[4],
    paddingBottom: spacing[20],
    flexGrow: 1,
  },
  gridRow: {
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  recipeCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  recipeImage: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  halalBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    backgroundColor: colors.islamic.mashallah,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  halalText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recipeInfo: {
    padding: spacing[3],
  },
  recipeTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
    minHeight: 40,
  },
  recipeAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  authorName: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  ratingIcon: {
    fontSize: 12,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  savesText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyText: {
    ...typography.h5,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
});
