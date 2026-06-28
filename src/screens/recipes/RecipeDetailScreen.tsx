/**
 * Recipe Detail Screen
 * Full recipe view loaded from /recipes/<id>/.
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {showAlert} from '../../store/dialogStore';
import Avatar from '../../components/ui/Avatar';
import {RecipeDetail, RecipeIngredient} from '../../store/recipeStore';
import recipeService from '../../services/api/recipe.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

type DetailRoute = RouteProp<{params: {recipeId: string}}, 'params'>;

/** Group ingredients by their `group` field (preserves order). */
const groupIngredients = (
  ingredients: RecipeIngredient[],
  defaultSection: string,
) => {
  const groups: Array<{section: string; items: RecipeIngredient[]}> = [];
  ingredients.forEach((ing) => {
    const section = ing.group || defaultSection;
    let bucket = groups.find((g) => g.section === section);
    if (!bucket) {
      bucket = {section, items: []};
      groups.push(bucket);
    }
    bucket.items.push(ing);
  });
  return groups;
};

const formatIngredient = (ing: RecipeIngredient) =>
  [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ').trim();

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const {t} = useTranslation();
  const recipeId = route.params?.recipeId;

  const formatTime = (minutes?: number) =>
    minutes ? t('recipes.minutesShort', {count: minutes}) : '—';

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!recipeId) {
      setError(t('recipes.recipeNotFound'));
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    recipeService
      .getRecipe(recipeId)
      .then((data) => {
        if (!active) {
          return;
        }
        setRecipe(data);
        setIsSaved(!!data.is_saved);
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : t('recipes.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [recipeId]);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleToggleSave = async () => {
    if (!recipeId) {
      return;
    }
    const previous = isSaved;
    setIsSaved(!previous); // optimistic
    try {
      const res = await recipeService.toggleSaveRecipe(recipeId);
      setIsSaved(res.saved);
    } catch (e) {
      setIsSaved(previous);
      void showAlert({
        title: t('recipes.couldNotSaveTitle'),
        message: e instanceof Error ? e.message : t('recipes.couldNotSaveBody'),
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>
          {error ?? t('recipes.recipeNotFound')}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>{t('recipes.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ingredientGroups = groupIngredients(
    recipe.ingredients ?? [],
    t('recipes.ingredients'),
  );
  const steps = [...(recipe.steps ?? [])].sort(
    (a, b) => a.step_number - b.step_number,
  );
  const tips = (recipe.notes ?? []).filter((n) => n.is_tip);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Image */}
      <View style={styles.headerImage}>
        {recipe.cover_image ? (
          <Image source={{uri: recipe.cover_image}} style={styles.imageFill} />
        ) : (
          <LinearGradient
            colors={[colors.primary[300], colors.primary[600]]}
            style={styles.imageFill}>
            <Text style={styles.placeholderEmoji}>🍛</Text>
          </LinearGradient>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleToggleSave}>
          <Text style={styles.saveIcon}>{isSaved ? '🔖' : '📑'}</Text>
        </TouchableOpacity>

        {recipe.is_halal && (
          <View style={styles.halalBadge}>
            <Text style={styles.halalText}>حلال {t('recipes.halalLabel')}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Title & Info */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          {!!recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          <View style={styles.authorSection}>
            <Avatar name={recipe.created_by?.full_name} size="medium" />
            <View style={styles.authorInfo}>
              <Text style={styles.authorLabel}>{t('recipes.recipeBy')}</Text>
              <Text style={styles.authorName}>
                {recipe.created_by?.full_name ?? t('recipes.unknown')}
              </Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {recipe.average_rating ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>
              {formatTime(recipe.prep_time_minutes)}
            </Text>
            <Text style={styles.statLabel}>{t('recipes.prep')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>
              {formatTime(recipe.cook_time_minutes)}
            </Text>
            <Text style={styles.statLabel}>{t('recipes.cook')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{recipe.servings ?? '—'}</Text>
            <Text style={styles.statLabel}>{t('recipes.servings')}</Text>
          </Card>
        </View>

        {/* Ingredients */}
        {ingredientGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recipes.ingredients')}</Text>
            {ingredientGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.ingredientGroup}>
                {ingredientGroups.length > 1 && (
                  <Text style={styles.ingredientGroupTitle}>
                    {group.section}
                  </Text>
                )}
                {group.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>
                      {formatIngredient(item)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recipes.instructions')}</Text>
            {steps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.stepItem,
                  completedSteps.includes(index) && styles.stepItemCompleted,
                ]}
                onPress={() => toggleStep(index)}>
                <View
                  style={[
                    styles.stepNumber,
                    completedSteps.includes(index) && styles.stepNumberCompleted,
                  ]}>
                  <Text
                    style={[
                      styles.stepNumberText,
                      completedSteps.includes(index) &&
                        styles.stepNumberTextCompleted,
                    ]}>
                    {completedSteps.includes(index) ? '✓' : step.step_number}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepText,
                    completedSteps.includes(index) && styles.stepTextCompleted,
                  ]}>
                  {step.instruction}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pro Tips */}
        {tips.length > 0 && (
          <Card variant="outlined" style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 {t('recipes.proTips')}</Text>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip.content}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Islamic Quote */}
        <Card variant="outlined" style={styles.quoteCard}>
          <Text style={styles.quoteArabic}>{t('recipes.quoteArabic')}</Text>
          <Text style={styles.quoteTranslation}>
            {t('recipes.quoteTranslation')}
          </Text>
          <Text style={styles.quoteReference}>
            {t('recipes.quoteReference')}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  errorEmoji: {
    fontSize: 56,
  },
  errorTitle: {
    ...typography.h5,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  retryButton: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  headerImage: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  imageFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 120,
  },
  backButton: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  saveButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  saveIcon: {
    fontSize: 20,
  },
  halalBadge: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    backgroundColor: colors.islamic.mashallah,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  halalText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  titleSection: {
    padding: spacing[6],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  authorInfo: {
    flex: 1,
  },
  authorLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.gold[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  ratingIcon: {
    fontSize: 16,
  },
  ratingText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  section: {
    padding: spacing[6],
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  ingredientGroup: {
    marginBottom: spacing[4],
  },
  ingredientGroupTitle: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginTop: spacing[2],
  },
  ingredientText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  stepItemCompleted: {
    opacity: 0.5,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberCompleted: {
    backgroundColor: colors.islamic.mashallah,
  },
  stepNumberText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    fontWeight: '700',
  },
  stepNumberTextCompleted: {
    color: colors.white,
  },
  stepText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
  },
  tipsCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    backgroundColor: colors.gold[50],
    borderColor: colors.gold[200],
  },
  tipsTitle: {
    ...typography.bodyMedium,
    color: colors.gold[800],
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  tipBullet: {
    ...typography.body,
    color: colors.gold[600],
    fontWeight: 'bold',
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  quoteCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  quoteArabic: {
    fontSize: 16,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  quoteTranslation: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  quoteReference: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
