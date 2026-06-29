/**
 * Forum Screen
 * Community Q&A / discussions backed by the real /forum API.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/ui/Avatar';
import forumService, {
  ForumPost,
  ForumCategory,
  authorName,
  authorAvatar,
} from '../../services/api/forum.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatDate} from '../../utils/datetime';

/** Lightweight relative-time formatter (no extra deps). */
const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return formatDate(iso);
};

const ALL = '__all__';

export default function ForumScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(
    async (categoryId: string, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await forumService.listPosts(
          categoryId === ALL ? undefined : {category: categoryId},
        );
        setPosts(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('forum.couldntLoad'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await forumService.listCategories();
      setCategories(data);
    } catch {
      // Non-fatal: posts still load without category chips.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadPosts(selectedCategory);
    }, [loadCategories, loadPosts, selectedCategory]),
  );

  const onSelectCategory = (id: string) => {
    setSelectedCategory(id);
    loadPosts(id);
  };

  const goToPost = (id: string) => {
    try {
      navigation.navigate('ForumPost' as never, {id} as never);
    } catch {
      /* route not registered yet */
    }
  };

  const renderPost = ({item}: {item: ForumPost}) => {
    const name = authorName(item) || t('forum.anonymous');
    const avatar = authorAvatar(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => goToPost(item.id)}>
        <View style={styles.cardHeader}>
          <Avatar
            name={name}
            size="small"
            source={avatar ? {uri: avatar} : undefined}
          />
          <View style={styles.cardHeaderText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.metaRow}>
              {!!item.category_name && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText} numberOfLines={1}>
                    {item.category_name}
                  </Text>
                </View>
              )}
              <Text style={styles.timeText}>{timeAgo(item.created)}</Text>
            </View>
          </View>
          {item.is_pinned && (
            <Icon name="pin" size={16} color={colors.gold[600]} />
          )}
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.content && (
          <Text style={styles.postContent} numberOfLines={2}>
            {item.content}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon
              name={item.is_liked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.is_liked ? colors.error : colors.text.tertiary}
            />
            <Text style={styles.statText}>
              {t('forum.likes', {count: item.likes_count ?? 0})}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon
              name="comment-outline"
              size={16}
              color={colors.text.tertiary}
            />
            <Text style={styles.statText}>
              {t('forum.comments', {count: item.comments_count ?? 0})}
            </Text>
          </View>
          {item.is_locked && (
            <Icon name="lock" size={14} color={colors.text.tertiary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptySubtext}>{t('forum.loading')}</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyText}>{t('forum.couldntLoad')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadPosts(selectedCategory)}>
            <Text style={styles.retryText}>{t('forum.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="forum-outline"
          size={56}
          color={colors.text.tertiary}
        />
        <Text style={styles.emptyText}>{t('forum.noPostsTitle')}</Text>
        <Text style={styles.emptySubtext}>{t('forum.noPostsBody')}</Text>
      </View>
    );
  };

  const chips: Array<{id: string; label: string}> = [
    {id: ALL, label: t('forum.all')},
    ...categories.map((c) => ({id: c.id, label: c.name})),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('forum.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('forum.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.askBtn}
          activeOpacity={0.8}
          onPress={() => goToPost('')}>
          <Icon name="plus" size={18} color={colors.white} />
          <Text style={styles.askBtnText}>{t('forum.ask')}</Text>
        </TouchableOpacity>
      </View>

      {chips.length > 1 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={chips}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({item}) => {
              const active = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onSelectCategory(item.id)}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPosts(selectedCategory, true)}
            tintColor={colors.primary[500]}
          />
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
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  askBtnText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
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
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    maxWidth: 180,
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[20],
    flexGrow: 1,
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  cardHeaderText: {
    flex: 1,
  },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: 2,
  },
  categoryTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    maxWidth: 140,
  },
  categoryTagText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
  },
  timeText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  postTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  postContent: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
    gap: spacing[2],
  },
  emptyText: {
    ...typography.h5,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  retryBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
});
