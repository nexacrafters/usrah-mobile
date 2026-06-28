/**
 * Receipt API Service
 *
 * Attaches a receipt photo to an existing transaction via a multipart PATCH to
 * the transaction detail endpoint. The transaction's `public_id` is
 * client-generated and identical on the server after sync, so this can run
 * right after a `syncNow()` has pushed the new transaction.
 *
 * This is best-effort: every failure is swallowed and surfaced as `null` so a
 * receipt upload never blocks saving the expense itself.
 */

import apiClient from './client';

export interface ReceiptAsset {
  uri: string;
  fileName?: string | null;
  type?: string | null;
}

/**
 * Upload a receipt image for the given transaction.
 * Returns the stored receipt URL on success, or null on any failure.
 */
export async function uploadReceipt(
  publicId: string,
  asset: ReceiptAsset,
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('receipt', {
      uri: asset.uri,
      name: asset.fileName || 'receipt.jpg',
      type: asset.type || 'image/jpeg',
    } as any);

    const response = await apiClient.patch(
      `/expenses/transactions/${publicId}/`,
      form,
      {headers: {'Content-Type': 'multipart/form-data'}},
    );

    const receipt = (response.data as {receipt?: string | null})?.receipt;
    return typeof receipt === 'string' ? receipt : null;
  } catch {
    // Best-effort: never throw into the caller.
    return null;
  }
}

export default {uploadReceipt};
