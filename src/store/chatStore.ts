/**
 * Chat Store
 * Manages chat conversations and messages
 */

import {create} from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reaction?: string;
  encrypted?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  participants: string[];
}

interface ChatState {
  // State
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  isConnected: boolean;
  isTyping: Record<string, boolean>;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markAsRead: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setConnected: (value: boolean) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  clearMessages: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  conversations: [],
  messages: {},
  activeConversationId: null,
  isConnected: false,
  isTyping: {},

  // Actions
  setConversations: (conversations) => set({conversations}),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? {...conv, ...updates} : conv,
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...conversationMessages, message],
        },
      };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => {
      const newMessages = {...state.messages};
      Object.keys(newMessages).forEach((conversationId) => {
        newMessages[conversationId] = newMessages[conversationId].map((msg) =>
          msg.id === messageId ? {...msg, ...updates} : msg,
        );
      });
      return {messages: newMessages};
    }),

  markAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? {...conv, unreadCount: 0} : conv,
      ),
    })),

  setActiveConversation: (conversationId) =>
    set({activeConversationId: conversationId}),

  setConnected: (value) => set({isConnected: value}),

  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      isTyping: {
        ...state.isTyping,
        [conversationId]: isTyping,
      },
    })),

  clearMessages: (conversationId) =>
    set((state) => {
      const newMessages = {...state.messages};
      delete newMessages[conversationId];
      return {messages: newMessages};
    }),
}));
