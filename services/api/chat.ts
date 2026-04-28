/**
 * Chat API Service
 * Handles conversations, messages, and read receipts
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Conversation,
  Message,
  ConversationType,
  MessageType,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreateConversationRequest {
  family_id: string;
  type: ConversationType;
  name?: string;
  participant_ids: string[];
}

interface SendMessageRequest {
  content: string;
  message_type?: MessageType;
  reply_to_id?: string;
  media_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Chat API Service
 */
export const chatApi = {
  // ==================== Conversations ====================

  /**
   * Get list of conversations
   */
  async getConversations(familyId: string): Promise<Conversation[]> {
    const response = await apiClient.get<{ results: Conversation[] }>(
      `${ENDPOINTS.chat.conversations}?family_id=${familyId}`
    );
    return response.results;
  },

  /**
   * Get a single conversation
   */
  async getConversation(id: string): Promise<Conversation> {
    return apiClient.get<Conversation>(ENDPOINTS.chat.conversationDetail(id));
  },

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    return apiClient.post<Conversation>(ENDPOINTS.chat.conversations, data);
  },

  /**
   * Get or create direct conversation with a user
   */
  async getOrCreateDirect(familyId: string, userId: string): Promise<Conversation> {
    // Try to find existing direct conversation
    const conversations = await this.getConversations(familyId);
    const existingDirect = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some((p) => p.id === userId || p.public_id === userId)
    );

    if (existingDirect) {
      return existingDirect;
    }

    // Create new direct conversation
    return this.createConversation({
      family_id: familyId,
      type: 'direct',
      participant_ids: [userId],
    });
  },

  /**
   * Get family group conversation
   */
  async getFamilyConversation(familyId: string): Promise<Conversation | null> {
    const conversations = await this.getConversations(familyId);
    return conversations.find((c) => c.type === 'family') || null;
  },

  // ==================== Messages ====================

  /**
   * Get messages in a conversation (paginated)
   */
  async getMessages(
    conversationId: string,
    page: number = 1
  ): Promise<PaginatedResponse<Message> & { page: number }> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      `${ENDPOINTS.chat.messages(conversationId)}?page=${page}`
    );
    return { ...response, page };
  },

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type?: MessageType,
    replyToId?: string
  ): Promise<Message> {
    return apiClient.post<Message>(ENDPOINTS.chat.messages(conversationId), {
      content,
      message_type: type || 'text',
      reply_to_id: replyToId,
    });
  },

  /**
   * Create direct message conversation
   */
  async createDirectMessage(familyId: string, userId: string): Promise<Conversation> {
    return this.getOrCreateDirect(familyId, userId);
  },

  /**
   * Send media message
   */
  async sendMediaMessage(
    conversationId: string,
    mediaUri: string,
    type: 'image' | 'video' | 'audio' | 'file',
    caption?: string
  ): Promise<Message> {
    const messageType: MessageType = type === 'audio' ? 'voice' : type;
    const media = await this.uploadMedia({
      uri: mediaUri,
      type: `${type}/*`,
      name: `${type}.${type === 'audio' ? 'm4a' : type === 'image' ? 'jpg' : 'mp4'}`,
    });

    return apiClient.post<Message>(ENDPOINTS.chat.messages(conversationId), {
      content: caption || '',
      message_type: messageType,
      media_url: media.url,
    });
  },

  /**
   * Delete a message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.chat.messageDetail(messageId));
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    return apiClient.patch<Message>(ENDPOINTS.chat.messageDetail(messageId), {
      content,
    });
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    return apiClient.post(`${ENDPOINTS.chat.conversationDetail(conversationId)}/read/`, {});
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ total: number; by_conversation: Record<string, number> }> {
    return apiClient.get('/chat/unread/');
  },

  /**
   * Add participants to group
   */
  async addParticipants(conversationId: string, userIds: string[]): Promise<Conversation> {
    return apiClient.post(
      `${ENDPOINTS.chat.conversationDetail(conversationId)}/participants/`,
      { user_ids: userIds }
    );
  },

  /**
   * Remove participant from group
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    return apiClient.delete(
      `${ENDPOINTS.chat.conversationDetail(conversationId)}/participants/${userId}/`
    );
  },

  /**
   * Leave conversation
   */
  async leaveConversation(conversationId: string): Promise<void> {
    return apiClient.post(
      `${ENDPOINTS.chat.conversationDetail(conversationId)}/leave/`,
      {}
    );
  },

  /**
   * Update conversation settings
   */
  async updateConversation(
    conversationId: string,
    data: { name?: string; is_muted?: boolean }
  ): Promise<Conversation> {
    return apiClient.patch(ENDPOINTS.chat.conversationDetail(conversationId), data);
  },

  /**
   * Search messages in conversation
   */
  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    const response = await apiClient.get<{ results: Message[] }>(
      `${ENDPOINTS.chat.messages(conversationId)}?search=${encodeURIComponent(query)}`
    );
    return response.results;
  },

  /**
   * Get family chat
   */
  async getFamilyChat(familyId: string): Promise<Conversation | null> {
    return this.getFamilyConversation(familyId);
  },

  // ==================== Media ====================

  /**
   * Upload media for message
   */
  async uploadMedia(file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<{ url: string; type: MessageType }> {
    const formData = new FormData();
    formData.append('file', file as any);

    const response = await apiClient.uploadFile<{ url: string; type: string }>(
      '/chat/upload/',
      formData
    );

    let messageType: MessageType = 'file';
    if (response.type.startsWith('image/')) {
      messageType = 'image';
    } else if (response.type.startsWith('video/')) {
      messageType = 'video';
    } else if (response.type.startsWith('audio/')) {
      messageType = 'voice';
    }

    return {
      url: response.url,
      type: messageType,
    };
  },

  /**
   * Send image message
   */
  async sendImage(
    conversationId: string,
    imageUri: string,
    caption?: string
  ): Promise<Message> {
    const media = await this.uploadMedia({
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    return this.sendMessage(conversationId, {
      content: caption || '',
      message_type: 'image',
      media_url: media.url,
    });
  },

  /**
   * Send voice message
   */
  async sendVoice(
    conversationId: string,
    audioUri: string,
    duration: number
  ): Promise<Message> {
    const media = await this.uploadMedia({
      uri: audioUri,
      type: 'audio/m4a',
      name: 'voice.m4a',
    });

    return this.sendMessage(conversationId, {
      content: '',
      message_type: 'voice',
      media_url: media.url,
      metadata: { duration },
    });
  },
};
