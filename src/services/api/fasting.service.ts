/**
 * Fasting tracker API service — maps to core/islamic fasting endpoints.
 *   GET  /islamic/fasting/         -> FastingLog[]
 *   POST /islamic/fasting/  {date, type, status}
 *   GET  /islamic/fasting/stats/   -> stats
 */

import apiClient, {handleApiError, unwrapList} from './client';

export type FastType = 'ramadan' | 'sunnah' | 'qada' | 'kaffarah' | 'nadhr' | 'voluntary';

export interface FastingLog {
  public_id: string;
  date: string;
  type: FastType;
  status: string;
  notes?: string;
  created: string;
}

class FastingService {
  async list(): Promise<FastingLog[]> {
    try {
      const res = await apiClient.get('/islamic/fasting/');
      return unwrapList<FastingLog>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async log(date: string, type: FastType): Promise<FastingLog> {
    try {
      const res = await apiClient.post<FastingLog>('/islamic/fasting/', {
        date,
        type,
        status: 'completed',
      });
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async stats(): Promise<any> {
    try {
      const res = await apiClient.get('/islamic/fasting/stats/');
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new FastingService();
