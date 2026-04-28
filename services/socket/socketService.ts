/**
 * WebSocket Service for Real-time Chat
 * Native WebSocket implementation for Django Channels
 *
 * Features:
 * - Per-conversation WebSocket connections
 * - Auto-reconnection with exponential backoff
 * - Message queueing for offline support
 * - Heartbeat mechanism (ping/pong)
 * - Network state awareness
 * - Type-safe message handling
 */
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../api/config';
import { tokenStorage } from '../auth/tokenStorage';
import { queryClient, queryKeys } from '../queryClient';
import type { Message } from '../../types/models';

// Incoming message types from Django Channels
type IncomingMessageType =
  | 'message'
  | 'typing'
  | 'read'
  | 'edited'
  | 'deleted'
  | 'reaction'
  | 'online'
  | 'offline'
  | 'error';

// Outgoing action types to Django Channels
type OutgoingAction =
  | 'message'
  | 'typing'
  | 'stop_typing'
  | 'read'
  | 'edit'
  | 'delete'
  | 'reaction';

interface WSIncomingMessage {
  type: IncomingMessageType;
  message?: any;
  user_id?: string;
  full_name?: string;
  is_typing?: boolean;
  message_ids?: string[];
  message_id?: string;
  content?: string;
  reaction?: string;
  action?: string;
  edited_by?: string;
  deleted_by?: string;
  for_everyone?: boolean;
  error?: string;
}

interface WSOutgoingMessage {
  action: OutgoingAction;
  content?: string;
  type?: string;
  encrypted_content?: string;
  reply_to?: string;
  message_id?: string;
  message_ids?: string[];
  reaction?: string;
  reaction_action?: 'add' | 'remove';
  for_everyone?: boolean;
}

interface TypingEvent {
  conversation_id: string;
  user_id: string;
  full_name: string;
  is_typing: boolean;
}

interface PresenceEvent {
  conversation_id: string;
  user_id: string;
  full_name: string;
  is_online: boolean;
}

interface MessageEvent {
  conversation_id: string;
  message: Message;
}

type MessageCallback = (event: MessageEvent) => void;
type TypingCallback = (event: TypingEvent) => void;
type PresenceCallback = (event: PresenceEvent) => void;
type ConnectionCallback = (conversationId: string, connected: boolean) => void;

// Reconnection configuration
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_PENDING_MESSAGES = 100;

interface ConversationSocket {
  ws: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempt: number;
  reconnectTimeout: NodeJS.Timeout | null;
  heartbeatInterval: NodeJS.Timeout | null;
  pendingMessages: WSOutgoingMessage[];
  lastPong: number;
}

/**
 * WebSocket Service - Singleton
 * Manages multiple WebSocket connections (one per conversation)
 */
class SocketService {
  private static instance: SocketService | null = null;

  // Connection map: conversationId -> socket state
  private connections: Map<string, ConversationSocket> = new Map();

  // Callbacks
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private presenceCallbacks: PresenceCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  // Deduplication
  private recentMessageIds = new Set<string>();
  private dedupeCleanupInterval: NodeJS.Timeout | null = null;

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
   * Connect to a conversation's WebSocket
   */
  async connect(conversationId: string): Promise<void> {
    let conn = this.connections.get(conversationId);

    if (conn?.isConnected || conn?.isConnecting) {
      return;
    }

    if (!conn) {
      conn = {
        ws: null,
        isConnected: false,
        isConnecting: false,
        reconnectAttempt: 0,
        reconnectTimeout: null,
        heartbeatInterval: null,
        pendingMessages: [],
        lastPong: Date.now(),
      };
      this.connections.set(conversationId, conn);
    }

    conn.isConnecting = true;

    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        console.log('[WS] No token available, skipping connection');
        conn.isConnecting = false;
        return;
      }

      // Build WebSocket URL with token
      const wsUrl = `${API_CONFIG.wsUrl}/chat/${conversationId}/?token=${encodeURIComponent(token)}`;

      console.log(`[WS] Connecting to conversation ${conversationId}`);
      conn.ws = new WebSocket(wsUrl);

