/**
 * Notification Center (no Firebase).
 *
 * Shows real notifications on the phone using the local Notifee channel, driven
 * entirely by our own usrah-api:
 *   1. WebSocket (`/ws/notifications/`) — instant delivery while connected.
 *   2. Polling `/notifications/?is_read=false` every 45s — the guaranteed path
 *      that works regardless of the server's channel-layer / process model.
 *
 * Both dedupe on the notification's public_id, and we baseline existing unread
 * notifications on startup so we never spam old ones.
 */

import notifee, {AndroidImportance} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {API_BASE_URL} from './api/client';
import {useAuthStore} from '../store/authStore';

const SEEN_KEY = 'notif_seen_v1';
const CHANNEL_ID = 'usrah-default';
const POLL_MS = 45000;

let channelReady = false;
let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let started = false;
let baselined = false;
let seen = new Set<string>();

interface ServerNotification {
  public_id: string;
  title: string;
  message: string;
  notification_type?: string;
  metadata?: Record<string, unknown>;
}

async function ensureChannel() {
  if (channelReady) {
    return;
  }
  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Usrah',
      importance: AndroidImportance.HIGH,
    });
    channelReady = true;
  } catch {
    // permission denied / platform without notifee — polling still no-ops safely
  }
}

async function display(n: ServerNotification) {
  await ensureChannel();
  if (!channelReady) {
    return;
  }
  try {
    await notifee.displayNotification({
      title: n.title || 'Usrah',
      body: n.message || '',
      data: (n.metadata as Record<string, string>) || {},
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
      },
    });
  } catch {
    // non-fatal
  }
}

async function persistSeen() {
  try {
    const arr = Array.from(seen).slice(-200); // cap memory/storage
    seen = new Set(arr);
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

async function handle(n: ServerNotification) {
  if (!n?.public_id || seen.has(n.public_id)) {
    return;
  }
  seen.add(n.public_id);
  await display(n);
  await persistSeen();
}

async function poll() {
  if (!useAuthStore.getState().token) {
    return;
  }
  try {
    const res = await apiClient.get('/notifications/', {
      params: {is_read: 'false'},
    });
    const data: any = res.data;
    const list: ServerNotification[] = Array.isArray(data)
      ? data
      : data?.results ?? [];

    if (!baselined) {
      // First run after start: mark current unread as seen WITHOUT alerting,
      // so we only notify for things that arrive from now on.
      list.forEach(n => seen.add(n.public_id));
      baselined = true;
      await persistSeen();
      return;
    }
    for (const n of list) {
      await handle(n);
    }
  } catch {
    // offline / transient — try again on the next tick
  }
}

function connectWs() {
  const token = useAuthStore.getState().token;
  if (!token || !started) {
    return;
  }
  const origin = API_BASE_URL.replace(/^http/i, 'ws').replace(/\/api\/?$/i, '');
  try {
    ws = new WebSocket(
      `${origin}/ws/notifications/?token=${encodeURIComponent(token)}`,
    );
  } catch {
    return;
  }
  ws.onmessage = event => {
    try {
      const d = JSON.parse(event.data);
      if (d.type === 'notification' && d.notification) {
        void handle(d.notification);
      }
    } catch {
      // ignore malformed frames
    }
  };
  ws.onclose = () => {
    ws = null;
    if (started) {
      setTimeout(connectWs, 5000);
    }
  };
  ws.onerror = () => {
    // onclose handles reconnect
  };
}

/** Start delivering notifications for the signed-in user. Idempotent. */
export async function startNotificationCenter() {
  if (started) {
    return;
  }
  started = true;
  baselined = false;
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    if (raw) {
      seen = new Set(JSON.parse(raw));
    }
  } catch {
    seen = new Set();
  }
  await ensureChannel();
  await poll(); // establishes the baseline
  connectWs();
  pollTimer = setInterval(poll, POLL_MS);
}

/** Stop on sign-out. */
export function stopNotificationCenter() {
  started = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (ws) {
    try {
      ws.close();
    } catch {
      // ignore
    }
    ws = null;
  }
}

/** Poll immediately (e.g. when the app returns to the foreground). */
export function pokeNotificationCenter() {
  if (started) {
    void poll();
  }
}
