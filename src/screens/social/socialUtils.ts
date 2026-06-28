/**
 * Shared helpers for the social / Circles feature.
 */

import {TFunction} from 'i18next';
import {ReactionType} from '../../services/api/social.service';

/** Sum all reaction counts in a reactions_summary map. */
export function sumReactions(
  summary: Partial<Record<ReactionType, number>> | undefined | null,
): number {
  if (!summary) return 0;
  return Object.values(summary).reduce(
    (acc, n) => acc + (typeof n === 'number' ? n : 0),
    0,
  );
}

/**
 * Format an ISO timestamp as a short relative time using the `social`
 * translation namespace (justNow / minutesAgo / hoursAgo / daysAgo).
 * Falls back to a locale date string for anything older than ~30 days.
 */
export function formatRelativeTime(iso: string | undefined, t: TFunction): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return t('social.justNow');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('social.minutesAgo', {count: diffMin});
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t('social.hoursAgo', {count: diffHour});
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay <= 30) return t('social.daysAgo', {count: diffDay});

  return new Date(iso).toLocaleDateString();
}
