/**
 * Zakat API Service
 * Handles Zakat assets, calculations, and liabilities
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  ZakatAsset,
  ZakatCalculation,
  ZakatCalculationResult,
  Liability,
  ZakatAssetType,
} from '../../types/models';

// Request interfaces
interface CreateZakatAssetRequest {
  family_id: string;
  name: string;
  type: ZakatAssetType;
  value: number;
  currency?: string;
  acquisition_date: string;
  is_zakatable?: boolean;
  notes?: string;
  weight_grams?: number;
}

interface CalculateZakatRequest {
  family_id: string;
  gold_price_per_gram: number;
  silver_price_per_gram: number;
  currency?: string;
  save_calculation?: boolean;
}

interface CreateLiabilityRequest {
  family_id: string;
  name: string;
  type: 'loan' | 'mortgage' | 'credit_card' | 'personal' | 'other';
  total_amount: number;
  remaining_amount: number;
  currency?: string;
  due_date?: string;
  is_deductible?: boolean;
  notes?: string;
}

/**
 * Zakat API Service
 */
export const zakatApi = {
  // ==================== Assets ====================

  /**
   * Get Zakat assets
   */
  async getAssets(familyId: string): Promise<ZakatAsset[]> {
    const response = await apiClient.get<{ results: ZakatAsset[] }>(
      `${ENDPOINTS.zakat.assets}?family_id=${familyId}`
    );
    return response.results;
  },

  /**
   * Get a single asset
   */
  async getAsset(id: string): Promise<ZakatAsset> {
    return apiClient.get<ZakatAsset>(ENDPOINTS.zakat.assetDetail(id));
  },

  /**
   * Create a Zakat asset
   */
  async createAsset(data: CreateZakatAssetRequest): Promise<ZakatAsset> {
    return apiClient.post<ZakatAsset>(ENDPOINTS.zakat.assets, data);
  },

  /**
   * Update a Zakat asset
   */
  async updateAsset(id: string, data: Partial<CreateZakatAssetRequest>): Promise<ZakatAsset> {
    return apiClient.patch<ZakatAsset>(ENDPOINTS.zakat.assetDetail(id), data);
  },

  /**
   * Delete a Zakat asset
   */
  async deleteAsset(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.zakat.assetDetail(id));
  },

  // ==================== Calculation ====================

  /**
   * Calculate Zakat
   */
  async calculate(data: CalculateZakatRequest): Promise<ZakatCalculationResult> {
    return apiClient.post<ZakatCalculationResult>(ENDPOINTS.zakat.calculate, data);
  },

  /**
   * Get calculation history
   */
  async getCalculations(familyId: string): Promise<ZakatCalculation[]> {
    const response = await apiClient.get<{ results: ZakatCalculation[] }>(
      `${ENDPOINTS.zakat.calculations}?family_id=${familyId}`
    );
    return response.results;
  },

  /**
   * Mark Zakat as paid
   */
  async markPaid(
    calculationId: string,
    paidAmount: number,
    paidDate?: string
  ): Promise<ZakatCalculation> {
    return apiClient.post<ZakatCalculation>(ENDPOINTS.zakat.markPaid(calculationId), {
      paid_amount: paidAmount,
      paid_date: paidDate || new Date().toISOString().split('T')[0],
    });
  },

  // ==================== Liabilities ====================

  /**
   * Get liabilities
   */
  async getLiabilities(familyId: string): Promise<Liability[]> {
    const response = await apiClient.get<{ results: Liability[] }>(
      `${ENDPOINTS.zakat.liabilities}?family_id=${familyId}`
    );
    return response.results;
  },

  /**
   * Create a liability
   */
  async createLiability(data: CreateLiabilityRequest): Promise<Liability> {
    return apiClient.post<Liability>(ENDPOINTS.zakat.liabilities, data);
  },

  /**
   * Update a liability
   */
  async updateLiability(id: string, data: Partial<CreateLiabilityRequest>): Promise<Liability> {
    return apiClient.patch<Liability>(`${ENDPOINTS.zakat.liabilities}${id}/`, data);
  },

  /**
   * Delete a liability
   */
  async deleteLiability(id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.zakat.liabilities}${id}/`);
  },

  // ==================== Helpers ====================

  /**
   * Get current gold/silver prices (mock for now, should use external API)
   */
  async getCurrentMetalPrices(): Promise<{
    gold_per_gram: number;
    silver_per_gram: number;
    currency: string;
    updated_at: string;
  }> {
    // TODO: Integrate with a real metal prices API
    // For now, return approximate values in SAR
    return {
      gold_per_gram: 250, // ~250 SAR per gram
      silver_per_gram: 3, // ~3 SAR per gram
      currency: 'SAR',
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Calculate nisab threshold
   */
  calculateNisab(
    goldPricePerGram: number,
    silverPricePerGram: number
  ): { gold_nisab: number; silver_nisab: number; nisab: number; nisab_type: 'gold' | 'silver' } {
    const GOLD_NISAB_GRAMS = 85;
    const SILVER_NISAB_GRAMS = 595;

    const goldNisab = GOLD_NISAB_GRAMS * goldPricePerGram;
    const silverNisab = SILVER_NISAB_GRAMS * silverPricePerGram;

    // Use the lower of the two
    const nisab = Math.min(goldNisab, silverNisab);
    const nisabType = silverNisab < goldNisab ? 'silver' : 'gold';

    return {
      gold_nisab: goldNisab,
      silver_nisab: silverNisab,
      nisab,
      nisab_type: nisabType,
    };
  },

  /**
   * Calculate Zakat amount
   */
  calculateZakatAmount(totalAssets: number, liabilities: number = 0): number {
    const ZAKAT_RATE = 0.025; // 2.5%
    const netAssets = Math.max(0, totalAssets - liabilities);
    return netAssets * ZAKAT_RATE;
  },
};
