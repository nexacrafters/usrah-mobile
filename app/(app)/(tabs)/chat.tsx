import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  I18nManager,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import { Search, Plus, Users, Lock, Sparkles, Wifi, WifiOff, MessageCircle, Filter, Shield, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import { getFont, getTextAlign, getWritingDirection } from '../../../utils/fonts';
import { useConversations, useUnreadCount } from '../../../hooks/queries/useChat';
import { useSocket, useConnectionStatus } from '../../../hooks/useSocket';
import type { Conversation } from '../../../types/models';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const { user, family } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Connect to WebSocket
  const { isConnected, isConnecting } = useSocket();
  const connectionStatus = useConnectionStatus();

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useConversations(family?.id || '');

  // Get unread count
  const { data: unreadData } = useUnreadCount();

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.name?.toLowerCase().includes(query) ||
      conv.last_message?.content?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Format relative time
  const formatTime = useCallback((dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('chat.justNow');
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return t('chat.yesterday');
    return date.toLocaleDateString();
  }, [t]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isSistersCircle = item.type === 'sisters_circle';
    const isGroup = item.type === 'group';
    const bgColor = isSistersCircle ? Colors.sisters[50] : theme.card;
    const borderColor = isSistersCircle ? Colors.sisters[200] : theme.cardBorder;
    const unread = item.unread_count || 0;

    // Get display name
    const displayName = item.name || (item.participants?.find(p => p.user_id !== user?.id)?.full_name) || t('chat.conversation');

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: bgColor, borderBottomColor: borderColor },
        ]}
        onPress={() => router.push(`/(app)/chat/${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isSistersCircle
                  ? Colors.sisters[200]
                  : isGroup
                  ? Colors.primary[100]
                  : Colors.gold[100],
              },
            ]}
          >
            {isSistersCircle ? (
              <Sparkles size={24} color={Colors.sisters[500]} />
            ) : isGroup ? (
              <Users size={24} color={Colors.primary[500]} />
            ) : (
              <Text
                style={[
                  styles.avatarText,
                  { color: Colors.gold[600] },
                ]}
              >
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          {item.is_online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.conversationName, { color: theme.text }]}>
                {displayName}
              </Text>
              {isSistersCircle && (
                <Lock size={14} color={Colors.sisters[500]} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={[styles.conversationTime, { color: theme.textTertiary }]}>
              {formatTime(item.last_message?.created_at || item.updated_at)}
            </Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                { color: unread > 0 ? theme.text : theme.textSecondary },
                unread > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.last_message?.content || t('chat.noMessages')}
            </Text>
            {unread > 0 && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: isSistersCircle ? Colors.sisters[500] : Colors.primary[500] },
                ]}
              >
                <Text style={styles.unreadCount}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Total unread count
  const totalUnread = (unreadData && 'total' in unreadData ? unreadData.total : null) || conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity style={[styles.newChatButton, { backgroundColor: Colors.primary[500] }]}>
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={[styles.headerCenter, isRTL && { alignItems: 'flex-end' }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('chat.title')}</Text>
          <View style={[styles.connectionBadge, {
            backgroundColor: connectionStatus === 'connected' ? Colors.success + '20' : connectionStatus === 'connecting' ? Colors.warning + '20' : Colors.error + '20'
          }]}>
            {connectionStatus === 'connected' ? (
              <Wifi size={12} color={Colors.success} />
            ) : connectionStatus === 'connecting' ? (
              <ActivityIndicator size={10} color={Colors.warning} />
            ) : (
              <WifiOff size={12} color={Colors.error} />
            )}
            <Text style={[styles.connectionText, {
              color: connectionStatus === 'connected' ? Colors.success : connectionStatus === 'connecting' ? Colors.warning : Colors.error
            }]}>
              {connectionStatus === 'connected' ? (isRTL ? 'متصل' : 'Online') : connectionStatus === 'connecting' ? (isRTL ? 'جاري الاتصال' : 'Connecting') : (isRTL ? 'غير متصل' : 'Offline')}
            </Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats Bar */}
      {totalUnread > 0 && (
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.statsBar, { backgroundColor: Colors.primary[500] }]}>
            <View style={styles.statsContent}>
              <MessageCircle size={18} color={Colors.white} />
              <Text style={styles.statsText}>
                {isRTL ? `لديك ${totalUnread} رسائل غير مقروءة` : `You have ${totalUnread} unread messages`}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            isRTL && styles.searchInputContainerRTL,
            { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
          ]}
        >
          <Search size={20} color={theme.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, textAlign: getTextAlign() }]}
            placeholder={t('chat.searchConversations')}
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]}>
            <Filter size={18} color={theme.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* E2E Encryption Notice */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)}>
        <LinearGradient
          colors={[Colors.primary[50], Colors.primary[100]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.encryptionNotice, isRTL && styles.encryptionNoticeRTL]}
        >
          <Shield size={16} color={Colors.primary[600]} />
          <Text style={[styles.encryptionText, { color: Colors.primary[700] }]}>
            {t('chat.encryptedMessages')}
          </Text>
          <Lock size={14} color={Colors.primary[500]} />
        </LinearGradient>
      </Animated.View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchQuery ? t('chat.noResults') : t('chat.noConversations')}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: Colors.primary[500] }]}>
              <Plus size={18} color={Colors.white} />
              <Text style={styles.emptyButtonText}>{t('chat.startConversation')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList<Conversation>
          data={filteredConversations as Conversation[]}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              colors={[Colors.primary[500]]}
              tintColor={Colors.primary[500]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: getFont('bold'),
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  connectionText: {
    fontSize: 11,
    fontFamily: getFont('medium'),
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 13,
    fontFamily: getFont('medium'),
    color: Colors.white,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getFont('regular'),
  },
  encryptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  encryptionNoticeRTL: {
    flexDirection: 'row-reverse',
  },
  encryptionText: {
    fontSize: 12,
    fontFamily: getFont('medium'),
  },
  listContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontFamily: getFont('semibold'),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontFamily: getFont('semibold'),
  },
  conversationTime: {
    fontSize: 12,
    fontFamily: getFont('regular'),
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: getFont('regular'),
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: getFont('medium'),
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: getFont('semibold'),
    color: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLeftRTL: {
    flexDirection: 'row-reverse',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatusRTL: {
    flexDirection: 'row-reverse',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getFont('medium'),
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: getFont('semibold'),
    color: Colors.white,
  },
});
