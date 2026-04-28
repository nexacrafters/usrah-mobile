/**
 * WebSocket Service for Real-time Chat
 * Based on wisecool-messaging patterns
 *
 * Features:
 * - Singleton connection management
 * - Auto-reconnection with exponential backoff
 * - Message batching and queueing
 * - Heartbeat mechanism
 * - Network state awareness
 * - Type-safe message handling
 */
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../api/config';
import { tokenStorage } from '../auth/tokenStorage';
import { queryClient, queryKeys } from '../queryClient';
import type { Message, Conversation } from '../../types/models';

// Message types for WebSocket communication
type MessageType =
  | 'message'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'typing'
  | 'presence'
  | 'read_receipt'
  | 'error';

interface WSMessage {
  type: MessageType;
  conversation_id?: string;
  message_id?: string;
  data?: any;
  timestamp?: string;
}

interface TypingEvent {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
}

interface PresenceEvent {
  user_id: string;
  is_online: boolean;
  last_seen?: string;
}

type MessageCallback = (message: Message) => void;
type TypingCallback = (event: TypingEvent) => void;
type PresenceCallback = (event: PresenceEvent) => void;
type ConnectionCallback = (connected: boolean) => void;

// Reconnection configuration
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
const HEARTBEAT_INTERVAL = 25000; // 25 seconds
const MESSAGE_BATCH_INTERVAL = 50; // 50ms batching
const MAX_BATCH_SIZE = 10;
const MAX_PENDING_MESSAGES = 500;

/**
 * WebSocket Service - Singleton
 */
class SocketService {
  private static instance: SocketService | null = null;

  private socket: Socket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempt = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private batchTimeout: NodeJS.Timeout | null = null;

  // Message queue for offline support
  private pendingMessages: WSMessage[] = [];
  private outgoingBatch: WSMessage[] = [];

  // Deduplication
  private recentMessageIds = new Set<string>();
  private dedupeCleanupInterval: NodeJS.Timeout | null = null;

  // Subscribed conversations
  private subscribedConversations = new Set<string>();
  private focusedConversation: string | null = null;

  // Callbacks
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private presenceCallbacks: PresenceCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  // Network and app state
  private isOnline = true;
  private appState: AppStateStatus = 'active';

  private constructor() {
    this.setupNetworkListener();
    this.setupAppStateListener();
    this.setupDedupeCleanup();
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        console.log('[WS] No token available, skipping connection');
        this.isConnecting = false;
        return;
      }

      this.socket = io(API_CONFIG.wsUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false, // We handle reconnection ourselves
        timeout: 10000,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempt = 0;
    this.subscribedConversations.clear();
    this.focusedConversation = null;

    this.notifyConnectionChange(false);
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WS] Connected');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempt = 0;

