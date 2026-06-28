/**
 * Post Screen (route: "Post", param { id })
 * Shows a single family post with its reactions, comments, and an
 * add-comment input. Backed by the real /social/posts/<id> API.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/ui/Avatar';
import socialService, {
  Comment,
  PostDetail,
  ReactionType,
} from '../../services/api/social.service';
import {showAlert} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatRelativeTime, sumReactions} from './socialUtils';

type PostRoute = RouteProp<{params: {id: string}}, 'params'>;

export default function PostScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<PostRoute>();
  const postId = route.params?.id;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!postId) {
      setError(t('social.postNotFound'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detail = await socialService.getPost(postId);
      setPost(detail);
      // Detail already embeds the first page of top-level comments.
      setComments(detail.comments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('social.couldntLoadPost'));
    } finally {
      setLoading(false);
    }
  }, [postId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReact = useCallback(
    async (type: ReactionType = 'love') => {
      if (!post) return;
      const had = post.user_reaction === type;
      setPost((prev) => {
        if (!prev) return prev;
        const summary = {...prev.reactions_summary};
        const current = summary[type] ?? 0;
        if (had) {
          const next = current - 1;
          if (next <= 0) delete summary[type];
          else summary[type] = next;
          return {...prev, user_reaction: null, reactions_summary: summary};
        }
        if (prev.user_reaction) {
          const prevCount = summary[prev.user_reaction] ?? 0;
          if (prevCount - 1 <= 0) delete summary[prev.user_reaction];
          else summary[prev.user_reaction] = prevCount - 1;
        }
        summary[type] = current + 1;
        return {...prev, user_reaction: type, reactions_summary: summary};
      });
      try {
        await socialService.addReaction(post.id, type);
      } catch (e) {
        void showAlert({title: t('social.couldntReactTitle'), message: e instanceof Error ? e.message : ''});
        load();
      }
    },
    [post, load, t],
  );

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      const comment = await socialService.addComment(postId, content);
      setComments((prev) => [...prev, comment]);
      setPost((prev) =>
        prev ? {...prev, comments_count: prev.comments_count + 1} : prev,
      );
      setDraft('');
    } catch (e) {
      void showAlert({
        title: t('social.couldntCommentTitle'),
        message: e instanceof Error ? e.message : '',
      });
    } finally {
      setSending(false);
    }
  }, [draft, postId, t]);

  const renderComment = useCallback(
    ({item}: ListRenderItemInfo<Comment>) => {
      const avatarSource = item.author?.avatar
        ? {uri: item.author.avatar}
        : undefined;
      return (
        <View style={styles.commentRow}>
          <Avatar source={avatarSource} name={item.author?.full_name} size="small" />
          <View style={styles.commentBody}>
            <View style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{item.author?.full_name}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
            <Text style={styles.commentTime}>
              {formatRelativeTime(item.created, t)}
            </Text>
          </View>
        </View>
      );
    },
    [t],
  );

  const renderHeader = () => {
    if (!post) return null;
    const reactionCount = sumReactions(post.reactions_summary);
    const liked = !!post.user_reaction;
    const authorName = post.is_anonymous
      ? t('social.anonymous')
      : post.author?.full_name;
    const avatarSource =
      !post.is_anonymous && post.author?.avatar
        ? {uri: post.author.avatar}
        : undefined;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Avatar source={avatarSource} name={authorName} size="medium" />
          <View style={styles.postHeaderText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={styles.timeText}>
              {formatRelativeTime(post.created, t)}
            </Text>
          </View>
        </View>

        {!!post.content && <Text style={styles.postContent}>{post.content}</Text>}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReact()}
            activeOpacity={0.7}>
            <Icon
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? colors.islamic.love : colors.text.secondary}
            />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {reactionCount > 0 ? reactionCount : t('social.like')}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Icon name="comment-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.actionText}>{post.comments_count}</Text>
          </View>
        </View>

        <Text style={styles.commentsTitle}>{t('social.commentsTitle')}</Text>
      </View>
    );
  };

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  } else if (error || !post) {
    body = (
      <View style={styles.centered}>
        <Icon name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={styles.emptyTitle}>{t('social.couldntLoadPost')}</Text>
        {!!error && <Text style={styles.emptySubtitle}>{error}</Text>}
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>{t('social.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyTitle}>{t('social.noCommentsTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('social.noCommentsBody')}</Text>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('social.commentsTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.flex}>{body}</View>

        {!loading && !error && !!post && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('social.commentPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!draft.trim() || sending}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Icon name="send" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
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
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  // Post card
  postCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
    marginBottom: spacing[2],
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  postHeaderText: {
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
  postContent: {
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
  commentsTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing[5],
  },
  // Comments
  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[1],
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  commentBody: {
    flex: 1,
    gap: spacing[1],
  },
  commentBubble: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  commentAuthor: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  commentText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  commentTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: spacing[2],
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.slate[300],
  },
});
