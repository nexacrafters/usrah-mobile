/**
 * Forum Post Screen
 * Full post detail with comments, add-comment box and like toggle.
 * Loaded from /forum/posts/<id>/.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/ui/Avatar';
import forumService, {
  ForumPostDetail,
  ForumComment,
  authorName,
  authorAvatar,
} from '../../services/api/forum.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatDate} from '../../utils/datetime';

type PostRoute = RouteProp<{params: {id: string}}, 'params'>;

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
  return formatDate(iso);
};

export default function ForumPostScreen() {
  const route = useRoute<PostRoute>();
  const {t} = useTranslation();
  const postId = route.params?.id;

  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!postId) {
      setError(t('forum.postNotFound'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.getPost(postId);
      setPost(data);
      setLiked(!!data.is_liked);
      setLikesCount(data.likes_count ?? 0);
      // Detail embeds comments, but fall back to the dedicated endpoint.
      if (Array.isArray(data.comments) && data.comments.length) {
        setComments(data.comments);
      } else {
        const list = await forumService.listComments(postId);
        setComments(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('forum.couldntLoadPost'));
    } finally {
      setLoading(false);
    }
  }, [postId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleLike = async () => {
    if (!postId || liking) return;
    // Optimistic update.
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    setLiking(true);
    try {
      const res = await forumService.likePost(postId);
      setLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      // Revert on failure.
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  const onSend = async () => {
    const content = draft.trim();
    if (!content || !postId || sending) return;
    setSending(true);
    try {
      const created = await forumService.addComment(postId, content);
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch {
      // keep draft so the user can retry
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.mutedText}>{t('forum.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Icon name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={styles.errorTitle}>{t('forum.couldntLoadPost')}</Text>
        {!!error && <Text style={styles.mutedText}>{error}</Text>}
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>{t('forum.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = authorName(post) || t('forum.anonymous');
  const avatar = authorAvatar(post);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Post header */}
          <View style={styles.postHeader}>
            <Avatar
              name={name}
              size="medium"
              source={avatar ? {uri: avatar} : undefined}
            />
            <View style={styles.postHeaderText}>
              <Text style={styles.authorName}>{name}</Text>
              <View style={styles.metaRow}>
                {!!post.category_name && (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      {post.category_name}
                    </Text>
                  </View>
                )}
                <Text style={styles.timeText}>{timeAgo(post.created)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postBody}>{post.content}</Text>

          {!!post.tags?.length && (
            <View style={styles.tagsRow}>
              {post.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onToggleLike}
              disabled={liking}>
              <Icon
                name={liked ? 'heart' : 'heart-outline'}
                size={22}
                color={liked ? colors.error : colors.text.secondary}
              />
              <Text style={styles.actionText}>
                {t('forum.likes', {count: likesCount})}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Icon
                name="comment-outline"
                size={22}
                color={colors.text.secondary}
              />
              <Text style={styles.actionText}>
                {t('forum.comments', {count: comments.length})}
              </Text>
            </View>
          </View>

          {/* Comments */}
          <Text style={styles.commentsTitle}>{t('forum.commentsTitle')}</Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsTitle}>
                {t('forum.noCommentsTitle')}
              </Text>
              <Text style={styles.mutedText}>{t('forum.noCommentsBody')}</Text>
            </View>
          ) : (
            comments.map((c) => {
              const cName = authorName(c) || t('forum.anonymous');
              const cAvatar = authorAvatar(c);
              return (
                <View key={c.id} style={styles.commentRow}>
                  <Avatar
                    name={cName}
                    size="small"
                    source={cAvatar ? {uri: cAvatar} : undefined}
                  />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{cName}</Text>
                      <Text style={styles.timeText}>{timeAgo(c.created)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Add comment */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t('forum.addCommentPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!post.is_locked}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!draft.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={onSend}
            disabled={!draft.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
    gap: spacing[2],
    padding: spacing[6],
  },
  scroll: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  postHeaderText: {flex: 1},
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
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  postBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  tagChip: {
    backgroundColor: colors.slate[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[6],
    paddingVertical: spacing[4],
    marginTop: spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  commentsTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[1],
  },
  emptyCommentsTitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  commentAuthor: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: '600',
  },
  commentContent: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    ...typography.body,
    color: colors.text.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.slate[300],
  },
  mutedText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h5,
    color: colors.text.secondary,
    marginTop: spacing[2],
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
