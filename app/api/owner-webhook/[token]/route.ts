import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  const supabase = await createServiceClient()

  // トークンからWebhook設定を取得
  const { data: webhookConfig } = await supabase
    .from('owner_stripe_webhooks')
    .select('owner_id, salon_id, stripe_webhook_secret')
    .eq('webhook_token', token)
    .maybeSingle()

  if (!webhookConfig) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // オーナーのWebhook Secretで署名検証
  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookConfig.stripe_webhook_secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // checkout.session.completed → メール抽出 → 会員自動追加
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email ?? session.customer_email
    if (!email) return NextResponse.json({ ok: true })

    // 既存会員チェック
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('salon_id', webhookConfig.salon_id)
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      await supabase.from('members').insert({
        salon_id: webhookConfig.salon_id,
        email,
        name: session.customer_details?.name ?? null,
        preferred_language: 'ja',
        status: 'active',
      })
    } else {
      // 退会済みの場合は復活
      await supabase.from('members').update({ status: 'active' })
        .eq('salon_id', webhookConfig.salon_id)
        .eq('email', email)
    }
  }

  return NextResponse.json({ ok: true })
}
