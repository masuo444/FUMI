import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { addWalletBalance } from '@/lib/wallet'
import { CREDIT_TOPUP_RATE } from '@/types'
import Stripe from 'stripe'

// 1 credit = $0.001 USD. $1 paid → 1000 * CREDIT_TOPUP_RATE credits.
function usdToCredits(amountUsd: number): number {
  return Math.floor(amountUsd * 1000 * CREDIT_TOPUP_RATE)
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CREDITS_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type !== 'translation_credit') {
      return NextResponse.json({ received: true })
    }

    const ownerId = session.metadata.owner_id
    const amountUsd = Number(session.metadata.amount_usd ?? 0)
    if (!ownerId || !amountUsd) return NextResponse.json({ received: true })

    // Idempotency guard
    const { count } = await supabase
      .from('wallet_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('reference_type', 'stripe_charge')
      .eq('reference_id', session.id)
    if (count && count > 0) return NextResponse.json({ received: true })

    const credits = usdToCredits(amountUsd)
    await addWalletBalance(supabase, ownerId, credits)
    await supabase.from('wallet_transactions').insert({
      owner_id: ownerId,
      type: 'charge',
      amount: credits,
      reference_type: 'stripe_charge',
      reference_id: session.id,
      note: `Credit top-up: $${amountUsd} → ${credits} credits`,
    })
  }

  return NextResponse.json({ received: true })
}
