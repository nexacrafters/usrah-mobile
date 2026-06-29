/**
 * Locale-aware date/time formatting.
 *
 * Honours the app's selected language (not the device locale), so dates show
 * Arabic month/weekday names when the app is in Arabic — while keeping Western
 * digits (0-9) via the `-nu-latn` Unicode extension, which is the project's
 * established numbering preference. Money is formatted elsewhere with 'en-US'
 * on purpose (Western digits) and is unaffected by this.
 */
import i18n from '../../i18n';

/** BCP-47 tag for the active app language, forcing Western digits. */
export function localeTag(): string {
  return i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : 'en-US';
}

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'short', year: 'numeric'},
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return safe(() => d.toLocaleDateString(localeTag(), options), d.toDateString());
}

export function formatTime(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {hour: 'numeric', minute: '2-digit'},
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return safe(() => d.toLocaleTimeString(localeTag(), options), '');
}
