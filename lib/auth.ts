/**
 * Server-side auth helper for owner pages.
 * Uses service client for owner lookup to bypass RLS circular reference.
 */
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export function isAdminEmail(email: string) {
  return ADMIN_EMAIL !== '' && email === ADMIN_EMAIL
}

export async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()
  const { data: owner } = await service
    .from('owners')
    .select('id')
    .eq('email', user.email!)
    .single()
  if (!owner) redirect('/login')

  return {
    user,
    owner: owner as { id: string },
    supabase,
    service,
    isAdmin: isAdminEmail(user.email!),
  }
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdminEmail(user.email!)) redirect('/dashboard')

  const service = await createServiceClient()
  return { user, service }
}
