/**
 * Chat API Service
 * Maps to core/chat endpoints. Conversation/message ids are `public_id` (UUID).
 *
 * Routes (confirmed from core/chat/urls.py + serializers.py + views.py):
 *   GET  /chat/conversations/                                  -> ConversationListSerializer[] (paginated)
 *   GET  /chat/conversations/<conversation_id>/messages/       -> MessageSerializer[] (paginated, newest first)
 *   POST /chat/conversations/<conversation_id>/messages/send/  {content} -> MessageSerializer
 */

import apiClient, {handleApiError, unwrapList} from './client';
import type {ApiUser} from '../../store/authStore';

/** Nested user shape from UserMiniSerializer. */
export interface ChatUser {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** Last-message preview embedded in a conversation list item. */
export interface ConversationLastMessage {
  content: string;
  type: string;
  sender_name: string;
  created: string;
}

/** Item from ConversationListSerializer. */
export interface Conversation {
  public_id: string;
  name: string | null;
  type: string;
  avatar?: string | null;
  is_encrypted: boolean;
  last_message: ConversationLastMessage | null;
  last_message_at: string | null;
  unread_count: number;
  display_name: string;
  display_avatar: string | null;
}

/** Item from MessageSerializer. */
export interface Message {
  public_id: string;
  conversation: string;
  sender: ChatUser | null;
  type: string;
  content: string;
  status?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  created: string;
  updated?: string;
}

class ChatService {
  /** List all conversations for the current user. */
  async listConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get('/chat/conversations/');
      return unwrapList<Conversation>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List messages in a conversation (API returns newest first). */
  async listMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get(
        `/chat/conversations/${conversationId}/messages/`,
      );
      return unwrapList<Message>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Send a text message to a conversation. */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    try {
      const response = await apiClient.post<Message>(
        `/chat/conversations/${conversationId}/messages/send/`,
        {content},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

/** Re-exported so callers can compare against the auth store user. */
export type {ApiUser};

export default new ChatService();
