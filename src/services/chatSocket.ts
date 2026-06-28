/**
 * Chat WebSocket client.
 *
 * Talks the Django Channels protocol used by core/chat/consumers.py — a raw
 * WebSocket at `ws(s)://<host>/ws/chat/<conversationId>/?token=<jwt>`, NOT
 * socket.io. One socket per open conversation. Sending is done over REST
 * (which the server now broadcasts), so this client is mainly for *receiving*
 * messages, typing indicators and presence in real time.
 */

import {API_BASE_URL} from './api/client';
import {useAuthStore} from '../store/authStore';

export interface SocketIncomingMessage {
  public_id: string;
  sender: {public_id: string; full_name: string; avatar?: string | null} | null;
  content: string;
  type: string;
  created: string;
  reply_to?: string | null;
}

export interface ChatSocketHandlers {
  onMessage?: (msg: SocketIncomingMessage) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onPresence?: (userId: string, online: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
}

/** Derive the websocket origin from the REST base URL. */
const wsOrigin = (): string =>
  API_BASE_URL.replace(/^http/i, 'ws').replace(/\/api\/?$/i, '');

export class ChatSocket {
  private ws: WebSocket | null = null;
  private conversationId: string;
  private handlers: ChatSocketHandlers;
  private closedByUs = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;

  constructor(conversationId: string, handlers: ChatSocketHandlers) {
    this.conversationId = conversationId;
    this.handlers = handlers;
  }

  connect() {
    const token = useAuthStore.getState().token;
    if (!token || !this.conversationId) {
      return;
    }
    this.closedByUs = false;
    const url = `${wsOrigin()}/ws/chat/${this.conversationId}/?token=${encodeURIComponent(
      token,
    )}`;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.handlers.onConnectionChange?.(true);
    };

    this.ws.onmessage = event => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (data.type) {
        case 'message':
          this.handlers.onMessage?.(data.message);
          break;
        case 'typing':
          this.handlers.onTyping?.(data.user_id, !!data.is_typing);
          break;
        case 'online':
          this.handlers.onPresence?.(data.user_id, true);
          break;
        case 'offline':
          this.handlers.onPresence?.(data.user_id, false);
          break;
        default:
          break;
      }
    };

    this.ws.onclose = () => {
      this.handlers.onConnectionChange?.(false);
      if (!this.closedByUs) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose fires next and handles reconnection.
    };
  }

  private scheduleReconnect() {
    if (this.closedByUs || this.reconnectTimer) {
      return;
    }
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * this.reconnectAttempts, 8000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /** Notify the room the user started/stopped typing. */
  sendTyping(isTyping: boolean) {
    this.send({action: isTyping ? 'typing' : 'stop_typing'});
  }

  /** Mark messages as read for read receipts. */
  markRead(messageIds: string[]) {
    if (messageIds.length) {
      this.send({action: 'read', message_ids: messageIds});
    }
  }

  disconnect() {
    this.closedByUs = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }
}