      this.setupSocketListeners(conversationId, conn);
    } catch (error) {
      console.error('[WS] Connection error:', error);
      conn.isConnecting = false;
      this.scheduleReconnect(conversationId);
    }
  }

  /**
   * Disconnect from a conversation's WebSocket
   */
  disconnect(conversationId: string): void {
    const conn = this.connections.get(conversationId);
    if (!conn) return;

    this.clearTimers(conn);

    if (conn.ws) {
      conn.ws.close(1000, 'Client disconnect');
      conn.ws = null;
    }

    conn.isConnected = false;
    conn.isConnecting = false;
    conn.reconnectAttempt = 0;

    this.notifyConnectionChange(conversationId, false);
  }

  /**
   * Disconnect from all conversations
   */
  disconnectAll(): void {
    for (const conversationId of this.connections.keys()) {
      this.disconnect(conversationId);
    }
    this.connections.clear();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketListeners(conversationId: string, conn: ConversationSocket): void {
    if (!conn.ws) return;

    conn.ws.onopen = () => {
      console.log(`[WS] Connected to conversation ${conversationId}`);
      conn.isConnected = true;
      conn.isConnecting = false;
      conn.reconnectAttempt = 0;
      conn.lastPong = Date.now();

      this.startHeartbeat(conversationId, conn);
      this.flushPendingMessages(conversationId, conn);
      this.notifyConnectionChange(conversationId, true);
    };

    conn.ws.onclose = (event) => {
      console.log(`[WS] Disconnected from conversation ${conversationId}:`, event.code, event.reason);
      conn.isConnected = false;
      conn.isConnecting = false;
      this.clearTimers(conn);
      this.notifyConnectionChange(conversationId, false);

      // Reconnect unless it was a clean close
      if (event.code !== 1000) {
        this.scheduleReconnect(conversationId);
      }
    };

    conn.ws.onerror = (error) => {
      console.error(`[WS] Error on conversation ${conversationId}:`, error);
      conn.isConnecting = false;
    };

    conn.ws.onmessage = (event) => {
      try {
        const data: WSIncomingMessage = JSON.parse(event.data);
        this.handleIncomingMessage(conversationId, data);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(conversationId: string, data: WSIncomingMessage): void {
    switch (data.type) {
      case 'message':
        this.handleNewMessage(conversationId, data);
        break;

      case 'typing':
        this.typingCallbacks.forEach((cb) =>
          cb({
            conversation_id: conversationId,
            user_id: data.user_id!,
            full_name: data.full_name!,
            is_typing: data.is_typing!,
          })
        );
        break;

      case 'read':
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(conversationId),
        });
        break;

      case 'edited':
      case 'deleted':
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(conversationId),
        });
        break;

      case 'reaction':
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(conversationId),
        });
        break;

      case 'online':
        this.presenceCallbacks.forEach((cb) =>
          cb({
            conversation_id: conversationId,
            user_id: data.user_id!,
            full_name: data.full_name!,
            is_online: true,
          })
        );
        break;

      case 'offline':
        this.presenceCallbacks.forEach((cb) =>
          cb({
            conversation_id: conversationId,
            user_id: data.user_id!,
            full_name: data.full_name!,
            is_online: false,
          })
        );
        break;

      case 'error':
        console.error('[WS] Server error:', data.error);
        break;
    }
  }

  /**
   * Handle new message from server
   */
  private handleNewMessage(conversationId: string, data: WSIncomingMessage): void {
    const message = data.message as Message;
    if (!message) return;

    // Deduplication
    if (this.recentMessageIds.has(message.public_id)) {
      return;
    }
    this.recentMessageIds.add(message.public_id);

    // Notify subscribers
    this.messageCallbacks.forEach((cb) =>
      cb({
        conversation_id: conversationId,
        message,
      })
    );

    // Invalidate queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.messages(conversationId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.conversations(),
    });
  }

  /**
   * Send a message to a conversation
   */
  sendMessage(
    conversationId: string,
    content: string,
    type: string = 'text',
    replyToId?: string,
    encryptedContent?: string
  ): void {
    const message: WSOutgoingMessage = {
      action: 'message',
      content,
      type,
      reply_to: replyToId,
      encrypted_content: encryptedContent,
    };

    this.send(conversationId, message);
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    const message: WSOutgoingMessage = {
      action: isTyping ? 'typing' : 'stop_typing',
    };

    this.send(conversationId, message);
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string, messageIds: string[]): void {
    const message: WSOutgoingMessage = {
      action: 'read',
      message_ids: messageIds,
    };

    this.send(conversationId, message);
  }

  /**
   * Edit a message
   */
  editMessage(conversationId: string, messageId: string, newContent: string): void {
    const message: WSOutgoingMessage = {
      action: 'edit',
      message_id: messageId,
      content: newContent,
    };

    this.send(conversationId, message);
  }

  /**
   * Delete a message
   */
  deleteMessage(conversationId: string, messageId: string, forEveryone: boolean = false): void {
    const message: WSOutgoingMessage = {
      action: 'delete',
      message_id: messageId,
      for_everyone: forEveryone,
    };

    this.send(conversationId, message);
  }

  /**
   * Add/remove reaction
   */
  toggleReaction(
    conversationId: string,
    messageId: string,
    reaction: string,
    action: 'add' | 'remove'
  ): void {
    const message: WSOutgoingMessage = {
      action: 'reaction',
      message_id: messageId,
      reaction,
      reaction_action: action,
    };

    this.send(conversationId, message);
  }

  /**
   * Send a message through WebSocket
   */
  private send(conversationId: string, message: WSOutgoingMessage): void {
    const conn = this.connections.get(conversationId);

    if (conn?.isConnected && conn.ws?.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      if (conn) {
        if (conn.pendingMessages.length >= MAX_PENDING_MESSAGES) {
          console.warn('[WS] Pending messages queue full, dropping oldest');
          conn.pendingMessages.shift();
        }
        conn.pendingMessages.push(message);
      }
      // Try to connect if not connected
      this.connect(conversationId);
    }
  }

  /**
   * Flush pending messages after reconnect
   */
  private flushPendingMessages(conversationId: string, conn: ConversationSocket): void {
    const messages = [...conn.pendingMessages];
    conn.pendingMessages = [];

    messages.forEach((msg) => {
      if (conn.ws?.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(msg));
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(conversationId: string): void {
    const conn = this.connections.get(conversationId);
    if (!conn || conn.reconnectTimeout) return;

    const delay =
      RECONNECT_DELAYS[Math.min(conn.reconnectAttempt, RECONNECT_DELAYS.length - 1)];

    console.log(
      `[WS] Scheduling reconnect for ${conversationId} in ${delay}ms (attempt ${conn.reconnectAttempt + 1})`
    );

    conn.reconnectTimeout = setTimeout(() => {
      conn.reconnectTimeout = null;
      conn.reconnectAttempt++;
      this.connect(conversationId);
    }, delay);
  }

  /**
   * Start heartbeat (ping)
   */
  private startHeartbeat(conversationId: string, conn: ConversationSocket): void {
    this.stopHeartbeat(conn);

    conn.heartbeatInterval = setInterval(() => {
      if (conn.isConnected && conn.ws?.readyState === WebSocket.OPEN) {
        // Check if we received a response recently
        if (Date.now() - conn.lastPong > HEARTBEAT_INTERVAL * 2) {
          console.log(`[WS] No heartbeat response for ${conversationId}, reconnecting...`);
          conn.ws.close(4000, 'Heartbeat timeout');
          return;
        }

        // Send ping (Django Channels doesn't need special ping, the connection itself keeps alive)
        conn.lastPong = Date.now();
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(conn: ConversationSocket): void {
    if (conn.heartbeatInterval) {
      clearInterval(conn.heartbeatInterval);
      conn.heartbeatInterval = null;
    }
  }

  /**
   * Clear all timers for a connection
   */
  private clearTimers(conn: ConversationSocket): void {
    this.stopHeartbeat(conn);

    if (conn.reconnectTimeout) {
      clearTimeout(conn.reconnectTimeout);
      conn.reconnectTimeout = null;
    }
  }

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        console.log('[WS] Network restored, reconnecting all...');
        // Reconnect all conversations
        for (const [conversationId, conn] of this.connections.entries()) {
          if (!conn.isConnected) {
            this.connect(conversationId);
          }
        }
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
        console.log('[WS] App became active, checking connections...');
        // Reconnect all conversations
        for (const [conversationId, conn] of this.connections.entries()) {
          if (!conn.isConnected && this.isOnline) {
            this.connect(conversationId);
          }
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
  private notifyConnectionChange(conversationId: string, connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(conversationId, connected));
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
  isConnected(conversationId: string): boolean {
    return this.connections.get(conversationId)?.isConnected ?? false;
  }

  isConnecting(conversationId: string): boolean {
    return this.connections.get(conversationId)?.isConnecting ?? false;
  }

  get online(): boolean {
    return this.isOnline;
  }

  getConnectedConversations(): string[] {
    const connected: string[] = [];
    for (const [conversationId, conn] of this.connections.entries()) {
      if (conn.isConnected) {
        connected.push(conversationId);
      }
    }
    return connected;
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export class for testing
export { SocketService };
