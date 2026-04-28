/**
 * Zakat Query Hooks
 * React Query hooks for Zakat calculation
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zakatApi } from '../../services/api/zakat';
import { queryKeys } from '../../services/queryClient';
import { DEMO_MODE } from '../../services/demoMode';
import type { ZakatAsset, ZakatLiability, ZakatCalculation } from '../../types/models';

// Demo Zakat data
const DEMO_ZAKAT_ASSETS = [
  { id: '1', asset_type: 'cash', value: 10000, currency: 'TND', description: 'حساب بنكي', is_zakatable: true, family_id: 'demo-family-1' },
  { id: '2', asset_type: 'gold', value: 5000, currency: 'TND', weight_grams: 50, purity: 0.9, description: 'مجوهرات ذهبية', is_zakatable: true, family_id: 'demo-family-1' },
  { id: '3', asset_type: 'silver', value: 500, currency: 'TND', weight_grams: 200, purity: 0.925, description: 'فضة', is_zakatable: true, family_id: 'demo-family-1' },
];

const DEMO_ZAKAT_LIABILITIES = [
  { id: '1', liability_type: 'debt', amount: 2000, currency: 'TND', description: 'قرض شخصي', is_deductible: true, family_id: 'demo-family-1' },
];

const DEMO_NISAB = {
  gold_grams: 85,
  silver_grams: 595,
  gold_price_per_gram: 250, // TND
  silver_price_per_gram: 3, // TND
  gold_nisab_value: 21250, // TND
  silver_nisab_value: 1785, // TND
};

/**
 * Get Zakat assets
 */
export function useZakatAssets(familyId: string) {
  return useQuery({
    queryKey: queryKeys.zakat.assets(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_ZAKAT_ASSETS;
      }
      return zakatApi.getAssets(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get single asset
 */
export function useZakatAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.zakat.asset(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_ZAKAT_ASSETS.find(a => a.id === id) || null;
      }
      return zakatApi.getAsset(id);
    },
    enabled: !!id,
  });
}

/**
 * Create Zakat asset
 */
export function useCreateZakatAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      asset_type: ZakatAsset['asset_type'];
      value: number;
      currency?: string;
      weight_grams?: number;
      purity?: number;
      description?: string;
      is_zakatable?: boolean;
    }) => {
      if (DEMO_MODE) {
        const newAsset = { id: `demo-asset-${Date.now()}`, ...data };
        (DEMO_ZAKAT_ASSETS as any[]).push(newAsset);
        return newAsset;
      }
      return zakatApi.createAsset(data);
    },
    onSuccess: (asset: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.assets(asset.family_id),
      });
    },
  });
}

/**
 * Update Zakat asset
 */
export function useUpdateZakatAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ZakatAsset> }) => {
      if (DEMO_MODE) {
        const index = DEMO_ZAKAT_ASSETS.findIndex(a => a.id === id);
        if (index !== -1) {
          (DEMO_ZAKAT_ASSETS as any[])[index] = { ...DEMO_ZAKAT_ASSETS[index], ...data };
          return DEMO_ZAKAT_ASSETS[index];
        }
        return null;
      }
      return zakatApi.updateAsset(id, data);
    },
    onSuccess: (asset: any) => {
      if (asset) {
        queryClient.setQueryData(queryKeys.zakat.asset(asset.id), asset);
        queryClient.invalidateQueries({
          queryKey: queryKeys.zakat.assets(asset.family_id),
        });
      }
    },
  });
}

/**
 * Delete Zakat asset
 */
export function useDeleteZakatAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      if (DEMO_MODE) {
        const index = DEMO_ZAKAT_ASSETS.findIndex(a => a.id === id);
        if (index !== -1) {
          (DEMO_ZAKAT_ASSETS as any[]).splice(index, 1);
        }
        return familyId;
      }
      return zakatApi.deleteAsset(id).then(() => familyId);
    },
    onSuccess: (familyId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.assets(familyId as string),
      });
    },
  });
}

/**
 * Get Zakat liabilities
 */
export function useZakatLiabilities(familyId: string) {
  return useQuery({
    queryKey: queryKeys.zakat.liabilities(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_ZAKAT_LIABILITIES;
      }
      return zakatApi.getLiabilities(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Create Zakat liability
 */
export function useCreateZakatLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      liability_type: ZakatLiability['liability_type'];
      amount: number;
      currency?: string;
      description?: string;
      is_deductible?: boolean;
    }) => {
      if (DEMO_MODE) {
        const newLiability = { id: `demo-liability-${Date.now()}`, ...data };
        (DEMO_ZAKAT_LIABILITIES as any[]).push(newLiability);
        return newLiability;
      }
      return zakatApi.createLiability(data);
    },
    onSuccess: (liability: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.liabilities(liability.family_id),
      });
    },
  });
}

/**
 * Update Zakat liability
 */
export function useUpdateZakatLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ZakatLiability> }) => {
      if (DEMO_MODE) {
        const index = DEMO_ZAKAT_LIABILITIES.findIndex(l => l.id === id);
        if (index !== -1) {
          (DEMO_ZAKAT_LIABILITIES as any[])[index] = { ...DEMO_ZAKAT_LIABILITIES[index], ...data };
          return DEMO_ZAKAT_LIABILITIES[index];
        }
        return null;
      }
      return zakatApi.updateLiability(id, data);
    },
    onSuccess: (liability: any) => {
      if (liability) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.zakat.liabilities(liability.family_id),
        });
      }
    },
  });
}

