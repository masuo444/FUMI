import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { addWalletBalance } from '@/lib/wallet'
import { SUBSCRIPTION_CREDIT_GRANT } from '@/types'
import Stripe from 'stripe'

async function grantSubscriptionCredits(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ownerId: string,
  refId: string
) {
  // Idempotency: don't double-grant credits for the same period
  const { count } = await supabase
    .from('wallet_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('reference_type', 'subscription_grant')
    .eq('reference_id', refId)
  if (count && count > 0) return

  await addWalletBalance(supabase, ownerId, SUBSCRIPTION_CREDIT_GRANT)
  await supabase.from('wallet_transactions').insert({
    owner_id: ownerId,
    type: 'charge',
    amount: SUBSCRIPTION_CREDIT_GRANT,
    reference_type: 'subscription_grant',
    reference_id: refId,
    note: `Monthly credit grant: ${SUBSCRIPTION_CREDIT_GRANT} credits`,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // 新規サブスク → plan: pro に更新 + 初回クレジット付与
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type !== 'pro_subscription') return NextResponse.json({ ok: true })

    const ownerId = session.metadata.owner_id
    const subscriptionId = session.subscription as string
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const firstItem = subscription.items.data[0]
    const periodEnd = (firstItem as any).current_period_end ?? (subscription as any).current_period_end
    const expiresAt = new Date(periodEnd * 1000).toISOString()

    await supabase.from('owners').update({
      plan: 'pro',
      stripe_subscription_id: subscriptionId,
      pro_expires_at: expiresAt,
    }).eq('id', ownerId)

    // 初回クレジット付与
    await grantSubscriptionCredits(supabase, ownerId, `checkout_${session.id}`)
  }

  // 毎月の請求成功 → クレジット補充
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = (invoice as any).subscription as string | null
    if (!subscriptionId) return NextResponse.json({ ok: true })

    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    if (!owner) return NextResponse.json({ ok: true })

    // checkout.session.completed と重複しないよう invoice.id をキーに使う
    await grantSubscriptionCredits(supabase, owner.id, `invoice_${invoice.id}`)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('stripe_customer_id', sub.customer as string)
      .maybeSingle()
    if (!owner) return NextResponse.json({ ok: true })

    const firstItem = sub.items.data[0]
    const periodEnd = (firstItem as any).current_period_end ?? (sub as any).current_period_end
    const expiresAt = new Date(periodEnd * 1000).toISOString()
    const plan = sub.status === 'active' ? 'pro' : 'free'
    await supabase.from('owners').update({ plan, pro_expires_at: expiresAt }).eq('id', owner.id)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('stripe_customer_id', sub.customer as string)
      .maybeSingle()
    if (owner) {
      await supabase.from('owners').update({
        plan: 'free',
        stripe_subscription_id: null,
        pro_expires_at: null,
      }).eq('id', owner.id)
    }
  }

  return NextResponse.json({ ok: true })
}
