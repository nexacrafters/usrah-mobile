/**
 * Locale-aware date/time formatting.
 *
 * Honours the app's selected language (not the device locale), so dates show
 * Arabic month/weekday names when the app is in Arabic — while keeping the
 * 0-9 numerals via the `-nu-latn` Unicode extension. Those 0-9 glyphs are the
 * original Hindu-Arabic (Ghubar) numerals transmitted by al-Khwārizmī; the app
 * uses them everywhere and never the Eastern-Arabic ٠-٩ forms. Money is
 * formatted elsewhere with the same 0-9 numerals and is unaffected by this.
 */
import i18n from '../../i18n';

/** BCP-47 tag for the active app language, forcing the 0-9 numerals. */
export function localeTag(): string {
  return i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : 'en-US';
}

/**
 * Force the original Arabic (al-Khwārizmī / Hindu-Arabic) 0-9 numerals: map any
 * Eastern Arabic-Indic (٠-٩) or Persian (۰-۹) digits back to 0-9, in case the
 * JS engine ignores the `-nu-latn` locale hint. The app uses 0-9 everywhere.
 */
export function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
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
  return normalizeDigits(
    safe(() => d.toLocaleDateString(localeTag(), options), d.toDateString()),
  );
}

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

/**
 * Format a Hijri date with Arabic month names in Arabic mode (the server sends
 * English month names). Digits stay 0-9.
 */
export function formatHijri(
  day: number,
  month: number,
  year: number,
  monthNameEn?: string,
): string {
  const isAr = i18n.language?.startsWith('ar');
  if (isAr && month >= 1 && month <= 12) {
    return `${day} ${HIJRI_MONTHS_AR[month - 1]} ${year}`;
  }
  return `${day} ${monthNameEn || ''} ${year}`.trim();
}

export function formatTime(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {hour: 'numeric', minute: '2-digit'},
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return normalizeDigits(safe(() => d.toLocaleTimeString(localeTag(), options), ''));
}
