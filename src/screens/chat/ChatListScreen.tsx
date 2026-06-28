/**
 * Chat List Screen
 * WhatsApp-style conversation list
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Avatar from '../../components/ui/Avatar';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import chatService, {Conversation} from '../../services/api/chat.service';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await chatService.listConversations();
      setConversations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.loadConversationsError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  // Render the most recent message as a relative time descriptor.
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) {
      return '';
    }
    const then = new Date(timestamp).getTime();
    if (Number.isNaN(then)) {
      return '';
    }
    const diffMinutes = Math.floor((Date.now() - then) / 60000);
    if (diffMinutes < 1) {
      return t('chat.timeAgoMinutes', {count: 1});
    }
    if (diffMinutes < 60) {
      return t('chat.timeAgoMinutes', {count: diffMinutes});
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return t('chat.timeAgoHours', {count: diffHours});
    }
    return t('chat.timeAgoYesterday');
  };

  const getName = (conv: Conversation) =>
    conv.display_name || conv.name || t('chat.defaultMember');

  const filteredConversations = conversations.filter(conv =>
    getName(conv).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderConversation = ({item}: {item: Conversation}) => {
    const name = getName(item);
    const unread = item.unread_count || 0;
    const lastMessage = item.last_message?.content || '';
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate('ChatDetail' as never, {
            conversationId: item.public_id,
            name,
          } as never)
        }>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar
            name={name}
            size="large"
            source={item.display_avatar ? {uri: item.display_avatar} : undefined}
          />
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                unread > 0 && styles.conversationNameUnread,
              ]}
              numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={[
                styles.conversationTime,
                unread > 0 && styles.conversationTimeUnread,
              ]}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text
              style={[
                styles.lastMessage,
                unread > 0 && styles.lastMessageUnread,
              ]}
              numberOfLines={1}>
              {lastMessage}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('chat.familyChat')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('chat.searchConversations')}
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadConversations()}>
            <Text style={styles.retryText}>{t('chat.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.public_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadConversations(true)}
              colors={[colors.primary[500]]}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>
                {t('chat.noConversationsTitle')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('chat.noConversationsBody')}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          style={styles.fabGradient}>
          <Text style={styles.fabIcon}>✏️</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Islamic Quote */}
      <View style={styles.bottomQuote}>
        <Text style={styles.quoteArabic}>{t('chat.salamArabic')}</Text>
        <Text style={styles.quoteText}>{t('chat.spreadPeace')}</Text>
      </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  headerButton: {
    padding: spacing[2],
  },
  headerIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  conversationName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  conversationNameUnread: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  conversationTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  conversationTimeUnread: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing[2],
  },
  lastMessageUnread: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
  },
  retryText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
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
  },
  fab: {
    position: 'absolute',
    bottom: spacing[24],
    right: spacing[6],
    ...shadows.xl,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
  },
  bottomQuote: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    backgroundColor: colors.primary[50],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  quoteArabic: {
    fontSize: 16,
    color: colors.primary[700],
    marginBottom: spacing[1],
  },
  quoteText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
