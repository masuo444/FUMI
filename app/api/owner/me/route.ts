import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners')
    .select('id, plan, created_at, stripe_subscription_id, pro_expires_at')
    .eq('email', user.email!)
    .single()

  if (!owner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(owner)
}
