/**
 * WebSocket Hook
 * React hook for using the WebSocket service
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socket/socketService';
import { useAuthStore } from '../store/authStore';
import { DEMO_MODE } from '../services/demoMode';
import type { Message } from '../types/models';

interface TypingState {
  [conversationId: string]: {
    [userId: string]: boolean;
  };
}

interface PresenceState {
  [userId: string]: {
    isOnline: boolean;
    lastSeen?: string;
  };
}

/**
 * Main WebSocket hook
 */
export function useSocket() {
  // In demo mode, always return connected state
  const [isConnected, setIsConnected] = useState(DEMO_MODE ? true : socketService.connected);
  const [isConnecting, setIsConnecting] = useState(DEMO_MODE ? false : socketService.connecting);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Skip WebSocket in demo mode
    if (DEMO_MODE) {
      setIsConnected(true);
      setIsConnecting(false);
      return;
    }

    // Connect when authenticated
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    // Listen for connection changes
    const unsubscribe = socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      setIsConnecting(socketService.connecting);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const connect = useCallback(() => {
    if (!DEMO_MODE) {
      socketService.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!DEMO_MODE) {
      socketService.disconnect();
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
  };
}

/**
 * Hook for chat functionality
 */
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeouts = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // Skip WebSocket in demo mode
    if (DEMO_MODE) {
      return;
    }

    // Subscribe to conversation
    socketService.subscribeToConversation(conversationId);
    socketService.setFocusedConversation(conversationId);

    // Listen for new messages
    const unsubscribeMessage = socketService.onMessage((message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for typing indicators
    const unsubscribeTyping = socketService.onTyping((event) => {
      if (event.conversation_id !== conversationId) return;

      if (event.is_typing) {
        setTypingUsers((prev) => {
          if (!prev.includes(event.user_id)) {
            return [...prev, event.user_id];
          }
          return prev;
        });

        // Clear after 3 seconds if no update
        if (typingTimeouts.current[event.user_id]) {
          clearTimeout(typingTimeouts.current[event.user_id]);
        }
        typingTimeouts.current[event.user_id] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== event.user_id));
        }, 3000);
      } else {
        setTypingUsers((prev) => prev.filter((id) => id !== event.user_id));
        if (typingTimeouts.current[event.user_id]) {
          clearTimeout(typingTimeouts.current[event.user_id]);
        }
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      socketService.unsubscribeFromConversation(conversationId);
      socketService.setFocusedConversation(null);

      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    (content: string, type: string = 'text', replyToId?: string) => {
      if (DEMO_MODE) {
        // In demo mode, just add to local state
        const newMessage: Message = {
          id: `demo-msg-${Date.now()}`,
          conversation_id: conversationId,
          content,
          type: type as any,
          sender: { id: 'demo-user-1', full_name: 'أحمد محمد' },
          created_at: new Date().toISOString(),
          is_read: true,
        };
        setMessages((prev) => [...prev, newMessage]);
        return;
      }
      socketService.sendMessage(conversationId, content, type, replyToId);
    },
    [conversationId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!DEMO_MODE) {
        socketService.sendTyping(conversationId, isTyping);
      }
    },
    [conversationId]
  );

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!DEMO_MODE) {
        socketService.markAsRead(conversationId, messageIds);
      }
    },
    [conversationId]
  );

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    isConnected: DEMO_MODE ? true : socketService.connected,
  };
}

/**
 * Hook for presence tracking
 */
export function usePresence(userIds: string[]) {
  const [presence, setPresence] = useState<PresenceState>({});

  useEffect(() => {
    const unsubscribe = socketService.onPresence((event) => {
      if (userIds.includes(event.user_id)) {
        setPresence((prev) => ({
          ...prev,
          [event.user_id]: {
            isOnline: event.is_online,
            lastSeen: event.last_seen,
          },
        }));
      }
    });

    return unsubscribe;
  }, [userIds]);

  return presence;
}

/**
 * Hook for typing indicator with debounce
 */
export function useTypingIndicator(conversationId: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.sendTyping(conversationId, true);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.sendTyping(conversationId, false);
    }, 2000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.sendTyping(conversationId, false);
    }
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (isTypingRef.current) {
        socketService.sendTyping(conversationId, false);
      }
    };
  }, [conversationId]);

  return { startTyping, stopTyping };
}

/**
 * Hook for connection status
 */
export function useConnectionStatus() {
  // In demo mode, always return connected
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>(
    DEMO_MODE ? 'connected' :
    socketService.connected ? 'connected' : socketService.connecting ? 'connecting' : 'disconnected'
  );

  useEffect(() => {
    // Skip in demo mode
    if (DEMO_MODE) {
      setStatus('connected');
      return;
    }

    const unsubscribe = socketService.onConnectionChange((connected) => {
      if (connected) {
        setStatus('connected');
      } else if (socketService.connecting) {
        setStatus('connecting');
      } else {
        setStatus('disconnected');
      }
    });

    return unsubscribe;
  }, []);

  return status;
}
