/**
 * Chat Conversation Screen - Premium Design
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Send,
  Image,
  Mic,
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  Sparkles,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import { useConversation, useMessages, useMarkAsRead } from '../../../hooks/queries/useChat';
import { useChat, useTypingIndicator, usePresence } from '../../../hooks/useSocket';
import type { Message } from '../../../types/models';

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { user } = useAuthStore();
  const ChevronIcon = rtl ? ChevronRight : ChevronLeft;

  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading } = useConversation(id);

  // Fetch messages with pagination
  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(id);

  // Real-time chat hook
  const {
    messages: realtimeMessages,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    isConnected,
  } = useChat(id);

  // Typing indicator
  const { startTyping, stopTyping } = useTypingIndicator(id);

  // Mark as read mutation
  const markAsReadMutation = useMarkAsRead();

  // Get other participant IDs for presence tracking
  const otherParticipantIds = conversation?.participants
    ?.filter((p) => p.user_id !== user?.id)
    .map((p) => p.user_id) || [];

  // Track presence of other participants
  const presence = usePresence(otherParticipantIds);

  // Combine API messages with realtime messages
  const apiMessages = messagesData?.pages.flatMap((page) => page.results) || [];
  const allMessages = [...apiMessages, ...realtimeMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Remove duplicates
  const messages = allMessages.filter(
    (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
  );

  // Get display name and online status
  const otherParticipant = conversation?.participants?.find((p) => p.user_id !== user?.id);
  const displayName = conversation?.name || otherParticipant?.full_name || t('chat.conversation');
  const isOnline = otherParticipantIds.some((id) => presence[id]?.isOnline);

  // Mark messages as read when viewing
  useEffect(() => {
    if (id && messages.length > 0) {
      const unreadMessageIds = messages
        .filter((m) => m.sender_id !== user?.id && !m.read_at)
        .map((m) => m.id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
        markAsReadMutation.mutate(id);
      }
    }
  }, [id, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;

    sendMessage(messageText.trim());
    setMessageText('');
    stopTyping();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messageText, sendMessage, stopTyping]);

  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    if (text.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const isSending = item.id.startsWith('temp-');

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}
      >
        {isMe ? (
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messageBubble, styles.messageBubbleMe, isSending && { opacity: 0.7 }]}
          >
            <Text style={[styles.messageText, styles.messageTextMe, { fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {item.content}
            </Text>
            <View style={[styles.messageFooter, rtl && styles.messageFooterRTL]}>
              <Text style={[styles.messageTimeMe, { fontFamily: getFont('regular') }]}>
                {formatTime(item.created_at)}
              </Text>
              <View style={styles.readStatus}>
                {isSending ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                ) : item.read_at ? (
                  <CheckCheck size={14} color="rgba(255,255,255,0.9)" />
                ) : item.delivered_at ? (
                  <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
                ) : (
                  <Check size={14} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.messageBubble, styles.messageBubbleOther, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.messageText, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, { color: theme.textTertiary, fontFamily: getFont('regular') }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Typing indicator component
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={[styles.messageWrapper, styles.messageWrapperOther]}>
        <View style={[styles.typingBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.typingDots}>
            <Animated.View entering={FadeIn.duration(300).delay(0)} style={[styles.typingDot, { backgroundColor: Colors.primary[400] }]} />
            <Animated.View entering={FadeIn.duration(300).delay(150)} style={[styles.typingDot, { backgroundColor: Colors.primary[500] }]} />
            <Animated.View entering={FadeIn.duration(300).delay(300)} style={[styles.typingDot, { backgroundColor: Colors.primary[600] }]} />
          </View>
        </View>
      </View>
    );
  };

  if (conversationLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <LinearGradient
          colors={isDark ? [Colors.primary[700], Colors.primary[800]] : [Colors.primary[500], Colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={[styles.headerContent, rtl && styles.headerContentRTL]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronIcon size={24} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.userInfo, rtl && styles.userInfoRTL]}>
              <LinearGradient
                colors={[Colors.gold[400], Colors.gold[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={[styles.avatarText, { fontFamily: getFont('bold') }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={rtl && { alignItems: 'flex-end' }}>
                <Text style={[styles.userName, { fontFamily: getFont('bold') }]}>
                  {displayName}
                </Text>
                <View style={[styles.statusRow, rtl && styles.statusRowRTL]}>
                  {isOnline && <View style={styles.onlineDot} />}
                  <Text style={[styles.userStatus, { fontFamily: getFont('regular') }]}>
                    {typingUsers.length > 0
                      ? (rtl ? 'يكتب...' : 'typing...')
                      : isOnline
                        ? (rtl ? 'متصل الآن' : 'Online')
                        : (rtl ? 'غير متصل' : 'Offline')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.headerActions, rtl && styles.headerActionsRTL]}>
              <TouchableOpacity style={styles.headerAction}>
                <Phone size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <Video size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <MoreVertical size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            inverted={false}
            ListHeaderComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={{ padding: 16 }} color={Colors.primary[500]} />
              ) : null
            }
            ListFooterComponent={renderTypingIndicator}
          />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
          <View style={[styles.inputRow, rtl && styles.inputRowRTL]}>
            <TouchableOpacity style={[styles.attachButton, { backgroundColor: theme.inputBackground }]}>
              <Image size={22} color={theme.icon} />
            </TouchableOpacity>

            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: messageText.trim() ? Colors.primary[400] : theme.inputBorder }]}>
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                value={messageText}
                onChangeText={handleTextChange}
                placeholder={rtl ? 'اكتب رسالة...' : 'Type a message...'}
                placeholderTextColor={theme.placeholder}
                multiline
                maxLength={1000}
                writingDirection={getWritingDirection()}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <Smile size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {messageText.trim() ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={!isConnected}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButton}
                >
                  <Send size={20} color={Colors.white} style={rtl && { transform: [{ scaleX: -1 }] }} />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={[Colors.primary[500], Colors.primary[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButton}
                >
                  <Mic size={20} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContentRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  userInfoRTL: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    color: Colors.white,
  },
  userName: {
    fontSize: 17,
    color: Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusRowRTL: {
    flexDirection: 'row-reverse',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  userStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerActionsRTL: {
    flexDirection: 'row-reverse',
  },
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageWrapperMe: {
    alignItems: 'flex-end',
  },
  messageWrapperOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleMe: {
    borderBottomRightRadius: 6,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleOther: {
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  messageFooterRTL: {
    flexDirection: 'row-reverse',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  readStatus: {
    marginLeft: 2,
  },

  // Input
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputRowRTL: {
    flexDirection: 'row-reverse',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 24,
  },
  emojiButton: {
    marginLeft: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Typing
  typingBubble: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomLeftRadius: 6,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
