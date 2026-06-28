/**
 * Socket.IO Service
 * Real-time chat and notifications
 */

import {io, Socket} from 'socket.io-client';
import {useAuthStore} from '../store/authStore';
import {useChatStore, Message} from '../store/chatStore';

const SOCKET_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.usrah.app';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize socket connection
   */
  connect() {
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      useChatStore.getState().setConnected(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      useChatStore.getState().setConnected(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Chat events
    this.socket.on('message:new', (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    this.socket.on('message:status', (data: {messageId: string; status: string}) => {
      useChatStore.getState().updateMessage(data.messageId, {
        status: data.status as any,
      });
    });

    this.socket.on('user:typing', (data: {conversationId: string; userId: string; isTyping: boolean}) => {
      useChatStore.getState().setTyping(data.conversationId, data.isTyping);
    });

    this.socket.on('user:online', (data: {userId: string; isOnline: boolean}) => {
      // Update user online status in conversations
      const conversations = useChatStore.getState().conversations;
      conversations.forEach((conv) => {
        if (conv.participants.includes(data.userId)) {
          useChatStore.getState().updateConversation(conv.id, {
            isOnline: data.isOnline,
          });
        }
      });
    });
  }

  /**
   * Send message
   */
  sendMessage(conversationId: string, text: string, encrypted?: boolean) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message:send', {
      conversationId,
      text,
      encrypted,
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string) {
    if (!this.socket) return;

    this.socket.emit('message:read', {conversationId});
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean) {
    if (!this.socket) return;

    this.socket.emit('user:typing', {
      conversationId,
      isTyping,
    });
  }

  /**
   * Join conversation room
   */
  joinConversation(conversationId: string) {
    if (!this.socket) return;

    this.socket.emit('conversation:join', {conversationId});
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string) {
    if (!this.socket) return;

    this.socket.emit('conversation:leave', {conversationId});
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useChatStore.getState().setConnected(false);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
