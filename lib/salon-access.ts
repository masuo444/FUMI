/**
 * Shared helpers for checking salon access (owner OR co-admin).
 * Always uses service client (passed in) to bypass RLS on new tables.
 */
import type { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

/** All salon IDs the given owner can access (owned + co-admin). */
export async function getAccessibleSalonIds(
  service: ServiceClient,
  ownerId: string,
): Promise<string[]> {
  const [{ data: owned }, { data: coAdmin }] = await Promise.all([
    service.from('salons').select('id').eq('owner_id', ownerId),
    service.from('salon_admins').select('salon_id').eq('owner_id', ownerId),
  ])
  const ids = [
    ...(owned ?? []).map((s: any) => s.id as string),
    ...(coAdmin ?? []).map((s: any) => s.salon_id as string),
  ]
  return [...new Set(ids)]
}

/** True if the owner can access (owns OR is co-admin of) the given salon. */
export async function canAccessSalon(
  service: ServiceClient,
  ownerId: string,
  salonId: string,
): Promise<boolean> {
  const [{ data: owned }, { data: coAdmin }] = await Promise.all([
    service.from('salons').select('id').eq('id', salonId).eq('owner_id', ownerId).maybeSingle(),
    service.from('salon_admins').select('salon_id').eq('salon_id', salonId).eq('owner_id', ownerId).maybeSingle(),
  ])
  return !!(owned || coAdmin)
}

/** True if the owner is the PRIMARY owner (not just a co-admin) of the salon. */
export async function isPrimaryOwner(
  service: ServiceClient,
  ownerId: string,
  salonId: string,
): Promise<boolean> {
  const { data } = await service
    .from('salons')
    .select('id')
    .eq('id', salonId)
    .eq('owner_id', ownerId)
    .maybeSingle()
  return !!data
}
