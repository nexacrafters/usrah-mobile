/**
 * Sunnah-of-the-day API service.
 * GET /islamic/sunnah/ -> the Hijri date + recommended acts/occasions for today
 * (white days, Mon/Thu fasting, Jumuʿah sunan, ʿArafah, ʿĀshūrāʾ, Eids, etc.).
 */

import apiClient, {handleApiError} from './client';

export type SunnahKind = 'fast' | 'occasion' | 'sunnah' | 'eid';

export interface SunnahItem {
  id: string;
  kind: SunnahKind;
  title_en: string;
  title_ar: string;
  note_en: string;
  note_ar: string;
}

export interface SunnahToday {
  hijri: {
    day: number;
    month: number;
    year: number;
    month_name: string;
    weekday: string;
    formatted: string;
  };
  gregorian: string;
  weekday: number;
  items: SunnahItem[];
}

class SunnahService {
  async today(): Promise<SunnahToday | null> {
    try {
      const res = await apiClient.get<SunnahToday>('/islamic/sunnah/');
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new SunnahService();
