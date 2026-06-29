/**
 * Muḥāsabah (nightly self-account) API service.
 *   GET  /islamic/muhasaba/?date=YYYY-MM-DD  -> today's reflection (or {exists:false})
 *   POST /islamic/muhasaba/  {date, ...fields}  -> upserted reflection
 */

import apiClient, {handleApiError} from './client';

export interface Reflection {
  date: string;
  prayed_all_fard: boolean;
  read_quran: boolean;
  did_adhkar: boolean;
  gave_sadaqah: boolean;
  good_deed: string;
  avoided_sin: string;
  gratitude: string;
  istighfar_count: number;
  rating: number;
  notes: string;
  exists?: boolean;
}

const EMPTY = (date: string): Reflection => ({
  date,
  prayed_all_fard: false,
  read_quran: false,
  did_adhkar: false,
  gave_sadaqah: false,
  good_deed: '',
  avoided_sin: '',
  gratitude: '',
  istighfar_count: 0,
  rating: 3,
  notes: '',
});

class MuhasabaService {
  async get(date: string): Promise<Reflection> {
    try {
      const res = await apiClient.get('/islamic/muhasaba/', {params: {date}});
      const d = res.data;
      return d?.exists ? d : EMPTY(date);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async save(data: Partial<Reflection> & {date: string}): Promise<Reflection> {
    try {
      const res = await apiClient.post('/islamic/muhasaba/', data);
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new MuhasabaService();
