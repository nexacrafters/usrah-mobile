/**
 * Chat Query Hooks
 * React Query hooks for chat/messaging
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { chatApi } from '../../services/api/chat';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { DEMO_MODE, DEMO_CONVERSATIONS, DEMO_MESSAGES } from '../../services/demoMode';
import type { Conversation, Message, MessageType } from '../../types/models';

// Mutable demo messages
let demoMessagesData = [...DEMO_MESSAGES];

/**
 * Get conversations
 */
export function useConversations(familyId: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_CONVERSATIONS;
      }
      return chatApi.getConversations(familyId);
    },
    enabled: !!familyId,
    refetchInterval: DEMO_MODE ? undefined : 30000,
  });
}

/**
 * Get single conversation
 */
export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversation(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_CONVERSATIONS.find(c => c.id === id) || null;
      }
      return chatApi.getConversation(id);
    },
    enabled: !!id,
  });
}

/**
 * Create conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      type: 'direct' | 'group';
      name?: string;
      participant_ids: string[];
    }) => {
      if (DEMO_MODE) {
        const newConversation = {
          id: `demo-conv-${Date.now()}`,
          name: data.name || 'محادثة جديدة',
          type: data.type,
          last_message: null,
          unread_count: 0,
        };
        (DEMO_CONVERSATIONS as any[]).push(newConversation);
        return newConversation;
      }
      return chatApi.createConversation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

/**
 * Create direct message conversation
 */
export function useCreateDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, userId }: { familyId: string; userId: string }) => {
      if (DEMO_MODE) {
        return DEMO_CONVERSATIONS[1]; // Return existing DM
      }
      return chatApi.createDirectMessage(familyId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

/**
 * Get messages with pagination
 */
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        return {
          results: demoMessagesData,
          next: null,
          page: 1,
          count: demoMessagesData.length,
        };
      }
      return chatApi.getMessages(conversationId, pageParam);
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
  });
}

/**
 * Send message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      content: string;
      type?: MessageType;
      replyToId?: string;
    }) => {
      if (DEMO_MODE) {
        const newMessage = {
          id: `demo-msg-${Date.now()}`,
          content: data.content,
          sender: { id: 'demo-user-1', full_name: 'أحمد' },
          created_at: new Date().toISOString(),
          is_read: true,
        };
        demoMessagesData.push(newMessage as any);
        return newMessage;
      }
      return chatApi.sendMessage(
        data.conversationId,
        data.content,
        data.type,
        data.replyToId
      );
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages(newMessage.conversationId),
      });

      const previousMessages = queryClient.getQueryData(
        queryKeys.chat.messages(newMessage.conversationId)
      );

      queryClient.setQueryData(
        queryKeys.chat.messages(newMessage.conversationId),
        (old: any) => {
          if (!old) return old;
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content: newMessage.content,
            type: newMessage.type || 'text',
            sender: { id: 'demo-user-1', full_name: 'أحمد' },
            created_at: new Date().toISOString(),
            is_sending: true,
          };
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                results: [...old.pages[0].results, optimisticMessage],
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(newMessage.conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: (message, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

/**
 * Send media message
 */
export function useSendMediaMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      mediaUri,
      type,
      caption,
    }: {
      conversationId: string;
      mediaUri: string;
      type: 'image' | 'video' | 'audio' | 'file';
      caption?: string;
    }) => {
      if (DEMO_MODE) {
        const newMessage = {
          id: `demo-msg-${Date.now()}`,
          content: caption || '',
          media_url: mediaUri,
          type,
          sender: { id: 'demo-user-1', full_name: 'أحمد' },
          created_at: new Date().toISOString(),
          is_read: true,
        };
        demoMessagesData.push(newMessage as any);
        return newMessage;
      }
      return chatApi.sendMediaMessage(conversationId, mediaUri, type, caption);
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

/**
 * Delete message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => {
      if (DEMO_MODE) {
        const index = demoMessagesData.findIndex(m => m.id === messageId);
        if (index !== -1) {
          demoMessagesData.splice(index, 1);
        }
        return { success: true };
      }
      return chatApi.deleteMessage(conversationId, messageId);
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId),
      });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (DEMO_MODE) {
        demoMessagesData.forEach(m => {
          (m as any).is_read = true;
        });
        return { success: true };
      }
      return chatApi.markAsRead(conversationId);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversation(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.unreadCount(),
      });
    },
  });
}

/**
 * Get unread count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.chat.unreadCount(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return { count: 2 };
      }
      return chatApi.getUnreadCount();
    },
    refetchInterval: DEMO_MODE ? undefined : 30000,
  });
}

/**
 * Add participants to group
 */
export function useAddParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userIds,
    }: {
      conversationId: string;
      userIds: string[];
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return chatApi.addParticipants(conversationId, userIds);
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversation(conversationId),
      });
    },
  });
}

/**
 * Remove participant from group
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return chatApi.removeParticipant(conversationId, userId);
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversation(conversationId),
      });
    },
  });
}

/**
 * Leave conversation
 */
export function useLeaveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return chatApi.leaveConversation(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

/**
 * Update conversation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: { name?: string; is_muted?: boolean };
    }) => {
      if (DEMO_MODE) {
        const conv = DEMO_CONVERSATIONS.find(c => c.id === conversationId);
        if (conv) {
          return { ...conv, ...data };
        }
        return null;
      }
      return chatApi.updateConversation(conversationId, data);
    },
    onSuccess: (conversation: any) => {
      if (conversation) {
        queryClient.setQueryData(
          queryKeys.chat.conversation(conversation.id),
          conversation
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations(),
        });
      }
    },
  });
}

/**
 * Search messages
 */
export function useSearchMessages(conversationId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.chat.messages(conversationId), 'search', query],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoMessagesData.filter(m =>
          m.content.toLowerCase().includes(query.toLowerCase())
        );
      }
      return chatApi.searchMessages(conversationId, query);
    },
    enabled: !!conversationId && query.length >= 2,
  });
}

/**
 * Get family chat (group chat for entire family)
 */
export function useFamilyChat(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.chat.conversations(), 'family', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_CONVERSATIONS[0]; // Family chat
      }
      return chatApi.getFamilyChat(familyId);
    },
    enabled: !!familyId,
  });
}
