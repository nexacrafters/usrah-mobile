/**
 * Chat Screen
 * WhatsApp-style messaging interface
 */

import React, {useState, useRef, useEffect, useCallback} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Avatar from '../../components/ui/Avatar';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {useAuthStore} from '../../store/authStore';
import chatService, {Message} from '../../services/api/chat.service';
import {ChatSocket, SocketIncomingMessage} from '../../services/chatSocket';
import {formatTime} from '../../utils/datetime';

/** A message decorated with view-only fields (mine flag + sending state). */
interface ChatMessage extends Message {
  isMine: boolean;
  pending?: boolean;
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {t} = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = useAuthStore(state => state.user?.public_id);

  // Get conversation details from route params
  const params = (route.params as {conversationId?: string; name?: string}) || {};
  const conversationId = params.conversationId;
  const conversationName = params.name || t('chat.defaultMember');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);

  const socketRef = useRef<ChatSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The API returns newest-first; reverse so oldest is at the top (chat order).
  const decorate = useCallback(
    (msg: Message): ChatMessage => ({
      ...msg,
      isMine: !!currentUserId && msg.sender?.public_id === currentUserId,
    }),
    [currentUserId],
  );

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      setError(t('chat.loadMessagesError'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.listMessages(conversationId);
      setMessages(data.slice().reverse().map(decorate));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.loadMessagesError'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, decorate, t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Merge a message arriving over the websocket, de-duplicating against both
  // existing messages and our own optimistic placeholder.
  const mergeIncoming = useCallback(
    (raw: SocketIncomingMessage) => {
      const incoming: ChatMessage = {
        public_id: raw.public_id,
        conversation: conversationId || '',
        sender: raw.sender,
        type: raw.type || 'text',
        content: raw.content,
        status: 'sent',
        created: raw.created,
        isMine: !!currentUserId && raw.sender?.public_id === currentUserId,
      };
      setMessages(prev => {
        if (prev.some(m => m.public_id === incoming.public_id)) {
          return prev;
        }
        if (incoming.isMine) {
          const idx = prev.findIndex(
            m => m.pending && m.content === incoming.content,
          );
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = incoming;
            return copy;
          }
        }
        return [...prev, incoming];
      });
      setTimeout(
        () => flatListRef.current?.scrollToEnd({animated: true}),
        80,
      );
    },
    [conversationId, currentUserId],
  );

  // Open a realtime socket for this conversation.
  useEffect(() => {
    if (!conversationId) {
      return;
    }
    const socket = new ChatSocket(conversationId, {
      onMessage: mergeIncoming,
      onTyping: (userId, isTyping) => {
        if (userId !== currentUserId) {
          setOtherTyping(isTyping);
        }
      },
      onPresence: (userId, online) => {
        if (userId !== currentUserId) {
          setOtherOnline(online);
        }
      },
    });
    socketRef.current = socket;
    socket.connect();
    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current);
      }
    };
  }, [conversationId, currentUserId, mergeIncoming]);

  // Emit a throttled typing indicator while the user types.
  const handleInputChange = (text: string) => {
    setInputText(text);
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    if (!typingTimerRef.current) {
      socket.sendTyping(true);
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, 1500);
    }
    if (typingClearRef.current) {
      clearTimeout(typingClearRef.current);
    }
    typingClearRef.current = setTimeout(() => socket.sendTyping(false), 2000);
  };


  const handleSend = async () => {
    const content = inputText.trim();
    if (content.length === 0 || !conversationId || sending) {
      return;
    }

    setInputText('');
    setSending(true);
    socketRef.current?.sendTyping(false);

    // Optimistic placeholder while the request is in flight.
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      public_id: tempId,
      conversation: conversationId,
      sender: currentUserId
        ? {public_id: currentUserId, full_name: t('chat.you')}
        : null,
      type: 'text',
      content,
      created: new Date().toISOString(),
      isMine: true,
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    try {
      const sent = await chatService.sendMessage(conversationId, content);
      setMessages(prev =>
        prev.map(msg => (msg.public_id === tempId ? decorate(sent) : msg)),
      );
    } catch (e) {
      // Drop the optimistic message and surface the error inline.
      setMessages(prev => prev.filter(msg => msg.public_id !== tempId));
      setInputText(content);
      setError(e instanceof Error ? e.message : t('chat.sendMessageError'));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({item}: {item: ChatMessage}) => (
    <View
      style={[
        styles.messageContainer,
        item.isMine ? styles.messageContainerMine : styles.messageContainerTheirs,
      ]}>
      {!item.isMine && (
        <Avatar
          name={item.sender?.full_name || conversationName}
          size="small"
          style={styles.avatar}
        />
      )}

      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageBubble,
            item.isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
          ]}>
          <Text
            style={[
              styles.messageText,
              item.isMine ? styles.messageTextMine : styles.messageTextTheirs,
            ]}>
            {item.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                item.isMine ? styles.messageTimeMine : styles.messageTimeTheirs,
              ]}>
              {formatTime(item.created)}
            </Text>
            {item.isMine && (
              <Text style={styles.messageStatus}>
                {item.pending ? '🕐' : '✓✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Avatar name={conversationName} size="medium" style={styles.headerAvatar} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversationName}</Text>
          <Text style={styles.headerStatus}>
            {otherTyping
              ? t('chat.typing')
              : otherOnline
              ? t('chat.online')
              : t('chat.offline')}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error && messages.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
            <Text style={styles.retryText}>{t('chat.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.public_id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.stateEmoji}>💬</Text>
              <Text style={styles.stateText}>{t('chat.noMessagesTitle')}</Text>
              <Text style={styles.stateSubtext}>
                {t('chat.noMessagesBody')}
              </Text>
            </View>
          }
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          {/* Islamic Reactions Quick Access */}
          <View style={styles.quickReactions}>
            <TouchableOpacity style={styles.quickReactionButton}>
              <Text style={styles.quickReactionText}>🤲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickReactionButton}>
              <Text style={styles.quickReactionText}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickReactionButton}>
              <Text style={styles.quickReactionArabic}>ماشاء الله</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickReactionButton}>
              <Text style={styles.quickReactionArabic}>جزاك الله</Text>
            </TouchableOpacity>
          </View>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('chat.typeMessage')}
                placeholderTextColor={colors.text.tertiary}
                value={inputText}
                onChangeText={handleInputChange}
                multiline
                maxLength={1000}
              />
            </View>

            {inputText.trim().length > 0 ? (
              <TouchableOpacity onPress={handleSend} disabled={sending}>
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[700]]}
                  style={styles.sendButton}>
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.sendIcon}>➤</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.voiceButton}>
                <Text style={styles.voiceIcon}>🎤</Text>
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
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[3],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  headerAvatar: {
    marginRight: spacing[1],
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  headerStatus: {
    ...typography.caption,
    color: colors.islamic.mashallah,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerButton: {
    padding: spacing[2],
  },
  headerIcon: {
    fontSize: 20,
  },
  messagesList: {
    padding: spacing[4],
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  stateEmoji: {
    fontSize: 56,
    marginBottom: spacing[4],
  },
  stateText: {
    ...typography.h5,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  stateSubtext: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
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
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  messageContainerMine: {
    justifyContent: 'flex-end',
  },
  messageContainerTheirs: {
    justifyContent: 'flex-start',
  },
  avatar: {
    alignSelf: 'flex-end',
  },
  messageWrapper: {
    maxWidth: '75%',
    position: 'relative',
  },
  messageBubble: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  messageBubbleMine: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  messageBubbleTheirs: {
    backgroundColor: colors.background.paper,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing[1],
  },
  messageTextMine: {
    color: colors.white,
  },
  messageTextTheirs: {
    color: colors.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeTheirs: {
    color: colors.text.tertiary,
  },
  messageStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  quickReactions: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  quickReactionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickReactionText: {
    fontSize: 16,
  },
  quickReactionArabic: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 24,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    maxHeight: 100,
  },
  textInput: {
    ...typography.body,
    color: colors.text.primary,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sendIcon: {
    fontSize: 20,
    color: colors.white,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    fontSize: 24,
  },
});
