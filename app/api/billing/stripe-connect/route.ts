import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — サロンのWebhook設定取得
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'Missing salon_id' }, { status: 400 })

  const { data } = await supabase
    .from('owner_stripe_webhooks')
    .select('id, webhook_token, salon_id')
    .eq('salon_id', salonId)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

// POST — Webhook設定を保存
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners')
    .select('id, plan')
    .eq('email', user.email!)
    .single()
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  if (owner.plan !== 'pro') return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })

  const { salon_id, stripe_webhook_secret } = await request.json()
  if (!salon_id || !stripe_webhook_secret) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // upsert
  const { data, error } = await supabase
    .from('owner_stripe_webhooks')
    .upsert({ owner_id: owner.id, salon_id, stripe_webhook_secret }, { onConflict: 'salon_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — Webhook設定を削除
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'Missing salon_id' }, { status: 400 })

  await supabase.from('owner_stripe_webhooks').delete().eq('salon_id', salonId)
  return NextResponse.json({ ok: true })
}
