/**
 * Atomic wallet operations backed by Postgres RPC functions.
 *
 * Why RPC instead of application-level read-then-write?
 * The UPDATE ... WHERE balance >= p_amount in deduct_wallet_balance
 * is a single atomic SQL statement — no window for concurrent reads
 * to see a stale balance.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export type DeductResult =
  | { success: true; newBalance: number }
  | { success: false; reason: 'insufficient_balance' }

/**
 * Atomically subtract `amount` from the owner's wallet.
 * Returns success=false if balance < amount (no side effects).
 * Throws on unexpected DB errors.
 */
export async function deductWalletBalance(
  supabase: SupabaseClient,
  ownerId: string,
  amount: number
): Promise<DeductResult> {
  const { data, error } = await supabase.rpc('deduct_wallet_balance', {
    p_owner_id: ownerId,
    p_amount: amount,
  })

  if (error) {
    if (error.message.includes('insufficient_balance')) {
      return { success: false, reason: 'insufficient_balance' }
    }
    throw new Error(`deductWalletBalance failed: ${error.message}`)
  }

  return { success: true, newBalance: data as number }
}

/**
 * Atomically add `amount` to the owner's wallet.
 * Used for charges (Stripe) and refunds (translation failure).
 * Returns the new balance.
 */
export async function addWalletBalance(
  supabase: SupabaseClient,
  ownerId: string,
  amount: number
): Promise<number> {
  const { data, error } = await supabase.rpc('add_wallet_balance', {
    p_owner_id: ownerId,
    p_amount: amount,
  })

  if (error) {
    throw new Error(`addWalletBalance failed: ${error.message}`)
  }

  return data as number
}