      this.startHeartbeat();
      this.resubscribeToConversations();
      this.flushPendingMessages();
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      this.isConnected = false;
      this.clearTimers();
      this.notifyConnectionChange(false);

      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      this.isConnecting = false;
      this.scheduleReconnect();
    });

    // Message events
    this.socket.on('message', (data: any) => {
      this.handleIncomingMessage(data);
    });

    this.socket.on('message_sent', (data: any) => {
      this.handleMessageSent(data);
    });

    this.socket.on('message_delivered', (data: any) => {
      this.handleMessageDelivered(data);
    });

    this.socket.on('message_read', (data: any) => {
      this.handleMessageRead(data);
    });

    // Typing events
    this.socket.on('typing', (data: TypingEvent) => {
      this.typingCallbacks.forEach((cb) => cb(data));
    });

    // Presence events
    this.socket.on('presence', (data: PresenceEvent) => {
      this.presenceCallbacks.forEach((cb) => cb(data));
    });

    // Pong for heartbeat
    this.socket.on('pong', () => {
      // Server responded to ping
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('[WS] Error:', error);
    });
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(data: any): void {
    const message = data as Message;

    // Deduplication
    if (this.recentMessageIds.has(message.id)) {
      return;
    }
    this.recentMessageIds.add(message.id);

    // Notify subscribers
    this.messageCallbacks.forEach((cb) => cb(message));

    // Invalidate queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(message.conversation_id),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.conversations(),
    });
  }

  /**
   * Handle message sent confirmation
   */
  private handleMessageSent(data: any): void {
    const { client_id, server_id, message } = data;

    // Update local message with server ID
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(message.conversation_id),
    });
  }

  /**
   * Handle message delivered
   */
  private handleMessageDelivered(data: any): void {
    const { message_id, conversation_id } = data;

    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(conversation_id),
    });
  }

  /**
   * Handle message read
   */
  private handleMessageRead(data: any): void {
    const { message_id, conversation_id, user_id } = data;

    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(conversation_id),
    });
  }

  /**
   * Send a message
   */
  sendMessage(conversationId: string, content: string, type: string = 'text', replyToId?: string): void {
    const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: WSMessage = {
      type: 'message',
      conversation_id: conversationId,
      data: {
        client_id: clientId,
        content,
        type,
        reply_to_id: replyToId,
      },
      timestamp: new Date().toISOString(),
    };

    if (this.isConnected && this.socket) {
      this.addToBatch(message);
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('typing', {
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string, messageIds: string[]): void {
    const message: WSMessage = {
      type: 'read_receipt',
      conversation_id: conversationId,
      data: { message_ids: messageIds },
    };

    if (this.isConnected && this.socket) {
      this.socket.emit('read_receipt', message.data);
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Subscribe to a conversation
   */
  subscribeToConversation(conversationId: string): void {
    this.subscribedConversations.add(conversationId);

    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe', { conversation_id: conversationId });
    }
  }

  /**
   * Unsubscribe from a conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    this.subscribedConversations.delete(conversationId);

    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe', { conversation_id: conversationId });
    }
  }

  /**
   * Set focused conversation (for typing indicators)
   */
  setFocusedConversation(conversationId: string | null): void {
    this.focusedConversation = conversationId;

    if (this.isConnected && this.socket) {
      this.socket.emit('focus', { conversation_id: conversationId });
    }
  }

  /**
   * Add message to batch for sending
   */
  private addToBatch(message: WSMessage): void {
    this.outgoingBatch.push(message);

    if (this.outgoingBatch.length >= MAX_BATCH_SIZE) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch();
      }, MESSAGE_BATCH_INTERVAL);
    }
  }

  /**
   * Flush outgoing batch
   */
  private flushBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.outgoingBatch.length === 0) return;

    if (this.isConnected && this.socket) {
      if (this.outgoingBatch.length === 1) {
        const msg = this.outgoingBatch[0];
        this.socket.emit(msg.type, msg.data);
      } else {
        this.socket.emit('batch', { messages: this.outgoingBatch });
      }
    } else {
      // Queue all messages for later
      this.outgoingBatch.forEach((msg) => this.queueMessage(msg));
    }

    this.outgoingBatch = [];
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WSMessage): void {
    if (this.pendingMessages.length >= MAX_PENDING_MESSAGES) {
      console.warn('[WS] Pending messages queue full, dropping oldest');
      this.pendingMessages.shift();
    }
    this.pendingMessages.push(message);
  }

  /**
   * Flush pending messages after reconnect
   */
  private flushPendingMessages(): void {
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    messages.forEach((msg) => {
      this.addToBatch(msg);
    });
  }

  /**
   * Resubscribe to conversations after reconnect
   */
  private resubscribeToConversations(): void {
    if (!this.socket) return;

    this.subscribedConversations.forEach((conversationId) => {
      this.socket!.emit('subscribe', { conversation_id: conversationId });
    });

    if (this.focusedConversation) {
      this.socket.emit('focus', { conversation_id: this.focusedConversation });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    const delay = RECONNECT_DELAYS[
      Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)
    ];

    console.log(`[WS] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('ping');
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline && !this.isConnected) {
        console.log('[WS] Network restored, reconnecting...');
        this.connect();
      }
    });
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      const wasBackground = this.appState.match(/inactive|background/);
      this.appState = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        console.log('[WS] App became active, checking connection...');
        if (!this.isConnected && this.isOnline) {
          this.connect();
        }
      }
    });
  }

  /**
   * Setup deduplication cleanup
   */
  private setupDedupeCleanup(): void {
    this.dedupeCleanupInterval = setInterval(() => {
      this.recentMessageIds.clear();
    }, 60000); // Clear every minute
  }

  /**
   * Notify connection change
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }

  // Callback registration methods
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.push(callback);
    return () => {
      this.presenceCallbacks = this.presenceCallbacks.filter((cb) => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }

  get online(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export class for testing
export { SocketService };
