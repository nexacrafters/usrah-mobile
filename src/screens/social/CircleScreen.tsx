/**
 * Circle Screen (route: "Circle")
 * The private family social feed — members share posts with the family.
 * Backed by the real /social/posts API. No mock data.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/ui/Avatar';
import {getCurrentFamilyId, useAuthStore} from '../../store/authStore';
import {showAlert} from '../../store/dialogStore';
import socialService, {Post, ReactionType} from '../../services/api/social.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {formatRelativeTime, sumReactions} from './socialUtils';

export default function CircleScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const currentUser = useAuthStore((s) => s.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [composer, setComposer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasFamily = !!getCurrentFamilyId();

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setPosts([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await socialService.listPosts();
        setPosts(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('social.couldntLoad'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts]),
  );

  const handlePost = useCallback(async () => {
    const content = composer.trim();
    if (!content) {
      void showAlert({title: t('social.emptyPostTitle'), message: t('social.emptyPostBody')});
      return;
    }
    if (!getCurrentFamilyId()) {
      void showAlert({title: t('social.noFamilyAlertTitle'), message: t('social.noFamilyAlertBody')});
      return;
    }
    setSubmitting(true);
    try {
      await socialService.createPost({content});
      setComposer('');
      await loadPosts(true);
    } catch (e) {
      void showAlert({
        title: t('social.couldntPostTitle'),
        message: e instanceof Error ? e.message : t('social.couldntPostBody'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [composer, loadPosts, t]);

  /** Optimistically toggle the "love" reaction, then sync with the server. */
  const handleReact = useCallback(
    async (post: Post, type: ReactionType = 'love') => {
      const had = post.user_reaction === type;
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id) return p;
          const summary = {...p.reactions_summary};
          const current = summary[type] ?? 0;
          if (had) {
            const next = current - 1;
            if (next <= 0) delete summary[type];
            else summary[type] = next;
            return {...p, user_reaction: null, reactions_summary: summary};
          }
          // Remove previous different reaction from summary
          if (p.user_reaction) {
            const prevCount = summary[p.user_reaction] ?? 0;
            if (prevCount - 1 <= 0) delete summary[p.user_reaction];
            else summary[p.user_reaction] = prevCount - 1;
          }
          summary[type] = current + 1;
          return {...p, user_reaction: type, reactions_summary: summary};
        }),
      );
      try {
        await socialService.addReaction(post.id, type);
      } catch (e) {
        // Revert by reloading on failure
        void showAlert({
          title: t('social.couldntReactTitle'),
          message: e instanceof Error ? e.message : '',
        });
        loadPosts(true);
      }
    },
    [loadPosts, t],
  );

  const openComments = useCallback(
    (postId: string) => {
      navigation.navigate('Post', {id: postId});
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({item}: ListRenderItemInfo<Post>) => {
      const reactionCount = sumReactions(item.reactions_summary);
      const liked = !!item.user_reaction;
      const authorName = item.is_anonymous
        ? t('social.anonymous')
        : item.author?.full_name;
      const avatarSource =
        !item.is_anonymous && item.author?.avatar
          ? {uri: item.author.avatar}
          : undefined;

      return (
        <View style={styles.card}>
          {item.is_pinned && (
            <View style={styles.pinnedRow}>
              <Icon name="pin" size={14} color={colors.gold[600]} />
              <Text style={styles.pinnedText}>{t('social.pinned')}</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <Avatar source={avatarSource} name={authorName} size="medium" />
            <View style={styles.headerText}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              <Text style={styles.timeText}>
                {formatRelativeTime(item.created, t)}
              </Text>
            </View>

            {item.is_sisters_only && (
              <View style={[styles.tag, styles.tagSisters]}>
                <Text style={styles.tagTextSisters}>
                  {t('social.sistersOnly')}
                </Text>
              </View>
            )}
            {item.is_brothers_only && (
              <View style={[styles.tag, styles.tagBrothers]}>
                <Text style={styles.tagTextBrothers}>
                  {t('social.brothersOnly')}
                </Text>
              </View>
            )}
          </View>

          {!!item.content && <Text style={styles.content}>{item.content}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReact(item)}
              activeOpacity={0.7}>
              <Icon
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? colors.islamic.love : colors.text.secondary}
              />
              <Text
                style={[styles.actionText, liked && styles.actionTextActive]}>
                {reactionCount > 0
                  ? reactionCount
                  : t('social.like')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openComments(item.id)}
              activeOpacity={0.7}>
              <Icon
                name="comment-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.actionText}>
                {item.comments_count > 0
                  ? item.comments_count
                  : t('social.comment')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleReact, openComments, t],
  );

  const renderComposer = () => (
    <View style={styles.composer}>
      <Avatar
        source={currentUser?.avatar ? {uri: currentUser.avatar} : undefined}
        name={currentUser?.full_name}
        size="small"
      />
      <View style={styles.composerBody}>
        <TextInput
          style={styles.composerInput}
          value={composer}
          onChangeText={setComposer}
          placeholder={t('social.composerPlaceholder')}
          placeholderTextColor={colors.text.tertiary}
          multiline
          editable={!submitting}
        />
        <TouchableOpacity
          style={[
            styles.composerButton,
            (!composer.trim() || submitting) && styles.composerButtonDisabled,
          ]}
          onPress={handlePost}
          disabled={!composer.trim() || submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.composerButtonText}>{t('social.post')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBody = () => {
    if (!hasFamily) {
      return (
        <View style={styles.centered}>
          <Icon
            name="account-group-outline"
            size={56}
            color={colors.slate[400]}
          />
          <Text style={styles.emptyTitle}>{t('social.noFamilyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('social.noFamilyBody')}</Text>
        </View>
      );
    }
    if (loading && posts.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptySubtitle}>{t('social.loading')}</Text>
        </View>
      );
    }
    if (error && posts.length === 0) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyTitle}>{t('social.couldntLoad')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadPosts()}>
            <Text style={styles.retryText}>{t('social.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderComposer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPosts(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Icon
              name="image-multiple-outline"
              size={48}
              color={colors.slate[300]}
            />
            <Text style={styles.emptyTitle}>{t('social.noPostsTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('social.noPostsBody')}</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('social.title')} subtitle={t('social.subtitle')} />
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
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
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[4],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[2],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  // Composer
  composer: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  composerBody: {
    flex: 1,
    gap: spacing[3],
  },
  composerInput: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  composerButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerButtonDisabled: {
    backgroundColor: colors.slate[300],
  },
  composerButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  // Post card
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  pinnedText: {
    ...typography.caption,
    color: colors.gold[600],
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  timeText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  tag: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  tagSisters: {
    backgroundColor: colors.sistersCircle.light,
  },
  tagTextSisters: {
    ...typography.labelSmall,
    color: colors.sistersCircle.dark,
  },
  tagBrothers: {
    backgroundColor: colors.brothersCircle.light,
  },
  tagTextBrothers: {
    ...typography.labelSmall,
    color: colors.brothersCircle.dark,
  },
  content: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing[3],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[6],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  actionTextActive: {
    color: colors.islamic.love,
  },
});
