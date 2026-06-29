/**
 * Local scheduled reminders (no Firebase).
 *
 * Uses Notifee trigger notifications (AlarmManager under the hood) to fire on
 * the device at the right time even with the app closed — entirely on-device:
 *   - Prayer-time alerts for today's fard prayers
 *   - Task deadlines (due date/time)
 *   - A daily nudge when hifz revisions are due
 *
 * Re-scheduled whenever the app opens / comes to the foreground. We cancel our
 * previously-scheduled triggers first so nothing piles up or duplicates.
 */

import notifee, {AndroidImportance, TriggerType, TimestampTrigger} from '@notifee/react-native';
import {usePrayerStore} from '../store/prayerStore';
import taskService from '../services/api/task.service';
import memorizationService from '../services/api/memorization.service';
import i18n from '../../i18n';

const CHANNEL_ID = 'usrah-reminders';
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

let channelReady = false;

async function ensureChannel() {
  if (channelReady) {
    return;
  }
  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
    });
    channelReady = true;
  } catch {
    /* permission denied / unsupported — scheduling becomes a no-op */
  }
}

async function scheduleAt(id: string, when: Date, title: string, body: string) {
  if (when.getTime() <= Date.now()) {
    return; // never schedule in the past
  }
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: when.getTime(),
  };
  try {
    await notifee.createTriggerNotification(
      {
        id,
        title,
        body,
        android: {channelId: CHANNEL_ID, smallIcon: 'ic_launcher', pressAction: {id: 'default'}},
      },
      trigger,
    );
  } catch {
    /* ignore individual scheduling failures */
  }
}

function atTimeToday(hhmm: string): Date | null {
  if (!hhmm || !hhmm.includes(':')) {
    return null;
  }
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

async function schedulePrayers() {
  const store = usePrayerStore.getState();
  let times = store.prayerTimes;
  if (!times || times.length === 0) {
    try {
      await store.fetchPrayerTimes();
      times = usePrayerStore.getState().prayerTimes;
    } catch {
      return;
    }
  }
  for (const p of times) {
    if (!FARD.includes(p.key) || !p.time) {
      continue;
    }
    const when = atTimeToday(p.time);
    if (!when) {
      continue;
    }
    const name = i18n.t(`islamic.prayers.${p.key}`, {defaultValue: p.name});
    await scheduleAt(
      `prayer-${p.key}`,
      when,
      i18n.t('reminders.prayerTitle', {defaultValue: 'Prayer time'}),
      i18n.t('reminders.prayerBody', {name, defaultValue: `It's time for ${name}`}),
    );
  }
}

async function scheduleTasks() {
  try {
    const tasks = await taskService.getTasks();
    for (const task of tasks) {
      if (task.status === 'completed' || !task.due_date) {
        continue;
      }
      const time = task.due_time || '09:00';
      const when = new Date(`${task.due_date}T${time}`);
      if (Number.isNaN(when.getTime())) {
        continue;
      }
      await scheduleAt(
        `task-${task.id}`,
        when,
        i18n.t('reminders.taskTitle', {defaultValue: 'Task due'}),
        task.title,
      );
    }
  } catch {
    /* best-effort */
  }
}

async function scheduleRevision() {
  try {
    const due = await memorizationService.due();
    if (due.length === 0) {
      return;
    }
    // Tomorrow 8am nudge (today's is handled by the in-app "due" list).
    const when = new Date();
    when.setDate(when.getDate() + 1);
    when.setHours(8, 0, 0, 0);
    await scheduleAt(
      'hifz-revision',
      when,
      i18n.t('reminders.revisionTitle', {defaultValue: 'Revision due'}),
      i18n.t('reminders.revisionBody', {count: due.length, defaultValue: `${due.length} item(s) to revise`}),
    );
  } catch {
    /* best-effort */
  }
}

/** (Re)schedule all local reminders. Safe to call repeatedly. */
export async function scheduleReminders() {
  await ensureChannel();
  if (!channelReady) {
    return;
  }
  try {
    await notifee.cancelTriggerNotifications();
  } catch {
    /* ignore */
  }
  await schedulePrayers();
  await scheduleTasks();
  await scheduleRevision();
}