/**
 * Delete Zakat liability
 */
export function useDeleteZakatLiability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      if (DEMO_MODE) {
        const index = DEMO_ZAKAT_LIABILITIES.findIndex(l => l.id === id);
        if (index !== -1) {
          (DEMO_ZAKAT_LIABILITIES as any[]).splice(index, 1);
        }
        return familyId;
      }
      return zakatApi.deleteLiability(id).then(() => familyId);
    },
    onSuccess: (familyId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.liabilities(familyId as string),
      });
    },
  });
}

/**
 * Get Zakat calculations history
 */
export function useZakatCalculations(familyId: string) {
  return useQuery({
    queryKey: queryKeys.zakat.calculations(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          {
            id: '1',
            family_id: 'demo-family-1',
            calculation_date: '2026-04-01',
            total_assets: 15500,
            total_liabilities: 2000,
            net_worth: 13500,
            nisab_threshold: DEMO_NISAB.silver_nisab_value,
            is_above_nisab: true,
            zakat_amount: 337.5, // 2.5% of 13500
            is_paid: false,
            currency: 'TND',
          },
        ];
      }
      return zakatApi.getCalculations(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get single calculation
 */
export function useZakatCalculation(id: string) {
  return useQuery({
    queryKey: queryKeys.zakat.calculation(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          id,
          family_id: 'demo-family-1',
          calculation_date: '2026-04-01',
          total_assets: 15500,
          total_liabilities: 2000,
          net_worth: 13500,
          nisab_threshold: DEMO_NISAB.silver_nisab_value,
          is_above_nisab: true,
          zakat_amount: 337.5,
          is_paid: false,
          currency: 'TND',
        };
      }
      return zakatApi.getCalculation(id);
    },
    enabled: !!id,
  });
}

/**
 * Calculate Zakat
 */
export function useCalculateZakat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      calculation_date?: string;
      gold_price_per_gram?: number;
      silver_price_per_gram?: number;
    }) => {
      if (DEMO_MODE) {
        const totalAssets = DEMO_ZAKAT_ASSETS.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = DEMO_ZAKAT_LIABILITIES.reduce((sum, l) => sum + l.amount, 0);
        const netWorth = totalAssets - totalLiabilities;
        const isAboveNisab = netWorth >= DEMO_NISAB.silver_nisab_value;
        const zakatAmount = isAboveNisab ? netWorth * 0.025 : 0;

        return {
          id: `demo-calc-${Date.now()}`,
          family_id: data.family_id,
          calculation_date: data.calculation_date || new Date().toISOString().split('T')[0],
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          nisab_threshold: DEMO_NISAB.silver_nisab_value,
          is_above_nisab: isAboveNisab,
          zakat_amount: zakatAmount,
          is_paid: false,
          currency: 'TND',
        };
      }
      return zakatApi.calculateZakat(data);
    },
    onSuccess: (calculation: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.calculations(calculation.family_id),
      });
    },
  });
}

/**
 * Mark Zakat as paid
 */
export function useMarkZakatPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calculationId,
      paidAmount,
      paidDate,
    }: {
      calculationId: string;
      paidAmount: number;
      paidDate?: string;
    }) => {
      if (DEMO_MODE) {
        return {
          id: calculationId,
          family_id: 'demo-family-1',
          is_paid: true,
          paid_amount: paidAmount,
          paid_date: paidDate || new Date().toISOString().split('T')[0],
        };
      }
      return zakatApi.markPaid(calculationId, paidAmount, paidDate);
    },
    onSuccess: (calculation: any) => {
      queryClient.setQueryData(
        queryKeys.zakat.calculation(calculation.id),
        calculation
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.zakat.calculations(calculation.family_id),
      });
    },
  });
}

/**
 * Get current Nisab
 */
export function useNisab() {
  return useQuery({
    queryKey: queryKeys.zakat.nisab(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_NISAB;
      }
      return zakatApi.getNisab();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - Nisab doesn't change often
  });
}

/**
 * Check if eligible for Zakat
 */
export function useZakatEligibility(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.zakat.all, 'eligibility', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const totalAssets = DEMO_ZAKAT_ASSETS.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = DEMO_ZAKAT_LIABILITIES.reduce((sum, l) => sum + l.amount, 0);
        const netWorth = totalAssets - totalLiabilities;
        return {
          is_eligible: netWorth >= DEMO_NISAB.silver_nisab_value,
          net_worth: netWorth,
          nisab_threshold: DEMO_NISAB.silver_nisab_value,
          estimated_zakat: netWorth * 0.025,
        };
      }
      return zakatApi.checkEligibility(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Calculate asset value (local helper)
 */
export function useAssetValue(
  assetType: ZakatAsset['asset_type'],
  amount: number,
  goldPrice: number,
  silverPrice: number
) {
  if (assetType === 'gold') {
    return amount * goldPrice;
  } else if (assetType === 'silver') {
    return amount * silverPrice;
  }
  return amount;
}

/**
 * Local Nisab calculation
 */
export function useLocalNisab(goldPrice: number, silverPrice: number) {
  return {
    gold: zakatApi.calculateNisabGold(goldPrice),
    silver: zakatApi.calculateNisabSilver(silverPrice),
    // Most scholars use silver nisab as it's more beneficial to the poor
    recommended: zakatApi.calculateNisabSilver(silverPrice),
  };
}
